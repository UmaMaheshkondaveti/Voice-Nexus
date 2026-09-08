import { useEffect, useState } from 'react';
import { PhoneIncoming } from 'lucide-react';
import type { CallSession, CallSummary } from '@shared/types';
import { api } from '../api/client';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { TranscriptView } from '../components/TranscriptView';
import { usePolling } from '../hooks/usePolling';
import { INTENT_LABELS, authLabel } from '../utils/callDisplay';
import { formatSeconds } from '../utils/format';
import styles from './LiveCallsPage.module.css';

const STATUS_LABEL = { connecting: 'Connecting', 'in-progress': 'In progress' } as const;
const STATUS_TONE = { connecting: 'warn', 'in-progress': 'info' } as const;

function liveDuration(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  return formatSeconds(seconds);
}

async function fetchActiveCalls(): Promise<CallSummary[]> {
  const { calls } = await api.getCalls();
  return calls.filter((c) => c.status === 'connecting' || c.status === 'in-progress');
}

export function LiveCallsPage() {
  const { data: calls, loading } = usePolling(fetchActiveCalls, { intervalMs: 3000 });
  const [, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Re-render every second purely to tick the live duration column/header — no new data fetched.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedSession(null);
      return;
    }
    if (calls && !calls.some((c) => c.id === selectedId)) {
      // The call ended or escalated since it was selected — stop showing it as "live".
      setSelectedId(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    api
      .getCall(selectedId)
      .then(({ session }) => !cancelled && setSelectedSession(session))
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, calls]);

  const columns: TableColumn<CallSummary>[] = [
    { key: 'caller', header: 'Caller', render: (c) => c.callerName ?? c.phoneNumber },
    { key: 'intent', header: 'Intent', render: (c) => <Badge tone="primary">{INTENT_LABELS[c.intent]}</Badge> },
    { key: 'duration', header: 'Duration', render: (c) => liveDuration(c.startedAt) },
    { key: 'auth', header: 'Authentication', render: (c) => authLabel(c) },
    { key: 'status', header: 'Status', render: (c) => <Badge tone={STATUS_TONE[c.status as 'connecting' | 'in-progress']}>{STATUS_LABEL[c.status as 'connecting' | 'in-progress']}</Badge> },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Live Calls"
        subtitle="Real calls VoiceNexus is handling right now — start one in the Call Simulator to see it appear here."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Live Calls' }]}
        actions={
          !loading && (
            <Badge tone="success" dot>
              {calls?.length ?? 0} active
            </Badge>
          )
        }
      />

      <div className={styles.layout}>
        <Card padding="sm">
          <Table
            columns={columns}
            rows={calls ?? []}
            rowKey={(c) => c.id}
            loading={loading}
            onRowClick={(c) => setSelectedId(c.id)}
            emptyTitle="No active calls right now"
            emptyDescription="Your AI agents are caught up — start a call in the Call Simulator to see it here live."
          />
        </Card>

        <Card title="Call inspector" padding="sm">
          {detailLoading && !selectedSession ? (
            <EmptyState icon={<PhoneIncoming size={22} />} title="Loading call…" />
          ) : selectedSession ? (
            <div className={styles.inspector}>
              <div className={styles.inspectorBadges}>
                <Badge tone={STATUS_TONE[selectedSession.status as 'connecting' | 'in-progress']}>
                  {STATUS_LABEL[selectedSession.status as 'connecting' | 'in-progress']}
                </Badge>
                <Badge tone={selectedSession.identityVerified ? 'success' : 'warn'}>{authLabel(selectedSession)}</Badge>
                <Badge tone="neutral">{INTENT_LABELS[selectedSession.intent]}</Badge>
              </div>
              <TranscriptView turns={selectedSession.transcript} callerLabel="Customer" assistantLabel="VoiceNexus AI" showTimestamps />
            </div>
          ) : (
            <EmptyState
              icon={<PhoneIncoming size={22} />}
              title="Select a call"
              description="Click any active call on the left to see its live transcript."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
