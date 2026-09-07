import type {
  AuthSettings,
  BrandConfig,
  GuardrailsConfig,
  IntegrationDefinition,
  IntentDefinition,
  LanguageConfigItem,
  PromptSlot,
  VoiceAndAIConfig,
  WorkflowDefinition,
} from '../types/config';

/*
 * Mock configuration/admin layer for Intents, Workflows, Voice & AI, Languages,
 * Prompts and Authentication. VoiceNexus's real backend does not yet expose
 * admin/config endpoints, so this module holds the working "database" for the
 * session (module-level state, mutated in place) — the same swap point pattern
 * as services/analyticsService.ts. Replace each function body with a real API
 * call once a config backend exists; the shapes are the contract.
 */

function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Intents
// ---------------------------------------------------------------------------

const INTENT_KEYWORDS: Record<string, string[]> = {
  billing: ['bill', 'billing', 'charge', 'charged', 'invoice', 'payment', 'overcharged', 'refund', 'balance'],
  account: ['account', 'address', 'update my', 'profile', 'email', 'name change', 'move'],
  plan: ['plan', 'upgrade', 'downgrade', 'cheaper', 'pricing', 'switch plan', 'data cap'],
  outage: ['outage', 'everyone in my', 'my neighbors', 'my area', 'my street', 'my building', 'service is down'],
  tech_support: [
    'router', 'wifi', 'wi-fi', 'disconnect', 'slow', 'troubleshoot', 'technical', 'reset', 'modem',
    'not working', 'stopped working', 'no internet', 'internet has stopped', 'internet is down',
  ],
  scheduling: ['schedule', 'appointment', 'technician', 'visit', 'reschedule', 'book a'],
};

let intents: IntentDefinition[] = [
  {
    id: 'int-billing',
    key: 'billing',
    name: 'Billing Inquiry',
    description: 'Customer disputes a charge, asks about their balance, or requests a refund.',
    utterances: [
      'I was charged twice on my last bill',
      "Why is my bill higher than usual?",
      'I need a refund for an overcharge',
      "What's my current balance?",
    ],
    confidenceThreshold: 0.75,
    authRequired: true,
    workflowId: 'wf-billing',
    primaryAction: 'Review billing dispute',
    escalationRule: 'Escalate if dispute exceeds $200 or account is past due',
    status: 'active',
    languages: ['en-US', 'es-US'],
    usageCount: 918,
    successRate: 0.81,
  },
  {
    id: 'int-account',
    key: 'account',
    name: 'Account Update',
    description: 'Customer wants to update account profile details such as address or contact info.',
    utterances: ['I need to update my service address', 'Can you change my email on file?', 'I moved, update my account'],
    confidenceThreshold: 0.7,
    authRequired: true,
    workflowId: 'wf-account',
    primaryAction: 'Update account profile',
    escalationRule: 'Escalate if identity cannot be verified',
    status: 'active',
    languages: ['en-US', 'es-US'],
    usageCount: 591,
    successRate: 0.88,
  },
  {
    id: 'int-plan',
    key: 'plan',
    name: 'Plan Change',
    description: 'Customer wants to upgrade, downgrade, or compare service plans.',
    utterances: ['I want to see if there is a cheaper plan available', 'Can I upgrade my plan?', 'What plans do you offer?'],
    confidenceThreshold: 0.7,
    authRequired: true,
    workflowId: 'wf-plan',
    primaryAction: 'Compare and change plan',
    escalationRule: 'Escalate on contract or promotional pricing questions',
    status: 'active',
    languages: ['en-US'],
    usageCount: 402,
    successRate: 0.79,
  },
  {
    id: 'int-outage',
    key: 'outage',
    name: 'Service Outage',
    description: 'Customer reports a total loss of service, often area-wide.',
    utterances: ['My internet has been down all day', "There's an outage in my area", 'No internet since this morning'],
    confidenceThreshold: 0.8,
    authRequired: true,
    workflowId: 'wf-outage',
    primaryAction: 'Check service status',
    escalationRule: 'Escalate if no known outage matches the account address',
    status: 'active',
    languages: ['en-US', 'es-US'],
    usageCount: 471,
    successRate: 0.74,
  },
  {
    id: 'int-tech',
    key: 'tech_support',
    name: 'Technical Support',
    description: 'Customer has a device or connectivity issue that needs troubleshooting.',
    utterances: ['My internet has stopped working', 'My router keeps disconnecting every few minutes', 'My wifi is very slow'],
    confidenceThreshold: 0.75,
    authRequired: true,
    workflowId: 'wf-outage',
    primaryAction: 'Run diagnostics',
    escalationRule: 'Escalate after 2 failed automated diagnostic attempts',
    status: 'active',
    languages: ['en-US', 'es-US'],
    usageCount: 645,
    successRate: 0.69,
  },
  {
    id: 'int-scheduling',
    key: 'scheduling',
    name: 'Appointment Scheduling',
    description: 'Customer wants to book, reschedule, or cancel a technician visit.',
    utterances: ['I need to schedule a technician visit', 'Can I reschedule my appointment?', 'Book a service visit'],
    confidenceThreshold: 0.7,
    authRequired: false,
    workflowId: 'wf-scheduling',
    primaryAction: 'Book technician visit',
    escalationRule: 'Escalate if no appointment slots are available within 5 days',
    status: 'active',
    languages: ['en-US'],
    usageCount: 231,
    successRate: 0.92,
  },
];

export async function getIntents(): Promise<IntentDefinition[]> {
  await delay();
  return intents;
}

export async function getIntentById(id: string): Promise<IntentDefinition | null> {
  await delay(120);
  return intents.find((i) => i.id === id) ?? null;
}

export async function saveIntent(data: IntentDefinition): Promise<IntentDefinition> {
  await delay();
  const idx = intents.findIndex((i) => i.id === data.id);
  if (idx === -1) intents = [...intents, data];
  else intents = intents.map((i) => (i.id === data.id ? data : i));
  return data;
}

export async function createIntent(partial: Omit<IntentDefinition, 'id' | 'usageCount' | 'successRate'>): Promise<IntentDefinition> {
  await delay();
  const created: IntentDefinition = { ...partial, id: uid('int'), usageCount: 0, successRate: 0 };
  intents = [...intents, created];
  return created;
}

export async function deleteIntent(id: string): Promise<void> {
  await delay();
  intents = intents.filter((i) => i.id !== id);
}

export async function setIntentStatus(id: string, status: IntentDefinition['status']): Promise<void> {
  await delay(150);
  intents = intents.map((i) => (i.id === id ? { ...i, status } : i));
}

export interface IntentTestResult {
  utterance: string;
  matched: IntentDefinition | null;
  confidence: number;
  authRequired: boolean;
  workflowName: string | null;
  action: string;
  belowThreshold: boolean;
}

export async function testIntentUtterance(utterance: string): Promise<IntentTestResult> {
  await delay(420);
  const normalized = utterance.toLowerCase();

  let best: { intent: IntentDefinition; score: number } | null = null;
  for (const intent of intents) {
    const keywords = INTENT_KEYWORDS[intent.key] ?? [];
    const hits = keywords.filter((kw) => normalized.includes(kw)).length;
    const score = Math.min(1, hits / 2);
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }

  if (!best) {
    return {
      utterance,
      matched: null,
      confidence: Math.round((0.25 + Math.random() * 0.2) * 100) / 100,
      authRequired: false,
      workflowName: null,
      action: 'Ask clarifying question or offer agent transfer',
      belowThreshold: true,
    };
  }

  const confidence = Math.min(0.98, Math.round((0.6 + best.score * 0.32 + Math.random() * 0.06) * 100) / 100);
  const workflow = workflows.find((w) => w.id === best!.intent.workflowId);

  return {
    utterance,
    matched: best.intent,
    confidence,
    authRequired: best.intent.authRequired,
    workflowName: workflow?.name ?? null,
    action: best.intent.primaryAction,
    belowThreshold: confidence < best.intent.confidenceThreshold,
  };
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

let workflows: WorkflowDefinition[] = [
  {
    id: 'wf-outage',
    name: 'Internet Troubleshooting',
    description: 'Verifies identity, checks for a known outage, and runs remote diagnostics before transferring.',
    status: 'published',
    version: 3,
    retryCount: 2,
    timeoutSeconds: 45,
    escalateOnFailure: true,
    history: [
      { version: 1, status: 'draft', updatedAt: '2026-08-02T10:00:00Z', note: 'Initial draft' },
      { version: 2, status: 'testing', updatedAt: '2026-08-14T15:30:00Z', note: 'Added service-status check before diagnostic' },
      { version: 3, status: 'published', updatedAt: '2026-08-21T09:15:00Z', note: 'Published after successful test run' },
    ],
    nodes: [
      { id: 'n1', type: 'start', label: 'Start', col: 0, row: 0 },
      { id: 'n2', type: 'detect-intent', label: 'Detect intent', col: 0, row: 1 },
      { id: 'n3', type: 'authenticate', label: 'Authenticate', col: 0, row: 2 },
      { id: 'n4', type: 'retrieve-account', label: 'Retrieve account', col: 0, row: 3 },
      { id: 'n5', type: 'api-request', label: 'Check service status', col: 0, row: 4, detail: 'OSS/BSS outage lookup' },
      { id: 'n6', type: 'technical-diagnostic', label: 'Run diagnostic', col: 0, row: 5 },
      { id: 'n7', type: 'condition', label: 'Resolved?', col: 0, row: 6 },
      { id: 'n8', type: 'confirmation', label: 'Confirm resolution', col: 1, row: 7 },
      { id: 'n9', type: 'end', label: 'End', col: 1, row: 8 },
      { id: 'n10', type: 'transfer-agent', label: 'Transfer to agent', col: -1, row: 7, detail: 'Technical Support queue' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n7' },
      { id: 'e7', from: 'n7', to: 'n8', label: 'Yes' },
      { id: 'e8', from: 'n7', to: 'n10', label: 'No' },
      { id: 'e9', from: 'n8', to: 'n9' },
    ],
  },
  {
    id: 'wf-billing',
    name: 'Billing Dispute Resolution',
    description: 'Looks up the disputed charge and either issues a credit automatically or transfers with context.',
    status: 'published',
    version: 2,
    retryCount: 1,
    timeoutSeconds: 30,
    escalateOnFailure: true,
    history: [
      { version: 1, status: 'draft', updatedAt: '2026-07-10T12:00:00Z', note: 'Initial draft' },
      { version: 2, status: 'published', updatedAt: '2026-07-22T09:00:00Z', note: 'Added $200 auto-credit threshold' },
    ],
    nodes: [
      { id: 'n1', type: 'start', label: 'Start', col: 0, row: 0 },
      { id: 'n2', type: 'detect-intent', label: 'Detect intent', col: 0, row: 1 },
      { id: 'n3', type: 'authenticate', label: 'Authenticate', col: 0, row: 2 },
      { id: 'n4', type: 'retrieve-account', label: 'Retrieve account', col: 0, row: 3 },
      { id: 'n5', type: 'api-request', label: 'Look up charge', col: 0, row: 4, detail: 'Billing API' },
      { id: 'n6', type: 'condition', label: 'Under $200?', col: 0, row: 5 },
      { id: 'n7', type: 'payment', label: 'Issue credit', col: 1, row: 6 },
      { id: 'n8', type: 'end', label: 'End', col: 1, row: 7 },
      { id: 'n9', type: 'transfer-agent', label: 'Transfer to agent', col: -1, row: 6, detail: 'Billing Specialists queue' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n7', label: 'Yes' },
      { id: 'e7', from: 'n6', to: 'n9', label: 'No' },
      { id: 'e8', from: 'n7', to: 'n8' },
    ],
  },
  {
    id: 'wf-plan',
    name: 'Plan Change',
    description: 'Compares available plans and confirms a switch after authentication.',
    status: 'testing',
    version: 1,
    retryCount: 1,
    timeoutSeconds: 30,
    escalateOnFailure: false,
    history: [{ version: 1, status: 'testing', updatedAt: '2026-08-30T11:00:00Z', note: 'In test with internal QA accounts' }],
    nodes: [
      { id: 'n1', type: 'start', label: 'Start', col: 0, row: 0 },
      { id: 'n2', type: 'detect-intent', label: 'Detect intent', col: 0, row: 1 },
      { id: 'n3', type: 'authenticate', label: 'Authenticate', col: 0, row: 2 },
      { id: 'n4', type: 'retrieve-account', label: 'Retrieve account', col: 0, row: 3 },
      { id: 'n5', type: 'plan-change', label: 'Compare plans', col: 0, row: 4 },
      { id: 'n6', type: 'confirmation', label: 'Confirm change', col: 0, row: 5 },
      { id: 'n7', type: 'end', label: 'End', col: 0, row: 6 },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n7' },
    ],
  },
  {
    id: 'wf-account',
    name: 'Account Update',
    description: 'Updates account profile fields after identity verification.',
    status: 'published',
    version: 1,
    retryCount: 1,
    timeoutSeconds: 30,
    escalateOnFailure: false,
    history: [{ version: 1, status: 'published', updatedAt: '2026-06-18T09:00:00Z', note: 'Initial release' }],
    nodes: [
      { id: 'n1', type: 'start', label: 'Start', col: 0, row: 0 },
      { id: 'n2', type: 'detect-intent', label: 'Detect intent', col: 0, row: 1 },
      { id: 'n3', type: 'authenticate', label: 'Authenticate', col: 0, row: 2 },
      { id: 'n4', type: 'retrieve-account', label: 'Retrieve account', col: 0, row: 3 },
      { id: 'n5', type: 'api-request', label: 'Update profile', col: 0, row: 4, detail: 'CRM API' },
      { id: 'n6', type: 'confirmation', label: 'Confirm update', col: 0, row: 5 },
      { id: 'n7', type: 'end', label: 'End', col: 0, row: 6 },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n7' },
    ],
  },
  {
    id: 'wf-scheduling',
    name: 'Appointment Scheduling',
    description: 'Books or reschedules a technician visit against available slots.',
    status: 'published',
    version: 2,
    retryCount: 1,
    timeoutSeconds: 30,
    escalateOnFailure: true,
    history: [
      { version: 1, status: 'draft', updatedAt: '2026-05-02T09:00:00Z', note: 'Initial draft' },
      { version: 2, status: 'published', updatedAt: '2026-05-12T09:00:00Z', note: 'Added no-availability escalation' },
    ],
    nodes: [
      { id: 'n1', type: 'start', label: 'Start', col: 0, row: 0 },
      { id: 'n2', type: 'detect-intent', label: 'Detect intent', col: 0, row: 1 },
      { id: 'n3', type: 'retrieve-account', label: 'Retrieve account', col: 0, row: 2 },
      { id: 'n4', type: 'schedule-appointment', label: 'Find available slot', col: 0, row: 3 },
      { id: 'n5', type: 'condition', label: 'Slot found?', col: 0, row: 4 },
      { id: 'n6', type: 'confirmation', label: 'Confirm appointment', col: 1, row: 5 },
      { id: 'n7', type: 'end', label: 'End', col: 1, row: 6 },
      { id: 'n8', type: 'transfer-agent', label: 'Transfer to agent', col: -1, row: 5, detail: 'Field Dispatch queue' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6', label: 'Yes' },
      { id: 'e6', from: 'n5', to: 'n8', label: 'No' },
      { id: 'e7', from: 'n6', to: 'n7' },
    ],
  },
];

export async function getWorkflows(): Promise<WorkflowDefinition[]> {
  await delay();
  return workflows;
}

export async function getWorkflowById(id: string): Promise<WorkflowDefinition | null> {
  await delay(150);
  return workflows.find((w) => w.id === id) ?? null;
}

function validateWorkflow(wf: WorkflowDefinition): string[] {
  const problems: string[] = [];
  const startNodes = wf.nodes.filter((n) => n.type === 'start');
  const endNodes = wf.nodes.filter((n) => n.type === 'end' || n.type === 'transfer-agent');
  if (startNodes.length !== 1) problems.push('A workflow must have exactly one Start node.');
  if (endNodes.length === 0) problems.push('A workflow must have at least one End or Transfer-to-agent node.');
  const reachable = new Set<string>();
  const queue = startNodes.map((n) => n.id);
  while (queue.length) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    wf.edges.filter((e) => e.from === id).forEach((e) => queue.push(e.to));
  }
  const unreachable = wf.nodes.filter((n) => !reachable.has(n.id));
  if (unreachable.length > 0) problems.push(`${unreachable.length} node(s) are not reachable from Start.`);
  return problems;
}

export async function validateWorkflowById(id: string): Promise<string[]> {
  await delay(200);
  const wf = workflows.find((w) => w.id === id);
  if (!wf) return ['Workflow not found.'];
  return validateWorkflow(wf);
}

export async function publishWorkflow(id: string): Promise<{ ok: boolean; problems: string[] }> {
  await delay(300);
  const wf = workflows.find((w) => w.id === id);
  if (!wf) return { ok: false, problems: ['Workflow not found.'] };
  const problems = validateWorkflow(wf);
  if (problems.length > 0) return { ok: false, problems };
  workflows = workflows.map((w) =>
    w.id === id
      ? {
          ...w,
          status: 'published',
          version: w.version + 1,
          history: [...w.history, { version: w.version + 1, status: 'published', updatedAt: new Date().toISOString(), note: 'Published' }],
        }
      : w,
  );
  return { ok: true, problems: [] };
}

export async function setWorkflowStatus(id: string, status: WorkflowDefinition['status']): Promise<void> {
  await delay(200);
  workflows = workflows.map((w) => (w.id === id ? { ...w, status } : w));
}

export async function rollbackWorkflow(id: string, version: number): Promise<void> {
  await delay(250);
  workflows = workflows.map((w) =>
    w.id === id
      ? {
          ...w,
          version,
          history: [...w.history, { version, status: w.status, updatedAt: new Date().toISOString(), note: `Rolled back to v${version}` }],
        }
      : w,
  );
}

// ---------------------------------------------------------------------------
// Voice & AI configuration
// ---------------------------------------------------------------------------

let voiceAndAIConfig: VoiceAndAIConfig = {
  voice: {
    provider: 'VoiceNexus Neural TTS',
    voice: 'Aria (Neural, US English)',
    speed: 1,
    pitch: 1,
    pronunciationOverrides: [
      { term: 'VoiceNexus', pronunciation: 'Voice Nexus' },
      { term: 'OSS/BSS', pronunciation: 'O-S-S B-S-S' },
    ],
    greeting: "Thanks for calling — you've reached VoiceNexus. How can I help you today?",
    holdMessage: 'Give me just a moment while I look into that for you.',
    closingMessage: 'Thanks for calling VoiceNexus. Have a great day!',
  },
  conversation: {
    silenceTimeoutSeconds: 6,
    interruptionHandling: 'allow',
    retryCount: 2,
    confirmationBehavior: 'sensitive-only',
    turnTimeoutSeconds: 12,
  },
  guardrails: {
    intentConfidenceThreshold: 0.72,
    escalationThreshold: 0.4,
    unsupportedRequestBehavior: 'apologize-and-escalate',
    requireConfirmationForSensitiveActions: true,
  },
  disclosures: {
    aiDisclosure: "You're speaking with VoiceNexus, an AI assistant. You can ask to speak with a human agent at any time.",
    recordingDisclosure: 'This call may be recorded for quality and training purposes.',
    transferDisclosure: "I'm transferring you to a specialist now — they'll see everything we've discussed.",
    privacyMessage: 'Your information is used only to service this request and is handled per our privacy policy.',
  },
};

export async function getVoiceAndAIConfig(): Promise<VoiceAndAIConfig> {
  await delay();
  return voiceAndAIConfig;
}

export async function updateVoiceAndAIConfig(next: VoiceAndAIConfig): Promise<VoiceAndAIConfig> {
  await delay(300);
  voiceAndAIConfig = next;
  return voiceAndAIConfig;
}

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

let languages: LanguageConfigItem[] = [
  { code: 'en-US', label: 'English (US)', enabled: true, isDefault: true, voice: 'Aria (Neural, US English)', fallbackCode: '' },
  { code: 'es-US', label: 'Spanish (US)', enabled: true, isDefault: false, voice: 'Camila (Neural, US Spanish)', fallbackCode: 'en-US' },
  { code: 'fr-CA', label: 'French (Canada)', enabled: false, isDefault: false, voice: 'Antoine (Neural, Canadian French)', fallbackCode: 'en-US' },
  { code: 'zh-CN', label: 'Mandarin (Simplified)', enabled: false, isDefault: false, voice: 'Wei (Neural, Mandarin)', fallbackCode: 'en-US' },
];

export async function getLanguages(): Promise<LanguageConfigItem[]> {
  await delay();
  return languages;
}

export async function updateLanguage(code: string, patch: Partial<LanguageConfigItem>): Promise<void> {
  await delay(200);
  languages = languages.map((l) => (l.code === code ? { ...l, ...patch } : l));
}

export async function setDefaultLanguage(code: string): Promise<void> {
  await delay(200);
  languages = languages.map((l) => ({ ...l, isDefault: l.code === code, enabled: l.code === code ? true : l.enabled }));
}

export async function addLanguage(item: LanguageConfigItem): Promise<void> {
  await delay(200);
  languages = [...languages, item];
}

export async function removeLanguage(code: string): Promise<void> {
  await delay(200);
  languages = languages.filter((l) => l.code !== code);
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

let prompts: PromptSlot[] = [
  { key: 'greeting', label: 'Greeting', category: 'Opening', draftText: "Thanks for calling — you've reached VoiceNexus. How can I help you today?", publishedText: "Thanks for calling — you've reached VoiceNexus. How can I help you today?", status: 'published', updatedAt: '2026-08-01T09:00:00Z' },
  { key: 'welcome', label: 'Welcome back', category: 'Opening', draftText: 'Welcome back! I can see your account — what can I help with today?', publishedText: 'Welcome back! I can see your account — what can I help with today?', status: 'published', updatedAt: '2026-08-01T09:00:00Z' },
  { key: 'authentication', label: 'Authentication request', category: 'Verification', draftText: 'For your security, can you confirm the last 4 digits of the phone number on file?', publishedText: 'For your security, can you confirm the last 4 digits of the phone number on file?', status: 'published', updatedAt: '2026-07-15T09:00:00Z' },
  { key: 'confirmation', label: 'Action confirmation', category: 'Verification', draftText: "Just to confirm — I'll go ahead and {{action}}. Should I proceed?", publishedText: "Just to confirm — I'll go ahead and {{action}}. Should I proceed?", status: 'published', updatedAt: '2026-07-15T09:00:00Z' },
  { key: 'hold', label: 'Hold message', category: 'In-call', draftText: 'Give me just a moment while I look into that for you.', publishedText: 'Give me just a moment while I look into that for you.', status: 'published', updatedAt: '2026-06-01T09:00:00Z' },
  { key: 'error', label: 'Error / fallback', category: 'In-call', draftText: "I'm sorry, I didn't quite catch that — could you say that a different way?", publishedText: "I'm sorry, I didn't catch that — could you rephrase?", status: 'draft', updatedAt: '2026-09-02T09:00:00Z' },
  { key: 'escalation', label: 'Escalation handoff', category: 'Escalation', draftText: "I'm not able to complete this safely, so I'm connecting you with a specialist who can help further.", publishedText: "I'm not able to complete this safely, so I'm connecting you with a specialist who can help further.", status: 'published', updatedAt: '2026-06-20T09:00:00Z' },
  { key: 'callback', label: 'Callback offer', category: 'Escalation', draftText: 'All our agents are currently busy — would you like me to schedule a callback instead?', publishedText: 'All our agents are currently busy — would you like me to schedule a callback instead?', status: 'published', updatedAt: '2026-06-20T09:00:00Z' },
  { key: 'closing', label: 'Closing', category: 'Closing', draftText: 'Thanks for calling VoiceNexus. Have a great day!', publishedText: 'Thanks for calling VoiceNexus. Have a great day!', status: 'published', updatedAt: '2026-06-01T09:00:00Z' },
  { key: 'ai-disclosure', label: 'AI disclosure', category: 'Compliance', draftText: "You're speaking with VoiceNexus, an AI assistant. You can ask for a human agent at any time.", publishedText: "You're speaking with VoiceNexus, an AI assistant. You can ask for a human agent at any time.", status: 'published', updatedAt: '2026-05-01T09:00:00Z' },
  { key: 'recording-disclosure', label: 'Recording disclosure', category: 'Compliance', draftText: 'This call may be recorded for quality and training purposes.', publishedText: 'This call may be recorded for quality and training purposes.', status: 'published', updatedAt: '2026-05-01T09:00:00Z' },
];

export async function getPrompts(): Promise<PromptSlot[]> {
  await delay();
  return prompts;
}

export async function saveDraftPrompt(key: string, text: string): Promise<void> {
  await delay(200);
  prompts = prompts.map((p) => (p.key === key ? { ...p, draftText: text, status: 'draft', updatedAt: new Date().toISOString() } : p));
}

export async function publishPrompt(key: string): Promise<void> {
  await delay(250);
  prompts = prompts.map((p) => (p.key === key ? { ...p, publishedText: p.draftText, status: 'published', updatedAt: new Date().toISOString() } : p));
}

// ---------------------------------------------------------------------------
// Authentication settings
// ---------------------------------------------------------------------------

let authSettings: AuthSettings = {
  aniMatchingEnabled: true,
  kbaEnabled: true,
  mfaEnabled: false,
  retryLimit: 2,
  timeoutSeconds: 20,
};

export async function getAuthSettings(): Promise<AuthSettings> {
  await delay();
  return authSettings;
}

export async function updateAuthSettings(next: AuthSettings): Promise<AuthSettings> {
  await delay(250);
  authSettings = next;
  return authSettings;
}

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

let guardrails: GuardrailsConfig = {
  aiSafety: [
    { key: 'no-hallucinated-answers', label: 'Never fabricate an answer', description: 'If VoiceNexus cannot look up a fact, it says so instead of guessing.', enabled: true },
    { key: 'low-confidence-escalation', label: 'Escalate on repeated low confidence', description: 'After 2 low-confidence turns in a row, offer a transfer to an agent.', enabled: true },
    { key: 'restricted-requests', label: 'Refuse out-of-scope requests', description: 'Legal, medical, or account-security-bypassing requests are declined, not attempted.', enabled: true },
    { key: 'no-unverified-changes', label: 'Block changes without verification', description: 'Account or billing changes are never made before identity is verified.', enabled: true },
  ],
  sensitiveActions: [
    { key: 'payments', label: 'Payments', requireConfirmation: true },
    { key: 'plan-changes', label: 'Plan changes', requireConfirmation: true },
    { key: 'account-changes', label: 'Account changes', requireConfirmation: true },
    { key: 'cancellations', label: 'Service cancellations', requireConfirmation: true },
  ],
  privacy: {
    piiMasking: true,
    transcriptRetentionDays: 90,
    recordingRetentionDays: 30,
    allowDataDeletionRequests: true,
  },
};

export async function getGuardrails(): Promise<GuardrailsConfig> {
  await delay();
  return guardrails;
}

export async function updateGuardrails(next: GuardrailsConfig): Promise<GuardrailsConfig> {
  await delay(300);
  guardrails = next;
  return guardrails;
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

let integrations: IntegrationDefinition[] = [
  { id: 'sip-trunk', name: 'SIP / PSTN Trunk', category: 'Telephony', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T17:50:00Z', description: 'Inbound/outbound call delivery via SIP trunking.', logs: [{ timestamp: '2026-09-07T17:50:00Z', message: 'Heartbeat OK', level: 'info' }] },
  { id: 'sbc', name: 'Session Border Controller', category: 'Telephony', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T17:49:00Z', description: 'Edge security and call routing for the telephony network.', logs: [{ timestamp: '2026-09-07T17:49:00Z', message: 'Handshake OK', level: 'info' }] },
  { id: 'idp', name: 'Identity Provider', category: 'Identity', status: 'disconnected', health: 'down', description: 'SSO for internal VoiceNexus operators.', logs: [{ timestamp: '2026-09-06T09:00:00Z', message: 'Connection refused', level: 'error' }] },
  { id: 'mfa-provider', name: 'MFA Provider', category: 'Identity', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T16:00:00Z', description: 'One-time codes for caller multi-factor authentication.', logs: [] },
  { id: 'billing-api', name: 'Billing API', category: 'Customer Systems', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T17:40:00Z', description: 'Balance, invoices, and payment posting.', logs: [] },
  { id: 'crm', name: 'CRM', category: 'Customer Systems', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T17:35:00Z', description: 'Customer profile and contact history.', logs: [] },
  { id: 'oss-bss', name: 'OSS/BSS', category: 'Customer Systems', status: 'demo', health: 'degraded', lastSuccessfulConnection: '2026-09-07T15:12:00Z', description: 'Service provisioning, outage status, and network inventory.', logs: [{ timestamp: '2026-09-07T15:20:00Z', message: 'Elevated latency on outage-lookup endpoint', level: 'warn' }] },
  { id: 'acd', name: 'ACD', category: 'Contact Center', status: 'disconnected', health: 'down', description: 'Automatic call distribution to live agent queues.', logs: [{ timestamp: '2026-09-05T11:00:00Z', message: 'Not yet configured', level: 'warn' }] },
  { id: 'agent-desktop', name: 'Agent Desktop', category: 'Contact Center', status: 'disconnected', health: 'down', description: 'Context handoff surface for live agents.', logs: [] },
  { id: 'wfm', name: 'Workforce Management', category: 'Contact Center', status: 'disconnected', health: 'down', description: 'Staffing and schedule adherence data.', logs: [] },
  { id: 'data-warehouse', name: 'Data Warehouse', category: 'Analytics', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T14:00:00Z', description: 'Long-term storage for call and analytics events.', logs: [] },
  { id: 'reporting', name: 'Reporting', category: 'Analytics', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T14:00:00Z', description: 'Scheduled executive and operational reports.', logs: [] },
  { id: 'call-recording', name: 'Call Recording', category: 'Recording', status: 'demo', health: 'operational', lastSuccessfulConnection: '2026-09-07T17:45:00Z', description: 'Audio capture for compliance and QA.', logs: [] },
  { id: 'quality-monitoring', name: 'Quality Monitoring', category: 'Recording', status: 'disconnected', health: 'down', description: 'Automated call scoring and coaching.', logs: [] },
];

export async function getIntegrations(): Promise<IntegrationDefinition[]> {
  await delay();
  return integrations;
}

export async function testIntegrationConnection(id: string): Promise<{ ok: boolean; message: string }> {
  await delay(700);
  const integration = integrations.find((i) => i.id === id);
  if (!integration) return { ok: false, message: 'Integration not found.' };
  const ok = integration.status !== 'disconnected' && Math.random() > 0.15;
  const entry: { timestamp: string; message: string; level: 'info' | 'error' } = {
    timestamp: new Date().toISOString(),
    message: ok ? 'Test connection succeeded' : 'Test connection failed',
    level: ok ? 'info' : 'error',
  };
  integrations = integrations.map((i) =>
    i.id === id
      ? { ...i, logs: [entry, ...i.logs].slice(0, 10), lastSuccessfulConnection: ok ? entry.timestamp : i.lastSuccessfulConnection }
      : i,
  );
  return { ok, message: entry.message };
}

// ---------------------------------------------------------------------------
// Brand configuration
// ---------------------------------------------------------------------------

let brandConfig: BrandConfig = {
  companyName: 'VoiceNexus Telecom',
  logoInitials: 'VN',
  brandColor: '#3457d5',
  tagline: 'Turn IVR into resolution, not frustration.',
};

export async function getBrandConfig(): Promise<BrandConfig> {
  await delay();
  return brandConfig;
}

export async function updateBrandConfig(next: BrandConfig): Promise<BrandConfig> {
  await delay(300);
  brandConfig = next;
  return brandConfig;
}
