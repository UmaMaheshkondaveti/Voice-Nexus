import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { getWorkflows } from '../services/configService';
import type { WorkflowDefinition, WorkflowStatus } from '../types/config';

const STATUS_TONE: Record<WorkflowStatus, 'success' | 'info' | 'neutral' | 'danger'> = {
  published: 'success',
  testing: 'info',
  draft: 'neutral',
  disabled: 'danger',
};

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getWorkflows().then((w) => {
      setWorkflows(w);
      setLoading(false);
    });
  }, []);

  const columns: TableColumn<WorkflowDefinition>[] = [
    { key: 'name', header: 'Name', render: (w) => <strong>{w.name}</strong>, sortValue: (w) => w.name },
    { key: 'description', header: 'Description', render: (w) => <span style={{ color: 'var(--color-text-muted)' }}>{w.description}</span> },
    { key: 'status', header: 'Status', render: (w) => <Badge tone={STATUS_TONE[w.status]}>{w.status}</Badge> },
    { key: 'version', header: 'Version', render: (w) => `v${w.version}`, sortValue: (w) => w.version },
    { key: 'nodes', header: 'Nodes', render: (w) => w.nodes.length, sortValue: (w) => w.nodes.length },
    { key: 'retry', header: 'Retry / timeout', render: (w) => `${w.retryCount}x · ${w.timeoutSeconds}s` },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Workflows"
        subtitle="Goal-directed subflows that turn a recognized intent into a completed transaction."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Workflows' }]}
      />
      <Card>
        <Table
          columns={columns}
          rows={workflows}
          rowKey={(w) => w.id}
          loading={loading}
          onRowClick={(w) => navigate(`/workflows/${w.id}`)}
          emptyTitle="No workflows yet"
          emptyDescription="Workflows connect an intent to authentication, backend actions, and a resolution or escalation path."
        />
      </Card>
    </div>
  );
}
