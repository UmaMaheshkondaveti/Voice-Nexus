import type { NextFunction, Request, Response } from 'express';

/**
 * VoiceNexus has no real backend user/session store — the web app's login is a
 * local/demo auth layer (see frontend/src/auth/AuthContext.tsx). To keep
 * authorization from being purely client-side, the frontend sends the signed-in
 * operator's role on every request via this header, and internal-facing routes
 * (anything only the agent/operations/admin web app calls — never the customer
 * voice simulator, which stays unauthenticated like a real inbound call) verify
 * it here before doing anything.
 */
export type InternalRole = 'agent' | 'operations' | 'admin';

const VALID_ROLES: InternalRole[] = ['agent', 'operations', 'admin'];
const ROLE_HEADER = 'x-vn-role';

export function requireRole(...allowed: InternalRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.header(ROLE_HEADER) as InternalRole | undefined;
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(401).json({ error: 'missing_role', message: 'This request requires a signed-in VoiceNexus operator.' });
      return;
    }
    if (!allowed.includes(role)) {
      res.status(403).json({ error: 'insufficient_role', required: allowed });
      return;
    }
    next();
  };
}
