import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { CallSession, CallSummary, Intent } from '@shared/types';
import { api } from '../api/client';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { CallSessionDrawer } from '../components/calls/CallSessionDrawer';
import { escalationReasonLabel } from '../utils/escalation';
import { INTENT_LABELS, authLabel } from '../utils/callDisplay';
import { formatDateTime, formatSeconds } from '../utils/format';
import styles from './CallHistoryPage.module.css';

type Outcome = 'resolved' | 'escalated' | 'ongoing';

const OUTCOME_LABEL: Record<Outcome, string> = { resolved: 'Resolved', escalated: 'Escalated', ongoing: 'Ongoing' };
const OUTCOME_TONE: Record<Outcome, BadgeTone> = { resolved: 'success', escalated: 'escalation', ongoing: 'warn' };

function outcomeOf(call: CallSummary): Outcome {
  if (call.status === 'escalated') return 'escalated';
  if (call.status === 'ended') return 'resolved';
  return 'ongoing';
}

export function CallHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CallSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const intentFilter = searchParams.get('intent') ?? '';
  const outcomeFilter = searchParams.get('resolution') ?? '';
  const escalatedFilter = searchParams.get('escalated') ?? '';

  function load() {
    setLoading(true);
    api
      .getCalls()
      .then((result) => setCalls(result.calls))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    updateFilter('search', search);
  }

  const filtered = useMemo(() => {
    const q = (searchParams.get('search') ?? '').toLowerCase();
    return [...calls]
      .filter((c) => !intentFilter || c.intent === intentFilter)
      .filter((c) => !outcomeFilter || outcomeOf(c) === outcomeFilter)
      .filter((c) => !escalatedFilter || c.escalated === (escalatedFilter === 'true'))
      .filter((c) => !q || c.callerName?.toLowerCase().includes(q) || c.phoneNumber.toLowerCase().includes(q) || c.id.includes(q))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [calls, intentFilter, outcomeFilter, escalatedFilter, searchParams]);

  async function openCall(call: CallSummary) {
    setDetailLoading(true);
    try {
      const { session } = await api.getCall(call.id);
      setSelected(session);
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: TableColumn<CallSummary>[] = [
    {
      key: 'time',
      header: 'Started',
      render: (c) => formatDateTime(c.startedAt),
      sortValue: (c) => new Date(c.startedAt).getTime(),
      width: '160px',
    },
    { key: 'caller', header: 'Caller', render: (c) => c.callerName ?? c.phoneNumber },
    { key: 'intent', header: 'Intent', render: (c) => INTENT_LABELS[c.intent] },
    { key: 'auth', header: 'Authentication', render: (c) => authLabel(c) },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (c) => <Badge tone={OUTCOME_TONE[outcomeOf(c)]}>{OUTCOME_LABEL[outcomeOf(c)]}</Badge>,
    },
    {
      key: 'escalation',
      header: 'Escalation reason',
      render: (c) => (c.escalated && c.escalationReason ? escalationReasonLabel(c.escalationReason) : '—'),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (c) => (c.durationSeconds !== undefined ? formatSeconds(c.durationSeconds) : '—'),
      sortValue: (c) => c.durationSeconds ?? -1,
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Call History"
        subtitle="Every real call handled by VoiceNexus through the Call Simulator — search, filter, and open one to see its full transcript."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Call History' }]}
      />

      <Card>
        <div className={styles.filters}>
          <form className={styles.search} onSubmit={submitSearch}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search caller, phone or call ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search calls"
            />
          </form>

          <Select
            size="sm"
            aria-label="Filter by intent"
            value={intentFilter}
            onChange={(e) => updateFilter('intent', e.target.value)}
            options={[
              { value: '', label: 'All intents' },
              ...(Object.keys(INTENT_LABELS) as Intent[]).map((key) => ({ value: key, label: INTENT_LABELS[key] })),
            ]}
          />

          <Select
            size="sm"
            aria-label="Filter by outcome"
            value={outcomeFilter}
            onChange={(e) => updateFilter('resolution', e.target.value)}
            options={[
              { value: '', label: 'All outcomes' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'escalated', label: 'Escalated' },
              { value: 'ongoing', label: 'Ongoing' },
            ]}
          />

          <Select
            size="sm"
            aria-label="Filter by escalation"
            value={escalatedFilter}
            onChange={(e) => updateFilter('escalated', e.target.value)}
            options={[
              { value: '', label: 'Escalated: any' },
              { value: 'true', label: 'Escalated only' },
              { value: 'false', label: 'Automated only' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          rows={filtered}
          rowKey={(c) => c.id}
          loading={loading}
          onRowClick={openCall}
          defaultSortKey="time"
          emptyTitle={calls.length === 0 ? 'No calls yet' : 'No calls match these filters'}
          emptyDescription={
            calls.length === 0
              ? 'Make a call in the Call Simulator — it will show up here.'
              : 'Try clearing a filter or widening your search.'
          }
        />
      </Card>

      <CallSessionDrawer session={selected} loading={detailLoading} onClose={() => setSelected(null)} />
    </div>
  );
}
