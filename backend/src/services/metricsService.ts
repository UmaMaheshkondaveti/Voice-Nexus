import type { Intent, Metrics } from '../../../shared/types.js';
import type { InternalCallSession } from '../store/callStore.js';

const INTENTS: Intent[] = ['billing', 'plan_change', 'account', 'tech_triage', 'scheduling', 'unknown'];

export function computeMetrics(sessions: InternalCallSession[]): Metrics {
  const terminal = sessions.filter((s) => s.status === 'ended' || s.status === 'escalated');
  const total = terminal.length;
  const escalated = terminal.filter((s) => !!s.escalation);

  const intentDistribution = Object.fromEntries(INTENTS.map((i) => [i, 0])) as Record<Intent, number>;
  for (const s of terminal) intentDistribution[s.intent] += 1;

  const escalationReasons: Record<string, number> = {};
  for (const s of escalated) {
    const reason = s.escalation!.reason;
    escalationReasons[reason] = (escalationReasons[reason] ?? 0) + 1;
  }

  const durations = terminal
    .filter((s) => s.endedAt)
    .map((s) => (Date.parse(s.endedAt!) - Date.parse(s.startedAt)) / 1000);
  const avgHandleTimeSeconds = durations.length
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  return {
    totalCalls: total,
    containmentRate: total ? (total - escalated.length) / total : 0,
    transferRate: total ? escalated.length / total : 0,
    avgHandleTimeSeconds,
    intentDistribution,
    escalationReasons,
  };
}
