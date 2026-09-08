import type { HealthStatus } from '../components/ui/StatusDot';

export type IntentKey = 'billing' | 'account' | 'plan' | 'outage' | 'tech_support' | 'scheduling' | 'other';

export const INTENT_LABELS: Record<IntentKey, string> = {
  billing: 'Billing',
  account: 'Account',
  plan: 'Plan',
  outage: 'Outage',
  tech_support: 'Technical support',
  scheduling: 'Scheduling',
  other: 'Other',
};

export interface MetricDatum {
  value: number;
  deltaPct: number;
  trend: number[];
}

export interface OverviewMetrics {
  totalCalls: MetricDatum;
  activeCalls: MetricDatum;
  automatedCalls: MetricDatum;
  containedCalls: MetricDatum;
  escalatedCalls: MetricDatum;
  abandonedCalls: MetricDatum;
  avgHandleTimeSeconds: MetricDatum;
  containmentRate: MetricDatum;
  transferRate: MetricDatum;
  resolutionRate: MetricDatum;
  csat: MetricDatum;
  estimatedCostSavings: MetricDatum;
}

export interface CallVolumePoint {
  bucket: string;
  total: number;
  automated: number;
  escalated: number;
}

export interface CallVolumeData {
  byHour: CallVolumePoint[];
  byDay: CallVolumePoint[];
  peakLabel: string;
}

export interface IntentBreakdownItem {
  key: IntentKey;
  label: string;
  count: number;
}

export interface ResolutionBreakdown {
  resolved: number;
  partial: number;
  escalated: number;
  failed: number;
}

export interface EscalationReasonItem {
  key: string;
  label: string;
  count: number;
}

export interface EscalationDestinationItem {
  key: string;
  label: string;
  count: number;
}

export interface EscalationAnalytics {
  reasons: EscalationReasonItem[];
  destinations: EscalationDestinationItem[];
  avgEscalationTimeSeconds: number;
  contextCompletenessRate: number;
}

export interface AIPerformance {
  intentConfidence: number;
  recognitionAccuracy: number;
  fallbackRate: number;
  avgResponseLatencyMs: number;
  intentConfidenceTrend: number[];
  recognitionAccuracyTrend: number[];
  fallbackRateTrend: number[];
  latencyTrend: number[];
}

export type ServiceKey =
  | 'telephony'
  | 'stt'
  | 'tts'
  | 'ai-orchestration'
  | 'backend-apis'
  | 'database'
  | 'integrations';

export interface SystemHealthItem {
  key: ServiceKey;
  label: string;
  status: HealthStatus;
  uptimePct: number;
  latencyMs: number;
  lastIncident?: string;
}
