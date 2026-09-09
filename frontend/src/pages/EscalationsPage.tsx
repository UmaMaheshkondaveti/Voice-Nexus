import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { CallSummary, EscalationPayload } from '@shared/types';
import { api } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { escalationReasonLabel, urgencyLabel, urgencyBadgeTone } from '../utils/escalation';
import { INTENT_LABELS } from '../utils/callDisplay';
import { formatDateTime, formatNumber, formatSeconds } from '../utils/format';
import styles from './EscalationsPage.module.css';

type Escalation = CallSummary & { escalation: EscalationPayload; agentNotes?: string };

function elapsedSeconds(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

export function EscalationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, refresh } = usePolling(() => api.getEscalations().then((r) => r.escalations), { intervalMs: 5000 });
  const escalations = data ?? [];

  const statusFilter = searchParams.get('status') ?? '';
  const reasonFilter = searchParams.get('reason') ?? '';
  const verifiedFilter = searchParams.get('verified') ?? '';

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  const reasonOptions = useMemo(() => {
    const seen = new Map<string, string>();
    escalations.forEach((e) => seen.set(e.escalation.reason, escalationReasonLabel(e.escalation.reason)));
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [escalations]);

  const waiting = useMemo(() => escalations.filter((e) => e.status === 'escalated'), [escalations]);
  const avgWaitSeconds = useMemo(() => {
    if (waiting.length === 0) return 0;
    return Math.round(waiting.reduce((sum, e) => sum + elapsedSeconds(e.escalation.escalatedAt), 0) / waiting.length);
  }, [waiting]);
  const unverifiedWaiting = useMemo(() => waiting.filter((e) => !e.escalation.verifiedIdentity).length, [waiting]);
  const resolvedCount = escalations.length - waiting.length;

  const filtered = useMemo(() => {
    return [...escalations]
      .filter((e) => !statusFilter || (statusFilter === 'waiting' ? e.status === 'escalated' : e.status !== 'escalated'))
      .filter((e) => !reasonFilter || e.escalation.reason === reasonFilter)
      .filter((e) => !verifiedFilter || String(e.escalation.verifiedIdentity) === verifiedFilter)
      .sort((a, b) => new Date(b.escalation.escalatedAt).getTime() - new Date(a.escalation.escalatedAt).getTime());
  }, [escalations, statusFilter, reasonFilter, verifiedFilter]);

  function openInWorkspace(id: string) {
    navigate(`/agent-handoff?call=${id}`);
  }

  const columns: TableColumn<Escalation>[] = [
    {
      key: 'escalatedAt',
      header: 'Escalated',
      render: (e) => formatDateTime(e.escalation.escalatedAt),
      sortValue: (e) => new Date(e.escalation.escalatedAt).getTime(),
      width: '160px',
    },
    { key: 'caller', header: 'Caller', render: (e) => e.callerName ?? e.phoneNumber },
    { key: 'reason', header: 'Reason', render: (e) => escalationReasonLabel(e.escalation.reason) },
    { key: 'intent', header: 'Intent', render: (e) => INTENT_LABELS[e.intent] },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (e) => <Badge tone={urgencyBadgeTone(e.escalation.urgency)}>{urgencyLabel(e.escalation.urgency)}</Badge>,
      sortValue: (e) => ({ high: 0, medium: 1, low: 2 })[e.escalation.urgency] ?? 3,
    },
    {
      key: 'verified',
      header: 'Identity',
      render: (e) => (
        <Badge
          tone={e.escalation.verifiedIdentity ? 'success' : 'warn'}
          icon={e.escalation.verifiedIdentity ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
        >
          {e.escalation.verifiedIdentity ? 'Verified' : 'Not verified'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) =>
        e.status === 'escalated' ? (
          <Badge tone="escalation">{`Waiting ${formatSeconds(elapsedSeconds(e.escalation.escalatedAt))}`}</Badge>
        ) : (
          <Badge tone="success">Resolved</Badge>
        ),
      sortValue: (e) => (e.status === 'escalated' ? 0 : 1),
    },
    {
      key: 'action',
      header: '',
      width: '90px',
      align: 'right',
      render: (e) => (
        <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight size={13} />} onClick={() => openInWorkspace(e.id)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Escalations"
        subtitle="Every call VoiceNexus has handed off to a human — open ones and how they were resolved."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Escalations' }]}
        actions={
          <Button variant="outline" leftIcon={<RefreshCw size={14} />} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      <div className={styles.statsRow}>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{formatNumber(waiting.length)}</span>
          <span className={styles.statLabel}>Waiting for an agent</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{formatSeconds(avgWaitSeconds)}</span>
          <span className={styles.statLabel}>Avg. current wait</span>
        </Card>
        <Card className={[styles.stat, unverifiedWaiting > 0 ? styles.statAlert : ''].join(' ')}>
          <span className={styles.statValue}>
            {unverifiedWaiting > 0 && <AlertTriangle size={16} className={styles.statIcon} />}
            {formatNumber(unverifiedWaiting)}
          </span>
          <span className={styles.statLabel}>Waiting, identity unverified</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{formatNumber(resolvedCount)}</span>
          <span className={styles.statLabel}>Resolved this session</span>
        </Card>
      </div>

      <Card>
        <div className={styles.filters}>
          <Select
            size="sm"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'waiting', label: 'Waiting' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
          <Select
            size="sm"
            aria-label="Filter by reason"
            value={reasonFilter}
            onChange={(e) => updateFilter('reason', e.target.value)}
            options={[{ value: '', label: 'All reasons' }, ...reasonOptions]}
          />
          <Select
            size="sm"
            aria-label="Filter by identity verification"
            value={verifiedFilter}
            onChange={(e) => updateFilter('verified', e.target.value)}
            options={[
              { value: '', label: 'Identity: any' },
              { value: 'true', label: 'Verified' },
              { value: 'false', label: 'Not verified' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          rows={filtered}
          rowKey={(e) => e.id}
          loading={loading}
          onRowClick={(e) => openInWorkspace(e.id)}
          defaultSortKey="escalatedAt"
          emptyTitle={escalations.length === 0 ? 'No escalations yet' : 'No escalations match these filters'}
          emptyDescription={
            escalations.length === 0
              ? 'Calls VoiceNexus hands off to a human agent will appear here.'
              : 'Try clearing a filter.'
          }
        />
      </Card>
    </div>
  );
}
