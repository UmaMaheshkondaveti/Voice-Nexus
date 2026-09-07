import type { CallSession, CallSummary, DemoAccountOption, Metrics } from '@shared/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
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

  getMetrics: () => request<Metrics>('/metrics'),

  getEscalations: () =>
    request<{ escalations: (CallSummary & { escalation: NonNullable<CallSession['escalation']> })[] }>(
      '/escalations',
    ),
};
