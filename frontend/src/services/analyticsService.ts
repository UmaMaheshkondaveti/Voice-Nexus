import type { DateRangeValue } from '../components/ui/DateRangeFilter';
import type {
  AIPerformance,
  CallVolumeData,
  CallVolumePoint,
  EscalationAnalytics,
  IntentBreakdownItem,
  IntentKey,
  MetricDatum,
  OverviewMetrics,
  ResolutionBreakdown,
  SystemHealthItem,
} from '../types/analytics';
import { INTENT_LABELS } from '../types/analytics';

/*
 * Mock analytics layer.
 *
 * VoiceNexus's real backend does not yet expose contact-center trend/aggregate
 * analytics endpoints — only /api/metrics, /api/calls and /api/escalations
 * (real, single-tenant data — Live Calls, Call History, and the Agent
 * Workspace all use those directly, not this file). Every function below is
 * illustrative demo data for the Dashboard's trend charts and the deeper
 * Analytics pages, deterministic per date-range so the UI doesn't flicker
 * between renders.
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
