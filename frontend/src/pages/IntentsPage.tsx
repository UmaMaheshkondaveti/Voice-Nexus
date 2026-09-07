import { useEffect, useState } from 'react';
import { Plus, Trash2, FlaskConical } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Table, type TableColumn } from '../components/ui/Table';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { IntentEditDrawer, type IntentDraft } from '../components/config/IntentEditDrawer';
import { IntentTestPanel } from '../components/config/IntentTestPanel';
import { createIntent, deleteIntent, getIntents, getWorkflows, saveIntent } from '../services/configService';
import type { IntentDefinition, WorkflowDefinition } from '../types/config';
import { formatPercent } from '../utils/format';

const STATUS_TONE = { active: 'success', draft: 'neutral', disabled: 'danger' } as const;

export function IntentsPage() {
  const [view, setView] = useState<'list' | 'test'>('list');
  const [intents, setIntents] = useState<IntentDefinition[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IntentDefinition | null | 'new'>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<IntentDefinition | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    const [i, w] = await Promise.all([getIntents(), getWorkflows()]);
    setIntents(i);
    setWorkflows(w);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(draft: IntentDraft) {
    setSaving(true);
    const utterances = draft.utterances.split('\n').map((u) => u.trim()).filter(Boolean);
    if (editing && editing !== 'new') {
      await saveIntent({ ...editing, ...draft, utterances });
      toast.push({ title: 'Intent updated', tone: 'success' });
    } else {
      await createIntent({ ...draft, utterances, languages: ['en-US'] });
      toast.push({ title: 'Intent created', tone: 'success' });
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteIntent(pendingDelete.id);
    toast.push({ title: `"${pendingDelete.name}" deleted`, tone: 'info' });
    setPendingDelete(null);
    load();
  }

  const columns: TableColumn<IntentDefinition>[] = [
    { key: 'name', header: 'Name', render: (i) => <strong>{i.name}</strong>, sortValue: (i) => i.name },
    {
      key: 'threshold',
      header: 'Confidence threshold',
      render: (i) => formatPercent(i.confidenceThreshold),
      sortValue: (i) => i.confidenceThreshold,
    },
    { key: 'auth', header: 'Auth', render: (i) => (i.authRequired ? <Badge tone="warn">Required</Badge> : <Badge tone="neutral">Not required</Badge>) },
    { key: 'workflow', header: 'Workflow', render: (i) => workflows.find((w) => w.id === i.workflowId)?.name ?? '—' },
    { key: 'status', header: 'Status', render: (i) => <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge> },
    { key: 'usage', header: 'Usage', render: (i) => i.usageCount.toLocaleString(), sortValue: (i) => i.usageCount },
    { key: 'success', header: 'Success rate', render: (i) => formatPercent(i.successRate), sortValue: (i) => i.successRate },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <button
          type="button"
          aria-label={`Delete ${i.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(i);
          }}
          style={{ background: 'transparent', color: 'var(--color-text-faint)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Intents"
        subtitle="What VoiceNexus recognizes from free-form speech, and how it should act on it."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Intents' }]}
        actions={
          <>
            <Tabs
              value={view}
              onChange={(v) => setView(v as 'list' | 'test')}
              items={[
                { value: 'list', label: 'All intents' },
                { value: 'test', label: 'Test intent' },
              ]}
            />
            {view === 'list' && (
              <Button leftIcon={<Plus size={14} />} onClick={() => setEditing('new')}>
                New intent
              </Button>
            )}
          </>
        }
      />

      {view === 'list' ? (
        <Card>
          <Table
            columns={columns}
            rows={intents}
            rowKey={(i) => i.id}
            loading={loading}
            onRowClick={(i) => setEditing(i)}
            emptyTitle="No intents configured"
            emptyDescription="Create an intent to teach VoiceNexus how to recognize and act on a new kind of request."
          />
        </Card>
      ) : (
        <Card title="Test an utterance" subtitle="See exactly how VoiceNexus would classify and route a customer request." actions={<FlaskConical size={16} color="var(--color-text-faint)" />}>
          <IntentTestPanel />
        </Card>
      )}

      <IntentEditDrawer
        open={editing !== null}
        intent={editing === 'new' ? null : editing}
        workflows={workflows}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This intent will no longer be recognized during calls. This cannot be undone."
        confirmLabel="Delete intent"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
