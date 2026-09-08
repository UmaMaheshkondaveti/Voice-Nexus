import type { CallSummary, Intent } from '@shared/types';

export const INTENT_LABELS: Record<Intent, string> = {
  billing: 'Billing',
  plan_change: 'Plan change',
  account: 'Account',
  tech_triage: 'Technical support',
  scheduling: 'Scheduling',
  unknown: 'Unknown',
};

export function authLabel(call: Pick<CallSummary, 'identityVerified' | 'verificationLevel'>): string {
  if (!call.identityVerified) return 'Not verified';
  return call.verificationLevel === 'ani+kba' ? 'ANI + KBA' : 'ANI only';
}
