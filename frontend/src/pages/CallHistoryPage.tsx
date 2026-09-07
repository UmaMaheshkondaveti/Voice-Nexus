import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { CallDetailDrawer } from '../components/calls/CallDetailDrawer';
import { getCalls } from '../services/analyticsService';
import { INTENT_LABELS, type CallFilters, type EnrichedCall, type IntentKey } from '../types/analytics';
import { formatDateTime, formatSeconds } from '../utils/format';
import styles from './CallHistoryPage.module.css';

const RESOLUTION_TONE = {
  resolved: 'success',
  partial: 'warn',
  escalated: 'danger',
  failed: 'danger',
} as const;

export function CallHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [calls, setCalls] = useState<EnrichedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EnrichedCall | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const filters: CallFilters = {
    intent: searchParams.get('intent') ?? undefined,
    resolution: searchParams.get('resolution') ?? undefined,
    escalated: (searchParams.get('escalated') as 'true' | 'false' | null) ?? undefined,
    escalationReason: searchParams.get('escalationReason') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCalls(filters).then((result) => {
      if (!cancelled) {
        setCalls(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function updateFilter(key: keyof CallFilters, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    updateFilter('search', search);
  }

  const columns: TableColumn<EnrichedCall>[] = [
    {
      key: 'time',
      header: 'Started',
      render: (c) => formatDateTime(c.startedAt),
      sortValue: (c) => new Date(c.startedAt).getTime(),
      width: '160px',
    },
    { key: 'caller', header: 'Caller', render: (c) => c.callerName ?? c.phoneNumber },
    { key: 'intent', header: 'Intent', render: (c) => INTENT_LABELS[c.intent] },
    {
      key: 'auth',
      header: 'Authentication',
      render: (c) => c.authStatus.replace('-', ' '),
    },
    {
      key: 'resolution',
      header: 'Resolution',
      render: (c) => <Badge tone={RESOLUTION_TONE[c.resolution]}>{c.resolution}</Badge>,
    },
    { key: 'escalation', header: 'Escalation', render: (c) => (c.escalated ? c.destinationQueue ?? 'Escalated' : '—') },
    {
      key: 'duration',
      header: 'Duration',
      render: (c) => formatSeconds(c.durationSeconds),
      sortValue: (c) => c.durationSeconds,
    },
    { key: 'csat', header: 'CSAT', render: (c) => (c.csat !== undefined ? `${c.csat.toFixed(1)}` : '—'), sortValue: (c) => c.csat ?? -1 },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Call History"
        subtitle="Search, filter and drill into every completed VoiceNexus call."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Call History' }]}
        actions={
          <Button variant="outline" leftIcon={<Download size={14} />} disabled>
            Export
          </Button>
        }
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
            value={filters.intent ?? ''}
            onChange={(e) => updateFilter('intent', e.target.value)}
            options={[
              { value: '', label: 'All intents' },
              ...(Object.keys(INTENT_LABELS) as IntentKey[]).map((key) => ({ value: key, label: INTENT_LABELS[key] })),
            ]}
          />

          <Select
            size="sm"
            aria-label="Filter by resolution"
            value={filters.resolution ?? ''}
            onChange={(e) => updateFilter('resolution', e.target.value)}
            options={[
              { value: '', label: 'All resolutions' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'partial', label: 'Partially resolved' },
              { value: 'escalated', label: 'Escalated' },
              { value: 'failed', label: 'Failed' },
            ]}
          />

          <Select
            size="sm"
            aria-label="Filter by escalation"
            value={filters.escalated ?? ''}
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
          rows={calls}
          rowKey={(c) => c.id}
          loading={loading}
          onRowClick={setSelected}
          defaultSortKey="time"
          emptyTitle="No calls match these filters"
          emptyDescription="Try clearing a filter or widening your search."
        />
      </Card>

      <CallDetailDrawer call={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
