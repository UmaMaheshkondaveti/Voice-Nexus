import type OpenAI from 'openai';
import type { CallSession, CallStatus, Intent, VerificationLevel, EscalationPayload, Turn } from '../../../shared/types.js';

/** Server-only call session — adds fields that must never reach the browser. */
export interface InternalCallSession extends CallSession {
  llmHistory: OpenAI.Chat.ChatCompletionMessageParam[];
  kbaFailures: number;
}

const sessions = new Map<string, InternalCallSession>();

export function createSession(id: string, phoneNumber: string, callerName?: string): InternalCallSession {
  const session: InternalCallSession = {
    id,
    phoneNumber,
    callerName,
    status: 'connecting',
    startedAt: new Date().toISOString(),
    identityVerified: false,
    verificationLevel: 'none',
    intent: 'unknown',
    transcript: [],
    transactionsCompleted: [],
    llmHistory: [],
    kbaFailures: 0,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): InternalCallSession | undefined {
  return sessions.get(id);
}

export function listSessions(): InternalCallSession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  );
}

/** Strips server-only fields before sending a session to the browser. */
export function toPublicSession(session: InternalCallSession): CallSession {
  const { llmHistory, kbaFailures, ...publicSession } = session;
  return publicSession;
}

export function makeTurn(role: Turn['role'], text: string, toolCall?: Turn['toolCall']): Turn {
  return {
    id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    timestamp: new Date().toISOString(),
    toolCall,
  };
}

export type { CallStatus, Intent, VerificationLevel, EscalationPayload };
