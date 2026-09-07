import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { CallDetailBody } from '../components/calls/CallDetailBody';
import { usePolling } from '../hooks/usePolling';
import { getLiveOps, liveOpsCallToDetail } from '../services/analyticsService';
import { INTENT_LABELS, WORKFLOW_STAGE_LABELS, type EnrichedCall, type LiveOpsCall } from '../types/analytics';
import styles from './LiveCallsPage.module.css';

const AUTH_TONE = {
  verified: 'success',
  pending: 'warn',
  failed: 'danger',
  'not-required': 'neutral',
} as const;

export function LiveCallsPage() {
  const { data: calls, loading } = usePolling(getLiveOps, { intervalMs: 4000 });
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastPollRef = useRef(Date.now());

  useEffect(() => {
    lastPollRef.current = Date.now();
  }, [calls]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  void tick;

  function liveDuration(call: LiveOpsCall): string {
    const elapsed = Math.floor((Date.now() - lastPollRef.current) / 1000);
    const total = call.durationSeconds + Math.max(0, elapsed);
    return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
  }

  const selectedLiveCall = calls?.find((c) => c.id === selectedId) ?? null;
  const selectedDetail: EnrichedCall | null = selectedLiveCall ? liveOpsCallToDetail(selectedLiveCall) : null;

  const columns: TableColumn<LiveOpsCall>[] = [
    { key: 'caller', header: 'Caller', render: (c) => c.callerLabel },
    { key: 'intent', header: 'Intent', render: (c) => <Badge tone="primary">{INTENT_LABELS[c.intent]}</Badge> },
    { key: 'confidence', header: 'Confidence', render: (c) => `${Math.round(c.intentConfidence * 100)}%` },
    { key: 'duration', header: 'Duration', render: (c) => liveDuration(c) },
    { key: 'auth', header: 'Authentication', render: (c) => <Badge tone={AUTH_TONE[c.authStatus]}>{c.authStatus.replace('-', ' ')}</Badge> },
    { key: 'stage', header: 'Workflow', render: (c) => WORKFLOW_STAGE_LABELS[c.workflowStage] },
    { key: 'ai', header: 'AI status', render: () => <Badge tone="success" dot>Automated</Badge> },
    {
      key: 'escalation',
      header: 'Escalation risk',
      render: (c) => (c.intentConfidence < 0.75 ? <Badge tone="warn">At risk</Badge> : <Badge tone="neutral">On track</Badge>),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Live Calls"
        subtitle="Every call VoiceNexus is handling right now, and exactly where it is in the flow."
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
            emptyDescription="New inbound calls will appear here the moment they connect."
          />
        </Card>

        <Card title="Call inspector" padding="sm">
          {selectedDetail ? (
            <CallDetailBody call={selectedDetail} />
          ) : (
            <EmptyState title="Select a call" description="Click any active call on the left to see its live transcript and timeline." />
          )}
        </Card>
      </div>
    </div>
  );
}
