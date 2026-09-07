import { Router } from 'express';
import { listSessions } from '../store/callStore.js';

export const agentHandoffRouter = Router();

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
    }));
  res.json({ escalations });
});
