export type CallStatus = 'connecting' | 'in-progress' | 'escalated' | 'ended';

export type Intent = 'billing' | 'plan_change' | 'account' | 'tech_triage' | 'scheduling' | 'unknown';

export type VerificationLevel = 'none' | 'ani' | 'ani+kba';

export interface Appointment {
  id: string;
  type: string;
  windowStart: string;
  windowEnd: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

export interface TechTicket {
  id: string;
  issue: string;
  status: 'open' | 'resolved';
}

export interface Account {
  phoneNumber: string;
  accountId: string;
  fullName: string;
  planName: string;
  planPrice: number;
  balanceDue: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  serviceAddress: string;
  serviceStatus: 'active' | 'suspended' | 'past_due';
  kbaQuestion: string;
  scheduledAppointments: Appointment[];
  openTickets: TechTicket[];
}

/** Account shape safe to send to the browser — never includes the KBA answer. */
export type PublicAccount = Account;

export interface ToolCallDebug {
  tool: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface Turn {
  id: string;
  role: 'caller' | 'assistant' | 'system-event';
  text: string;
  timestamp: string;
  toolCall?: ToolCallDebug;
}

export type EscalationUrgency = 'low' | 'medium' | 'high';

export interface EscalationPayload {
  reason: string;
  summary: string;
  /** What the customer is actually trying to accomplish, in their own terms. */
  customerIssue: string;
  /** What resolution the customer wants to walk away with. */
  desiredOutcome: string;
  /** Concrete facts surfaced in the call a human agent shouldn't have to re-ask for (order/ticket numbers, amounts, dates, names, etc.). */
  keyFacts: string[];
  urgency: EscalationUrgency;
  /** AI-generated suggestion for what the human agent should do next, specific to this call. */
  recommendedNextAction: string;
  attemptedSteps: string[];
  verifiedIdentity: boolean;
  verificationLevel: VerificationLevel;
  callerName?: string;
  accountId?: string;
  intent: Intent;
  callbackRequested?: boolean;
  escalatedAt: string;
}

export interface CallSession {
  id: string;
  phoneNumber: string;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  identityVerified: boolean;
  verificationLevel: VerificationLevel;
  accountId?: string;
  callerName?: string;
  intent: Intent;
  transcript: Turn[];
  transactionsCompleted: string[];
  escalation?: EscalationPayload;
  /** Notes a human agent recorded while handling this call after escalation. */
  agentNotes?: string;
}

export interface CallSummary {
  id: string;
  phoneNumber: string;
  callerName?: string;
  status: CallStatus;
  intent: Intent;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  escalated: boolean;
  identityVerified: boolean;
  verificationLevel: VerificationLevel;
  escalationReason?: string;
}

export interface Metrics {
  totalCalls: number;
  containmentRate: number;
  transferRate: number;
  avgHandleTimeSeconds: number;
  intentDistribution: Record<Intent, number>;
  escalationReasons: Record<string, number>;
}

export interface DemoAccountOption {
  phoneNumber: string;
  fullName: string;
}
