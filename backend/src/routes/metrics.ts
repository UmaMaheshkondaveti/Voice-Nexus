import { Router } from 'express';
import { listSessions } from '../store/callStore.js';
import { computeMetrics } from '../services/metricsService.js';

export const metricsRouter = Router();

metricsRouter.get('/', (_req, res) => {
  res.json(computeMetrics(listSessions()));
});
