import type { DateRangeValue } from '../components/ui/DateRangeFilter';
import type {
  AIPerformance,
  CallFilters,
  CallVolumeData,
  CallVolumePoint,
  EnrichedCall,
  EscalationAnalytics,
  IntentBreakdownItem,
  IntentKey,
  LiveOpsCall,
  MetricDatum,
  OverviewMetrics,
  ResolutionBreakdown,
  SystemHealthItem,
  WorkflowStage,
  AuthStatus,
} from '../types/analytics';
import { INTENT_LABELS } from '../types/analytics';

/*
 * Mock analytics layer.
 *
 * VoiceNexus's real backend does not yet expose contact-center analytics
 * endpoints — only /api/metrics, /api/calls and /api/escalations (basic,
 * single-tenant counts). Every function below is the single source of demo
 * data for the Dashboard, Call History and related drill-downs, deterministic
 * per date-range so the UI doesn't flicker between renders, but still
 * "live enough" (getLiveOps) to feel like a running system.
 *
 * Swap point for real integration: replace each function body with a fetch
 * against a future `/api/analytics/*` endpoint that returns the same shape.
 */

function delay(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rangeDays(range: DateRangeValue): number {
  const start = new Date(range.start).getTime();
  const end = new Date(range.end).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function scaleFactor(range: DateRangeValue): number {
  return rangeDays(range) / 7;
}

function seededRng(range: DateRangeValue, salt: string) {
  return mulberry32(hashString(`${range.key}:${range.start}:${range.end}:${salt}`));
}

function trendSeries(rng: () => number, base: number, points = 12, volatility = 0.12): number[] {
  const series: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current = Math.max(0, current + (rng() - 0.5) * base * volatility);
    series.push(Math.round(current * 100) / 100);
  }
  return series;
}

function metric(rng: () => number, base: number, volatility = 0.1): MetricDatum {
  const value = Math.max(0, base * (1 + (rng() - 0.5) * volatility));
  const deltaPct = (rng() - 0.45) * 0.3;
  return { value: Math.round(value * 100) / 100, deltaPct: Math.round(deltaPct * 1000) / 1000, trend: trendSeries(rng, value, 12, volatility) };
}

export async function getOverviewMetrics(range: DateRangeValue): Promise<OverviewMetrics> {
  await delay();
  const rng = seededRng(range, 'overview');
  const sf = scaleFactor(range);

  const totalCalls = metric(rng, 3400 * sf, 0.14);
  const escalatedCalls = metric(rng, totalCalls.value * 0.18, 0.2);
  const abandonedCalls = metric(rng, totalCalls.value * 0.04, 0.3);
  const automatedCalls = metric(rng, totalCalls.value - escalatedCalls.value - abandonedCalls.value, 0.08);
  const containedCalls = metric(rng, automatedCalls.value * 0.86, 0.08);

  return {
    totalCalls,
    activeCalls: metric(rng, Math.max(3, 6 * sf), 0.4),
    automatedCalls,
    containedCalls,
    escalatedCalls,
    abandonedCalls,
    avgHandleTimeSeconds: metric(rng, 214, 0.12),
    containmentRate: metric(rng, 0.74, 0.06),
    transferRate: metric(rng, 0.18, 0.15),
    resolutionRate: metric(rng, 0.81, 0.05),
    csat: metric(rng, 4.3, 0.05),
    estimatedCostSavings: metric(rng, totalCalls.value * 4.35, 0.1),
  };
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
});

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export async function getCallVolume(range: DateRangeValue): Promise<CallVolumeData> {
  await delay();
  const rng = seededRng(range, 'volume');
  const sf = scaleFactor(range);

  function buildBucket(label: string, weight: number): CallVolumePoint {
    const total = Math.round(Math.max(0, weight * sf * 140 * (1 + (rng() - 0.5) * 0.35)));
    const escalated = Math.round(total * (0.12 + rng() * 0.1));
    return { bucket: label, total, automated: total - escalated, escalated };
  }

  const byHour = HOUR_LABELS.map((label, h) => {
    const businessCurve = Math.exp(-Math.pow(h - 14, 2) / 40);
    return buildBucket(label, 0.15 + businessCurve);
  });

  const byDay = DAY_LABELS.map((label, i) => buildBucket(label, i < 5 ? 1 : 0.45));

  const peakHour = byHour.reduce((max, p) => (p.total > max.total ? p : max), byHour[0]);

  return { byHour, byDay, peakLabel: `${peakHour.bucket} is the peak period` };
}

const INTENT_KEYS: IntentKey[] = ['billing', 'account', 'plan', 'outage', 'tech_support', 'scheduling', 'other'];
const INTENT_WEIGHTS: Record<IntentKey, number> = {
  billing: 0.27,
  account: 0.18,
  tech_support: 0.19,
  outage: 0.14,
  plan: 0.12,
  scheduling: 0.07,
  other: 0.03,
};

export async function getIntentBreakdown(range: DateRangeValue): Promise<IntentBreakdownItem[]> {
  await delay();
  const rng = seededRng(range, 'intents');
  const sf = scaleFactor(range);
  const base = 3400 * sf;

  return INTENT_KEYS.map((key) => ({
    key,
    label: INTENT_LABELS[key],
    count: Math.round(base * INTENT_WEIGHTS[key] * (1 + (rng() - 0.5) * 0.2)),
  })).sort((a, b) => b.count - a.count);
}

export async function getResolutionBreakdown(range: DateRangeValue): Promise<ResolutionBreakdown> {
  await delay();
  const rng = seededRng(range, 'resolution');
  const sf = scaleFactor(range);
  const base = 3400 * sf;

  const resolved = base * (0.66 + rng() * 0.05);
  const partial = base * (0.1 + rng() * 0.03);
  const escalated = base * (0.18 + rng() * 0.03);
  const failed = Math.max(0, base - resolved - partial - escalated);

  return {
    resolved: Math.round(resolved),
    partial: Math.round(partial),
    escalated: Math.round(escalated),
    failed: Math.round(failed),
  };
}

const ESCALATION_REASONS = [
  'Low intent confidence',
  'Authentication failure',
  'Unsupported request',
  'Backend/API failure',
  'Workflow failure',
  'Customer requested agent',
];

const ESCALATION_DESTINATIONS = ['Tier 1 Support', 'Billing Specialists', 'Technical Support', 'Retention Desk', 'Field Dispatch'];

export async function getEscalationAnalytics(range: DateRangeValue): Promise<EscalationAnalytics> {
  await delay();
  const rng = seededRng(range, 'escalations');
  const sf = scaleFactor(range);
  const base = 610 * sf;

  const reasonWeights = [0.28, 0.16, 0.14, 0.12, 0.12, 0.18];
  const destWeights = [0.32, 0.22, 0.24, 0.12, 0.1];

  return {
    reasons: ESCALATION_REASONS.map((label, i) => ({
      key: label.toLowerCase().replace(/[^a-z]+/g, '-'),
      label,
      count: Math.round(base * reasonWeights[i] * (1 + (rng() - 0.5) * 0.25)),
    })).sort((a, b) => b.count - a.count),
    destinations: ESCALATION_DESTINATIONS.map((label, i) => ({
      key: label.toLowerCase().replace(/[^a-z]+/g, '-'),
      label,
      count: Math.round(base * destWeights[i] * (1 + (rng() - 0.5) * 0.25)),
    })).sort((a, b) => b.count - a.count),
    avgEscalationTimeSeconds: Math.round(38 + rng() * 24),
    contextCompletenessRate: Math.round((0.88 + rng() * 0.08) * 1000) / 1000,
  };
}

export async function getAIPerformance(range: DateRangeValue): Promise<AIPerformance> {
  await delay();
  const rng = seededRng(range, 'ai-performance');

  const intentConfidence = 0.9 + rng() * 0.06;
  const recognitionAccuracy = 0.93 + rng() * 0.05;
  const fallbackRate = 0.03 + rng() * 0.03;
  const avgResponseLatencyMs = 380 + rng() * 180;

  return {
    intentConfidence: Math.round(intentConfidence * 1000) / 1000,
    recognitionAccuracy: Math.round(recognitionAccuracy * 1000) / 1000,
    fallbackRate: Math.round(fallbackRate * 1000) / 1000,
    avgResponseLatencyMs: Math.round(avgResponseLatencyMs),
    intentConfidenceTrend: trendSeries(rng, intentConfidence * 100, 12, 0.03),
    recognitionAccuracyTrend: trendSeries(rng, recognitionAccuracy * 100, 12, 0.03),
    fallbackRateTrend: trendSeries(rng, fallbackRate * 100, 12, 0.2),
    latencyTrend: trendSeries(rng, avgResponseLatencyMs, 12, 0.15),
  };
}

const SERVICES: { key: SystemHealthItem['key']; label: string }[] = [
  { key: 'telephony', label: 'Telephony' },
  { key: 'stt', label: 'Speech-to-text' },
  { key: 'tts', label: 'Text-to-speech' },
  { key: 'ai-orchestration', label: 'AI orchestration' },
  { key: 'backend-apis', label: 'Backend APIs' },
  { key: 'database', label: 'Database' },
  { key: 'integrations', label: 'Integrations' },
];

export async function getSystemHealth(): Promise<SystemHealthItem[]> {
  await delay(180);
  const rng = mulberry32(hashString(`health:${Math.floor(Date.now() / 60_000)}`));

  return SERVICES.map((svc) => {
    const roll = rng();
    const status: SystemHealthItem['status'] = roll > 0.97 ? 'degraded' : roll > 0.995 ? 'down' : 'operational';
    return {
      ...svc,
      status,
      uptimePct: Math.round((status === 'operational' ? 99.5 + rng() * 0.49 : 97 + rng() * 2) * 100) / 100,
      latencyMs: Math.round(40 + rng() * 160),
      lastIncident: status === 'operational' ? undefined : '12 minutes ago',
    };
  });
}

export interface SystemEvent {
  id: string;
  service: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: string;
}

const SYSTEM_EVENTS: SystemEvent[] = [
  { id: 'evt-1', service: 'OSS/BSS', message: 'Elevated latency on outage-lookup endpoint (avg 640ms)', level: 'warn', timestamp: '2026-09-07T15:20:00Z' },
  { id: 'evt-2', service: 'Backend APIs', message: 'Deployed v2.14.0 — no downtime', level: 'info', timestamp: '2026-09-07T09:05:00Z' },
  { id: 'evt-3', service: 'Speech-to-text', message: 'Provider failover triggered, recovered in 42s', level: 'error', timestamp: '2026-09-06T22:47:00Z' },
  { id: 'evt-4', service: 'Database', message: 'Scheduled maintenance completed', level: 'info', timestamp: '2026-09-06T03:00:00Z' },
  { id: 'evt-5', service: 'Integrations', message: 'Identity provider connection lost', level: 'error', timestamp: '2026-09-05T11:12:00Z' },
  { id: 'evt-6', service: 'AI orchestration', message: 'Model latency back to baseline after brief spike', level: 'info', timestamp: '2026-09-04T14:30:00Z' },
];

export async function getSystemEvents(): Promise<SystemEvent[]> {
  await delay(150);
  return SYSTEM_EVENTS;
}

const CALLER_NAMES = [
  'Maria Chen', 'James Patel', 'Aisha Khan', 'Robert Diaz', 'Emily Novak', 'Daniel Osei',
  'Sofia Rossi', 'Liam Murphy', 'Grace Kim', 'Noah Fischer', 'Olivia Santos', 'Ethan Brooks',
];

const WORKFLOW_STAGES: WorkflowStage[] = ['greeting', 'intent-detection', 'authentication', 'account-lookup', 'action', 'confirmation', 'wrap-up'];
const AUTH_STATUSES: AuthStatus[] = ['verified', 'verified', 'verified', 'pending', 'failed', 'not-required'];

let liveCallIdSeq = 0;

function spawnLiveCall(): LiveOpsCall {
  const rng = Math.random;
  return {
    id: `live-${liveCallIdSeq++}`,
    callerLabel: CALLER_NAMES[Math.floor(rng() * CALLER_NAMES.length)],
    intent: INTENT_KEYS[Math.floor(rng() * INTENT_KEYS.length)],
    intentConfidence: Math.round((0.7 + rng() * 0.29) * 100) / 100,
    durationSeconds: Math.floor(rng() * 15),
    authStatus: AUTH_STATUSES[Math.floor(rng() * AUTH_STATUSES.length)],
    workflowStage: WORKFLOW_STAGES[0],
  };
}

let liveCalls: LiveOpsCall[] | null = null;

/**
 * Persistent, evolving mock "active calls" pool — each call keeps its identity
 * across polls (duration ticks up, workflow stage advances) instead of being
 * regenerated from scratch, so selecting a call in the UI doesn't lose it a
 * few seconds later. A call occasionally completes and is replaced by a new one.
 */
export async function getLiveOps(): Promise<LiveOpsCall[]> {
  await delay(150);
  const rng = Math.random;

  if (!liveCalls) {
    liveCalls = Array.from({ length: 3 + Math.floor(rng() * 4) }, () => spawnLiveCall());
  }

  liveCalls = liveCalls
    .map((call) => {
      const advanced = { ...call, durationSeconds: call.durationSeconds + 4 };
      const stageIdx = WORKFLOW_STAGES.indexOf(call.workflowStage);
      if (stageIdx < WORKFLOW_STAGES.length - 1 && rng() < 0.35) {
        advanced.workflowStage = WORKFLOW_STAGES[stageIdx + 1];
      }
      if (call.authStatus === 'pending' && rng() < 0.5) {
        advanced.authStatus = rng() < 0.85 ? 'verified' : 'failed';
      }
      return advanced;
    })
    .filter((call) => !(call.workflowStage === 'wrap-up' && rng() < 0.25));

  if (liveCalls.length < 3 || rng() < 0.15) {
    liveCalls = [...liveCalls, spawnLiveCall()];
  }
  if (liveCalls.length > 8) {
    liveCalls = liveCalls.slice(-8);
  }

  return liveCalls;
}

const ESCALATION_REASON_TEMPLATES: Record<string, string> = {
  'low-intent-confidence': 'Low intent confidence',
  'authentication-failure': 'Authentication failure',
  'unsupported-request': 'Unsupported request',
  'backend-api-failure': 'Backend/API failure',
  'workflow-failure': 'Workflow failure',
  'customer-requested-agent': 'Customer requested agent',
};

function buildTimeline(rng: () => number, call: Omit<EnrichedCall, 'timeline' | 'transcriptSnippet'>) {
  const start = new Date(call.startedAt).getTime();
  const events: EnrichedCall['timeline'] = [
    { label: 'Call started', timestamp: new Date(start).toISOString() },
    { label: 'Intent detected', timestamp: new Date(start + 4000).toISOString(), detail: INTENT_LABELS[call.intent] },
  ];
  if (call.authStatus !== 'not-required') {
    events.push({
      label: 'Identity verified',
      timestamp: new Date(start + 18000).toISOString(),
      detail: call.authStatus === 'verified' ? 'ANI + KBA passed' : call.authStatus === 'failed' ? 'Verification failed' : 'In progress',
    });
  }
  events.push({ label: 'Account retrieved', timestamp: new Date(start + 24000).toISOString() });
  events.push({ label: 'Workflow started', timestamp: new Date(start + 30000).toISOString(), detail: INTENT_LABELS[call.intent] });
  events.push({ label: 'Action executed', timestamp: new Date(start + 60000).toISOString() });
  if (call.escalated) {
    events.push({
      label: 'Escalated to agent',
      timestamp: new Date(start + call.durationSeconds * 1000).toISOString(),
      detail: call.escalationReason ? ESCALATION_REASON_TEMPLATES[call.escalationReason] ?? call.escalationReason : undefined,
    });
  } else {
    events.push({ label: 'Resolved', timestamp: new Date(start + call.durationSeconds * 1000).toISOString() });
  }
  return events;
}

function buildTranscript(intent: IntentKey): EnrichedCall['transcriptSnippet'] {
  const openers: Record<IntentKey, string> = {
    billing: 'I was charged twice on my last bill.',
    account: 'I need to update my service address.',
    plan: 'I want to see if there is a cheaper plan available.',
    outage: 'My internet has stopped working since this morning.',
    tech_support: 'My router keeps disconnecting every few minutes.',
    scheduling: 'I need to schedule a technician visit.',
    other: 'I have a question about my account.',
  };
  return [
    { speaker: 'caller', text: openers[intent] },
    { speaker: 'assistant', text: 'I can help with that — first let me verify your identity.' },
    { speaker: 'caller', text: 'Sure, go ahead.' },
    { speaker: 'assistant', text: 'Thanks, you are verified. Let me take a look at your account now.' },
  ];
}

function generateCall(seed: string): EnrichedCall {
  const rng = mulberry32(hashString(seed));
  const intent = INTENT_KEYS[Math.floor(rng() * INTENT_KEYS.length)];
  const escalated = rng() < 0.22;
  const resolution: EnrichedCall['resolution'] = escalated
    ? rng() < 0.5
      ? 'escalated'
      : 'partial'
    : rng() < 0.9
      ? 'resolved'
      : 'failed';
  const minutesAgo = Math.floor(rng() * 60 * 24 * 14);
  const startedAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const durationSeconds = Math.floor(60 + rng() * 420);
  const authStatus: AuthStatus = AUTH_STATUSES[Math.floor(rng() * AUTH_STATUSES.length)];
  const escalationReasonKey = escalated
    ? Object.keys(ESCALATION_REASON_TEMPLATES)[Math.floor(rng() * Object.keys(ESCALATION_REASON_TEMPLATES).length)]
    : undefined;

  const base: Omit<EnrichedCall, 'timeline' | 'transcriptSnippet'> = {
    id: seed,
    callerName: rng() < 0.85 ? CALLER_NAMES[Math.floor(rng() * CALLER_NAMES.length)] : undefined,
    phoneNumber: `+1 ${Math.floor(200 + rng() * 700)}-555-${String(Math.floor(rng() * 10000)).padStart(4, '0')}`,
    startedAt,
    durationSeconds,
    intent,
    intentConfidence: Math.round((0.65 + rng() * 0.34) * 100) / 100,
    authStatus,
    status: 'ended',
    resolution,
    escalated,
    escalationReason: escalationReasonKey,
    destinationQueue: escalated ? ESCALATION_DESTINATIONS[Math.floor(rng() * ESCALATION_DESTINATIONS.length)] : undefined,
    transferredToAgent: escalated,
    csat: rng() < 0.7 ? Math.round((2.5 + rng() * 2.5) * 10) / 10 : undefined,
    workflowStage: escalated ? 'wrap-up' : WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1],
  };

  return { ...base, timeline: buildTimeline(rng, base), transcriptSnippet: buildTranscript(intent) };
}

let callPool: EnrichedCall[] | null = null;

function ensureCallPool(): EnrichedCall[] {
  if (!callPool) {
    callPool = Array.from({ length: 180 }, (_, i) => generateCall(`call-${i}`));
  }
  return callPool;
}

export async function getCalls(filters: CallFilters = {}): Promise<EnrichedCall[]> {
  await delay();
  let rows = ensureCallPool();

  if (filters.status) rows = rows.filter((c) => c.status === filters.status);
  if (filters.intent) rows = rows.filter((c) => c.intent === filters.intent);
  if (filters.resolution) rows = rows.filter((c) => c.resolution === filters.resolution);
  if (filters.escalationReason) rows = rows.filter((c) => c.escalationReason === filters.escalationReason);
  if (filters.escalated) rows = rows.filter((c) => c.escalated === (filters.escalated === 'true'));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (c) => c.callerName?.toLowerCase().includes(q) || c.phoneNumber.toLowerCase().includes(q) || c.id.includes(q),
    );
  }

  return [...rows].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export interface CustomerExperienceData {
  csat: MetricDatum;
  resolutionRate: MetricDatum;
  repeatCallRate: MetricDatum;
  csatDistribution: { score: string; count: number }[];
}

export async function getCustomerExperience(range: DateRangeValue): Promise<CustomerExperienceData> {
  await delay();
  const rng = seededRng(range, 'cx');
  const sf = scaleFactor(range);
  const total = Math.round(1200 * sf);
  const weights = [0.03, 0.05, 0.12, 0.32, 0.48];

  return {
    csat: metric(rng, 4.3, 0.05),
    resolutionRate: metric(rng, 0.81, 0.05),
    repeatCallRate: metric(rng, 0.09, 0.2),
    csatDistribution: weights.map((w, i) => ({
      score: `${i + 1} star${i === 0 ? '' : 's'}`,
      count: Math.max(0, Math.round(total * w * (1 + (rng() - 0.5) * 0.2))),
    })),
  };
}

export interface CostPerformanceData {
  automatedCostPerCall: MetricDatum;
  escalatedCostPerCall: MetricDatum;
  costPerResolvedCall: MetricDatum;
  estimatedSavings: MetricDatum;
  transferVolumeTrend: { period: string; transfers: number }[];
}

export async function getCostPerformance(range: DateRangeValue): Promise<CostPerformanceData> {
  await delay();
  const rng = seededRng(range, 'cost');
  const sf = scaleFactor(range);

  return {
    automatedCostPerCall: metric(rng, 0.35, 0.1),
    escalatedCostPerCall: metric(rng, 4.85, 0.08),
    costPerResolvedCall: metric(rng, 1.1, 0.12),
    estimatedSavings: metric(rng, 3400 * sf * 4.35, 0.1),
    transferVolumeTrend: trendSeries(rng, 610 * sf, 12, 0.2).map((v, i) => ({ period: `P${i + 1}`, transfers: Math.round(v) })),
  };
}

export async function getCallById(id: string): Promise<EnrichedCall | null> {
  await delay(120);
  return ensureCallPool().find((c) => c.id === id) ?? null;
}

/** Builds a drawer-ready detail record for a Live Operations row (an in-progress call, not yet in the completed call pool). */
export function liveOpsCallToDetail(call: LiveOpsCall): EnrichedCall {
  const rng = mulberry32(hashString(call.id));
  const startedAt = new Date(Date.now() - call.durationSeconds * 1000).toISOString();
  const base: Omit<EnrichedCall, 'timeline' | 'transcriptSnippet'> = {
    id: call.id,
    callerName: call.callerLabel,
    phoneNumber: '—',
    startedAt,
    durationSeconds: call.durationSeconds,
    intent: call.intent,
    intentConfidence: call.intentConfidence,
    authStatus: call.authStatus,
    status: 'in-progress',
    resolution: 'partial',
    escalated: false,
    transferredToAgent: false,
    workflowStage: call.workflowStage,
  };
  return { ...base, timeline: buildTimeline(rng, base), transcriptSnippet: buildTranscript(call.intent) };
}
