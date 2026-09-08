import { Router } from 'express';
import { listSessions } from '../store/callStore.js';
import { computeMetrics } from '../services/metricsService.js';
import { requireRole } from '../middleware/auth.js';

export const metricsRouter = Router();

// Analytics are an Operations/Admin permission per the RBAC model — Agents don't get a nav
// entry for this either, but the backend enforces it independently of the UI hiding it.
metricsRouter.get('/', requireRole('operations', 'admin'), (_req, res) => {
  res.json(computeMetrics(listSessions()));
});
