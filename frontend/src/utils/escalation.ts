const REASON_LABELS: Record<string, string> = {
  out_of_scope: 'Out of supported scope',
  caller_requested_human: 'Caller asked for a human',
  kba_failed_twice: 'Identity verification failed twice',
  fraud_dispute: 'Fraud / billing dispute raised',
  legal_dispute: 'Legal concern raised',
  tool_error: 'Backend/API error',
  orchestrator_iteration_limit: 'AI could not resolve within its step budget',
};

const RECOMMENDED_ACTIONS: Record<string, string> = {
  out_of_scope: 'Handle directly — the request falls outside the AI’s five supported intents.',
  caller_requested_human: 'Continue the conversation live; no special handling needed beyond what the caller asked for.',
  kba_failed_twice: 'Re-verify identity through an alternate method before discussing or changing the account.',
  fraud_dispute: 'Route to the fraud/billing disputes team. Do not confirm account specifics until identity is re-verified.',
  legal_dispute: 'Route to a specialist trained for legal or dispute handling.',
  tool_error: 'A backend call failed mid-conversation — retry the customer’s request manually.',
  orchestrator_iteration_limit: 'The AI ran out of steps working the request — pick up from the AI summary below.',
};

function humanize(code: string): string {
  return code
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function escalationReasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? humanize(reason);
}

export function recommendedNextAction(reason: string): string {
  return RECOMMENDED_ACTIONS[reason] ?? 'Review the AI summary and transcript below, then continue from where it left off.';
}
