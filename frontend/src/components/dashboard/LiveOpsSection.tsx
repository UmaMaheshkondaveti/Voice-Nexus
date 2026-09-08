import { useEffect, useState } from 'react';
import type { CallSession, CallSummary } from '@shared/types';
import { api } from '../../api/client';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, type TableColumn } from '../ui/Table';
import { CallSessionDrawer } from '../calls/CallSessionDrawer';
import { usePolling } from '../../hooks/usePolling';
import { INTENT_LABELS, authLabel } from '../../utils/callDisplay';
import { formatSeconds } from '../../utils/format';

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

export function LiveOpsSection() {
  const { data: calls, loading } = usePolling(fetchActiveCalls, { intervalMs: 4000 });
  const [, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedSession(null);
      return;
    }
    let cancelled = false;
    api.getCall(selectedId).then(({ session }) => !cancelled && setSelectedSession(session));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const columns: TableColumn<CallSummary>[] = [
    { key: 'caller', header: 'Caller', render: (c) => c.callerName ?? c.phoneNumber },
    { key: 'intent', header: 'Intent', render: (c) => <Badge tone="primary">{INTENT_LABELS[c.intent]}</Badge> },
    { key: 'duration', header: 'Duration', render: (c) => liveDuration(c.startedAt) },
    { key: 'auth', header: 'Authentication', render: (c) => authLabel(c) },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge tone={STATUS_TONE[c.status as 'connecting' | 'in-progress']}>
          {STATUS_LABEL[c.status as 'connecting' | 'in-progress']}
        </Badge>
      ),
    },
  ];

  return (
    <Card
      id="live-ops"
      title="Live operations"
      subtitle="Real calls currently in progress across VoiceNexus"
      actions={
        !loading && (
          <Badge tone="success" dot>
            {calls?.length ?? 0} active
          </Badge>
        )
      }
    >
      <Table
        columns={columns}
        rows={calls ?? []}
        rowKey={(c) => c.id}
        loading={loading}
        onRowClick={(c) => setSelectedId(c.id)}
        emptyTitle="No active calls right now"
        emptyDescription="Start a call in the Call Simulator to see it here live."
      />
      <CallSessionDrawer session={selectedSession} loading={false} onClose={() => setSelectedId(null)} />
    </Card>
  );
}
