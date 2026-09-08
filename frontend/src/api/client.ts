import type { CallSession, CallSummary, DemoAccountOption, Metrics } from '@shared/types';

// Set by AuthContext whenever the signed-in operator changes, so every request to an
// internal-facing endpoint carries their role. The backend enforces this independently
// (see backend/src/middleware/auth.ts) — this is not just client-side convenience.
let currentRole: string | null = null;
export function setApiRole(role: string | null): void {
  currentRole = role;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(currentRole ? { 'X-VN-Role': currentRole } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDemoAccounts: () => request<DemoAccountOption[]>('/demo-accounts'),

  startCall: (phoneNumber: string) =>
    request<{ session: CallSession }>('/calls', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  postTurn: (callId: string, text: string) =>
    request<{ session: CallSession; assistantText: string }>(`/calls/${callId}/turns`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  endCall: (callId: string) =>
    request<{ session: CallSession }>(`/calls/${callId}/end`, { method: 'POST' }),

  getCalls: () => request<{ calls: CallSummary[] }>('/calls'),

  getCall: (callId: string) => request<{ session: CallSession }>(`/calls/${callId}`),

  getMetrics: () => request<Metrics>('/metrics'),

  getEscalations: () =>
    request<{
      escalations: (CallSummary & { escalation: NonNullable<CallSession['escalation']>; agentNotes?: string })[];
    }>('/escalations'),

  saveEscalationNotes: (callId: string, agentNotes: string) =>
    request<{ id: string; agentNotes?: string }>(`/escalations/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ agentNotes }),
    }),

  resolveEscalation: (callId: string, agentNotes?: string) =>
    request<{ id: string; status: string; agentNotes?: string }>(`/escalations/${callId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ agentNotes }),
    }),
};
