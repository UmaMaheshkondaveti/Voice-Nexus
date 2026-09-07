import type { IntentKey } from './analytics';

export interface IntentDefinition {
  id: string;
  key: IntentKey;
  name: string;
  description: string;
  utterances: string[];
  confidenceThreshold: number;
  authRequired: boolean;
  workflowId?: string;
  primaryAction: string;
  escalationRule: string;
  status: 'active' | 'disabled' | 'draft';
  languages: string[];
  usageCount: number;
  successRate: number;
}

export type WorkflowNodeType =
  | 'start'
  | 'detect-intent'
  | 'ask-question'
  | 'authenticate'
  | 'retrieve-account'
  | 'api-request'
  | 'condition'
  | 'confirmation'
  | 'payment'
  | 'plan-change'
  | 'technical-diagnostic'
  | 'schedule-appointment'
  | 'transfer-agent'
  | 'schedule-callback'
  | 'end';

export const WORKFLOW_NODE_LABELS: Record<WorkflowNodeType, string> = {
  start: 'Start',
  'detect-intent': 'Detect intent',
  'ask-question': 'Ask question',
  authenticate: 'Authenticate',
  'retrieve-account': 'Retrieve account',
  'api-request': 'API request',
  condition: 'Condition',
  confirmation: 'Confirmation',
  payment: 'Payment',
  'plan-change': 'Plan change',
  'technical-diagnostic': 'Technical diagnostic',
  'schedule-appointment': 'Schedule appointment',
  'transfer-agent': 'Transfer to agent',
  'schedule-callback': 'Schedule callback',
  end: 'End',
};

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  col: number;
  row: number;
  detail?: string;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export type WorkflowStatus = 'draft' | 'testing' | 'published' | 'disabled';

export interface WorkflowVersion {
  version: number;
  status: WorkflowStatus;
  updatedAt: string;
  note: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  retryCount: number;
  timeoutSeconds: number;
  escalateOnFailure: boolean;
  history: WorkflowVersion[];
}

export interface PronunciationOverride {
  term: string;
  pronunciation: string;
}

export interface VoiceConfig {
  provider: string;
  voice: string;
  speed: number;
  pitch: number;
  pronunciationOverrides: PronunciationOverride[];
  greeting: string;
  holdMessage: string;
  closingMessage: string;
}

export interface ConversationConfig {
  silenceTimeoutSeconds: number;
  interruptionHandling: 'allow' | 'ignore';
  retryCount: number;
  confirmationBehavior: 'always' | 'sensitive-only' | 'never';
  turnTimeoutSeconds: number;
}

export interface AIGuardrailConfig {
  intentConfidenceThreshold: number;
  escalationThreshold: number;
  unsupportedRequestBehavior: 'apologize-and-escalate' | 'ask-clarifying-question';
  requireConfirmationForSensitiveActions: boolean;
}

export interface DisclosureConfig {
  aiDisclosure: string;
  recordingDisclosure: string;
  transferDisclosure: string;
  privacyMessage: string;
}

export interface VoiceAndAIConfig {
  voice: VoiceConfig;
  conversation: ConversationConfig;
  guardrails: AIGuardrailConfig;
  disclosures: DisclosureConfig;
}

export interface LanguageConfigItem {
  code: string;
  label: string;
  enabled: boolean;
  isDefault: boolean;
  voice: string;
  fallbackCode: string;
}

export type PromptStatus = 'draft' | 'published';

export interface PromptSlot {
  key: string;
  label: string;
  category: string;
  draftText: string;
  publishedText: string;
  status: PromptStatus;
  updatedAt: string;
}

export interface AuthSettings {
  aniMatchingEnabled: boolean;
  kbaEnabled: boolean;
  mfaEnabled: boolean;
  retryLimit: number;
  timeoutSeconds: number;
}

export interface AISafetyRule {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface SensitiveActionRule {
  key: string;
  label: string;
  requireConfirmation: boolean;
}

export interface PrivacySettings {
  piiMasking: boolean;
  transcriptRetentionDays: number;
  recordingRetentionDays: number;
  allowDataDeletionRequests: boolean;
}

export interface GuardrailsConfig {
  aiSafety: AISafetyRule[];
  sensitiveActions: SensitiveActionRule[];
  privacy: PrivacySettings;
}

export type IntegrationCategory = 'Telephony' | 'Identity' | 'Customer Systems' | 'Contact Center' | 'Analytics' | 'Recording';
export type IntegrationStatus = 'connected' | 'disconnected' | 'demo';

export interface IntegrationLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  health: 'operational' | 'degraded' | 'down' | 'maintenance';
  lastSuccessfulConnection?: string;
  description: string;
  logs: IntegrationLogEntry[];
}

export interface BrandConfig {
  companyName: string;
  logoInitials: string;
  brandColor: string;
  tagline: string;
}
