import { Router } from 'express';
import type { DemoAccountOption } from '../../../shared/types.js';
import { ACCOUNTS } from '../data/accounts.js';

export const demoAccountsRouter = Router();

demoAccountsRouter.get('/', (_req, res) => {
  const options: DemoAccountOption[] = ACCOUNTS.map((a) => ({ phoneNumber: a.phoneNumber, fullName: a.fullName }));
  res.json(options);
});
