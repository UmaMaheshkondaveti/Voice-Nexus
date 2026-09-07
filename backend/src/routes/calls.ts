import { Router } from 'express';
import type { CallSummary } from '../../../shared/types.js';
import { createSession, getSession, listSessions, toPublicSession } from '../store/callStore.js';
import { findAccountByPhone } from '../data/accounts.js';
import { runTurn } from '../llm/orchestrator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const callsRouter = Router();

callsRouter.get('/', (_req, res) => {
  const summaries: CallSummary[] = listSessions().map((s) => ({
    id: s.id,
    phoneNumber: s.phoneNumber,
    callerName: s.callerName,
    status: s.status,
    intent: s.intent,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSeconds: s.endedAt ? (Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 1000 : undefined,
    escalated: !!s.escalation,
  }));
  res.json({ calls: summaries });
});

callsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const phoneNumber = String(req.body?.phoneNumber ?? '');
    if (!phoneNumber) {
      res.status(400).json({ error: 'phoneNumber is required' });
      return;
    }
    const account = findAccountByPhone(phoneNumber);
    const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = createSession(id, phoneNumber, account?.fullName);
    await runTurn(session, null);
    res.status(201).json({ session: toPublicSession(session) });
  }),
);

callsRouter.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'call_not_found' });
    return;
  }
  res.json({ session: toPublicSession(session) });
});

callsRouter.post(
  '/:id/turns',
  asyncHandler(async (req, res) => {
    const session = getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'call_not_found' });
      return;
    }
    if (session.status === 'escalated' || session.status === 'ended') {
      res.status(409).json({ error: 'call_not_active' });
      return;
    }
    const text = String(req.body?.text ?? '');
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const assistantText = await runTurn(session, text);
    res.json({ session: toPublicSession(session), assistantText });
  }),
);

callsRouter.post('/:id/end', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'call_not_found' });
    return;
  }
  if (session.status !== 'escalated' && session.status !== 'ended') {
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
  }
  res.json({ session: toPublicSession(session) });
});
