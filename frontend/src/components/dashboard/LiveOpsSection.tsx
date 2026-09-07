import { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, type TableColumn } from '../ui/Table';
import { CallDetailDrawer } from '../calls/CallDetailDrawer';
import { usePolling } from '../../hooks/usePolling';
import { getLiveOps, liveOpsCallToDetail } from '../../services/analyticsService';
import { INTENT_LABELS, WORKFLOW_STAGE_LABELS, type EnrichedCall, type LiveOpsCall } from '../../types/analytics';

const AUTH_TONE = {
  verified: 'success',
  pending: 'warn',
  failed: 'danger',
  'not-required': 'neutral',
} as const;

export function LiveOpsSection() {
  const { data: calls, loading } = usePolling(getLiveOps, { intervalMs: 4000 });
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<EnrichedCall | null>(null);
  const lastPollRef = useRef(Date.now());

  useEffect(() => {
    lastPollRef.current = Date.now();
  }, [calls]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  function liveDuration(call: LiveOpsCall): string {
    const elapsed = Math.floor((Date.now() - lastPollRef.current) / 1000);
    const total = call.durationSeconds + Math.max(0, elapsed);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  void tick;

  const columns: TableColumn<LiveOpsCall>[] = [
    { key: 'caller', header: 'Caller', render: (c) => c.callerLabel },
    { key: 'intent', header: 'Intent', render: (c) => <Badge tone="primary">{INTENT_LABELS[c.intent]}</Badge> },
    { key: 'confidence', header: 'Confidence', render: (c) => `${Math.round(c.intentConfidence * 100)}%` },
    { key: 'duration', header: 'Duration', render: (c) => liveDuration(c) },
    {
      key: 'auth',
      header: 'Authentication',
      render: (c) => <Badge tone={AUTH_TONE[c.authStatus]}>{c.authStatus.replace('-', ' ')}</Badge>,
    },
    { key: 'stage', header: 'Workflow stage', render: (c) => WORKFLOW_STAGE_LABELS[c.workflowStage] },
  ];

  return (
    <Card
      id="live-ops"
      title="Live operations"
      subtitle="Calls currently in progress across VoiceNexus"
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
        onRowClick={(c) => setSelected(liveOpsCallToDetail(c))}
        emptyTitle="No active calls right now"
        emptyDescription="New inbound calls will appear here the moment they connect."
      />
      <CallDetailDrawer call={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
