import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PhoneIncoming,
  Pause,
  Play,
  Mic,
  MicOff,
  PhoneForwarded,
  PhoneOff,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import type { CallSession, CallSummary, EscalationPayload } from '@shared/types';
import { api } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { TranscriptView } from '../components/TranscriptView';
import { escalationReasonLabel, recommendedNextAction } from '../utils/escalation';
import { formatDateTime, formatSeconds } from '../utils/format';
import styles from './AgentWorkspacePage.module.css';

type Escalation = CallSummary & { escalation: EscalationPayload; agentNotes?: string };

const TRANSFER_DESTINATIONS = ['Billing Specialists', 'Technical Support', 'Retention Desk', 'Field Dispatch'];

interface CallHandlingState {
  accepted: boolean;
  onHold: boolean;
  muted: boolean;
}

function elapsedSince(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  return formatSeconds(seconds);
}

export function AgentWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, refresh } = usePolling(() => api.getEscalations().then((r) => r.escalations), { intervalMs: 5000 });
  const escalations = data ?? [];

  const selectedId = searchParams.get('call');
  const [detail, setDetail] = useState<CallSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [handling, setHandling] = useState<Record<string, CallHandlingState>>({});

  const waiting = useMemo(() => escalations.filter((e) => e.status === 'escalated'), [escalations]);
  const resolved = useMemo(() => escalations.filter((e) => e.status !== 'escalated'), [escalations]);
  const selected = escalations.find((e) => e.id === selectedId) ?? null;

  function select(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set('call', id);
    setSearchParams(next, { replace: true });
  }

  // Auto-select the oldest waiting call (or the one deep-linked from the Call Simulator) once data arrives.
  useEffect(() => {
    if (selectedId && escalations.some((e) => e.id === selectedId)) return;
    if (waiting.length > 0) select(waiting[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalations]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    api
      .getCall(selectedId)
      .then(({ session }) => {
        if (cancelled) return;
        setDetail(session);
        setNotesDraft(session.agentNotes ?? '');
      })
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function stateFor(id: string): CallHandlingState {
    return handling[id] ?? { accepted: false, onHold: false, muted: false };
  }

  function updateState(id: string, patch: Partial<CallHandlingState>) {
    setHandling((prev) => ({ ...prev, [id]: { ...stateFor(id), ...patch } }));
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await api.saveEscalationNotes(selected.id, notesDraft);
    } finally {
      setSavingNotes(false);
    }
  }

  async function resolveCall(extraNote?: string) {
    if (!selected) return;
    setResolving(true);
    try {
      const finalNotes = extraNote ? `${notesDraft ? notesDraft + '\n' : ''}${extraNote}` : notesDraft;
      await api.resolveEscalation(selected.id, finalNotes);
      setNotesDraft(finalNotes);
      setTransferOpen(false);
      await refresh();
    } finally {
      setResolving(false);
    }
  }

  const handlingState = selected ? stateFor(selected.id) : null;

  return (
    <div className="page">
      <PageHeader
        title="Agent Workspace"
        subtitle="Calls VoiceNexus couldn't safely resolve on its own, handed off with full context so you never have to ask the customer to repeat themselves."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Agent Workspace' }]}
        actions={
          <Button variant="outline" leftIcon={<RefreshCw size={14} />} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      <div className={styles.layout}>
        <aside className={styles.queue}>
          <div className={styles.queueGroup}>
            <h3 className={styles.queueGroupTitle}>Waiting for an agent ({waiting.length})</h3>
            {waiting.length === 0 && <p className={styles.queueEmpty}>No calls waiting right now.</p>}
            {waiting.map((call) => (
              <button
                key={call.id}
                type="button"
                className={[styles.queueRow, call.id === selectedId ? styles.queueRowActive : ''].join(' ')}
                onClick={() => select(call.id)}
              >
                <div className={styles.queueRowTop}>
                  <span className={styles.queueRowName}>{call.callerName ?? call.phoneNumber}</span>
                  <span className={styles.queueRowTime}>{elapsedSince(call.escalation.escalatedAt)}</span>
                </div>
                <div className={styles.queueRowMeta}>
                  <Badge tone="escalation">{escalationReasonLabel(call.escalation.reason)}</Badge>
                  {stateFor(call.id).accepted && <Badge tone="info">In progress</Badge>}
                </div>
              </button>
            ))}
          </div>

          {resolved.length > 0 && (
            <div className={styles.queueGroup}>
              <h3 className={styles.queueGroupTitle}>Resolved ({resolved.length})</h3>
              {resolved.map((call) => (
                <button
                  key={call.id}
                  type="button"
                  className={[styles.queueRow, call.id === selectedId ? styles.queueRowActive : ''].join(' ')}
                  onClick={() => select(call.id)}
                >
                  <div className={styles.queueRowTop}>
                    <span className={styles.queueRowName}>{call.callerName ?? call.phoneNumber}</span>
                    <span className={styles.queueRowTime}>{formatDateTime(call.escalation.escalatedAt)}</span>
                  </div>
                  <div className={styles.queueRowMeta}>
                    <Badge tone="success">Resolved</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={styles.detail}>
          {!selected ? (
            <EmptyState
              icon={<PhoneIncoming size={22} />}
              title="No call selected"
              description="Escalated calls will appear in the queue on the left as VoiceNexus transfers them, with everything it already knows about the customer."
            />
          ) : (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.callerName}>{selected.callerName ?? selected.phoneNumber}</h2>
                  <div className={styles.detailBadges}>
                    <Badge tone={selected.escalation.verifiedIdentity ? 'success' : 'warn'} icon={selected.escalation.verifiedIdentity ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}>
                      {selected.escalation.verifiedIdentity ? `Verified (${selected.escalation.verificationLevel})` : 'Not verified'}
                    </Badge>
                    <Badge tone="neutral">{selected.intent.replace('_', ' ')}</Badge>
                    <Badge tone={selected.status === 'escalated' ? 'escalation' : 'success'}>
                      {selected.status === 'escalated' ? `Waiting ${elapsedSince(selected.escalation.escalatedAt)}` : 'Resolved'}
                    </Badge>
                    {selected.escalation.callbackRequested && <Badge tone="info">Callback requested</Badge>}
                  </div>
                </div>

                {selected.status === 'escalated' && (
                  <div className={styles.controls}>
                    {!handlingState?.accepted ? (
                      <Button leftIcon={<PhoneIncoming size={15} />} onClick={() => updateState(selected.id, { accepted: true })}>
                        Accept call
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          leftIcon={handlingState.onHold ? <Play size={15} /> : <Pause size={15} />}
                          onClick={() => updateState(selected.id, { onHold: !handlingState.onHold })}
                        >
                          {handlingState.onHold ? 'Resume' : 'Hold'}
                        </Button>
                        <Button
                          variant="outline"
                          leftIcon={handlingState.muted ? <MicOff size={15} /> : <Mic size={15} />}
                          onClick={() => updateState(selected.id, { muted: !handlingState.muted })}
                        >
                          {handlingState.muted ? 'Unmute' : 'Mute'}
                        </Button>
                        <div className={styles.transferWrap}>
                          <Button variant="outline" leftIcon={<PhoneForwarded size={15} />} onClick={() => setTransferOpen((o) => !o)}>
                            Transfer
                          </Button>
                          {transferOpen && (
                            <div className={styles.transferMenu} role="menu">
                              {TRANSFER_DESTINATIONS.map((dest) => (
                                <button
                                  key={dest}
                                  type="button"
                                  onClick={() => resolveCall(`Transferred to ${dest}.`)}
                                  disabled={resolving}
                                >
                                  {dest}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="danger" leftIcon={<PhoneOff size={15} />} loading={resolving} onClick={() => resolveCall()}>
                          End call
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {handlingState?.onHold && selected.status === 'escalated' && (
                <div className="banner banner--warn">Call on hold.</div>
              )}

              <div className={styles.grid}>
                <div className={styles.card}>
                  <h4>AI handoff summary</h4>
                  <p className={styles.summaryText}>{selected.escalation.summary}</p>
                  <dl className={styles.factList}>
                    <div>
                      <dt>Escalation reason</dt>
                      <dd>{escalationReasonLabel(selected.escalation.reason)}</dd>
                    </div>
                    <div>
                      <dt>Recommended next action</dt>
                      <dd>{recommendedNextAction(selected.escalation.reason)}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.card}>
                  <h4>Actions already attempted by VoiceNexus</h4>
                  {selected.escalation.attemptedSteps.length === 0 ? (
                    <p className={styles.muted}>No actions were completed before the transfer.</p>
                  ) : (
                    <ul className={styles.stepList}>
                      {selected.escalation.attemptedSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.card}>
                  <h4>Customer context</h4>
                  <dl className={styles.factList}>
                    <div>
                      <dt>Phone</dt>
                      <dd>{selected.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt>Account ID</dt>
                      <dd>{selected.escalation.accountId ? <code>{selected.escalation.accountId}</code> : 'Not linked'}</dd>
                    </div>
                    <div>
                      <dt>Call started</dt>
                      <dd>{formatDateTime(selected.startedAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.card}>
                  <h4>Agent notes</h4>
                  <textarea
                    className={styles.notesBox}
                    placeholder="Notes for this call — visible to anyone who reopens it…"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                  />
                  <Button size="sm" variant="outline" loading={savingNotes} onClick={saveNotes}>
                    Save notes
                  </Button>
                </div>
              </div>

              <div className={styles.card}>
                <h4>Conversation transcript</h4>
                {detailLoading || !detail ? (
                  <p className={styles.muted}>Loading transcript…</p>
                ) : (
                  <TranscriptView turns={detail.transcript} callerLabel="Customer" assistantLabel="VoiceNexus AI" showTimestamps />
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
