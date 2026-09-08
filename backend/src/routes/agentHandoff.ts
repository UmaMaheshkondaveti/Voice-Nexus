import { Router } from 'express';
import { getSession, listSessions } from '../store/callStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';

export const agentHandoffRouter = Router();

// Any signed-in internal role (agent/operations/admin) can work the escalation queue.
agentHandoffRouter.use(requireRole('agent', 'operations', 'admin'));

agentHandoffRouter.get('/', (_req, res) => {
  const escalations = listSessions()
    .filter((s) => s.escalation)
    .map((s) => ({
      id: s.id,
      phoneNumber: s.phoneNumber,
      callerName: s.callerName,
      status: s.status,
      intent: s.intent,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      escalated: true,
      escalation: s.escalation!,
      agentNotes: s.agentNotes,
    }));
  res.json({ escalations });
});

agentHandoffRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = getSession(req.params.id);
    if (!session || !session.escalation) {
      res.status(404).json({ error: 'escalation_not_found' });
      return;
    }
    if (typeof req.body?.agentNotes === 'string') {
      session.agentNotes = req.body.agentNotes;
    }
    res.json({ id: session.id, agentNotes: session.agentNotes });
  }),
);

agentHandoffRouter.post(
  '/:id/resolve',
  asyncHandler(async (req, res) => {
    const session = getSession(req.params.id);
    if (!session || !session.escalation) {
      res.status(404).json({ error: 'escalation_not_found' });
      return;
    }
    if (typeof req.body?.agentNotes === 'string') {
      session.agentNotes = req.body.agentNotes;
    }
    session.status = 'ended';
    if (!session.endedAt) session.endedAt = new Date().toISOString();
    res.json({ id: session.id, status: session.status, agentNotes: session.agentNotes });
  }),
);
