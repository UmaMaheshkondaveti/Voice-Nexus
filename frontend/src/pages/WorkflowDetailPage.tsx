import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, ShieldCheck, Upload, History as HistoryIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas';
import { WORKFLOW_NODE_LABELS, type WorkflowDefinition, type WorkflowNode, type WorkflowStatus } from '../types/config';
import { getWorkflowById, publishWorkflow, rollbackWorkflow, validateWorkflowById } from '../services/configService';
import { formatDateTime } from '../utils/format';
import styles from './WorkflowDetailPage.module.css';

const STATUS_TONE: Record<WorkflowStatus, 'success' | 'info' | 'neutral' | 'danger'> = {
  published: 'success',
  testing: 'info',
  draft: 'neutral',
  disabled: 'danger',
};

export function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  async function load() {
    if (!id) return;
    setLoading(true);
    const wf = await getWorkflowById(id);
    if (!wf) {
      navigate('/workflows', { replace: true });
      return;
    }
    setWorkflow(wf);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleValidate() {
    if (!id) return;
    const result = await validateWorkflowById(id);
    setProblems(result);
    toast.push({
      title: result.length === 0 ? 'Workflow is valid' : `${result.length} validation issue(s) found`,
      tone: result.length === 0 ? 'success' : 'warning',
    });
  }

  async function handlePublish() {
    if (!id) return;
    setPublishing(true);
    const result = await publishWorkflow(id);
    setPublishing(false);
    setConfirmPublish(false);
    if (result.ok) {
      toast.push({ title: 'Workflow published', tone: 'success' });
      load();
    } else {
      setProblems(result.problems);
      toast.push({ title: 'Could not publish — fix validation issues first', tone: 'error' });
    }
  }

  async function handleRollback(version: number) {
    if (!id) return;
    await rollbackWorkflow(id, version);
    toast.push({ title: `Rolled back to v${version}`, tone: 'info' });
    load();
  }

  async function handleSimulate() {
    if (!workflow) return;
    setSimulating(true);
    for (const node of workflow.nodes) {
      setActiveNodeId(node.id);
      await new Promise((resolve) => setTimeout(resolve, 550));
    }
    setActiveNodeId(null);
    setSimulating(false);
    toast.push({ title: 'Simulation complete', description: 'Walked through every node in this workflow.', tone: 'success' });
  }

  if (loading || !workflow) {
    return (
      <div className="page">
        <Skeleton variant="line" width="240px" height="2rem" />
        <Skeleton variant="block" height={420} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={workflow.name}
        subtitle={workflow.description}
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Workflows', to: '/workflows' }, { label: workflow.name }]}
        actions={
          <>
            <Badge tone={STATUS_TONE[workflow.status]}>
              {workflow.status} · v{workflow.version}
            </Badge>
            <Button variant="outline" leftIcon={<ShieldCheck size={14} />} onClick={handleValidate}>
              Validate
            </Button>
            <Button variant="outline" leftIcon={<Play size={14} />} onClick={handleSimulate} loading={simulating}>
              Simulate
            </Button>
            <Button
              leftIcon={<Upload size={14} />}
              onClick={() => setConfirmPublish(true)}
              disabled={workflow.status === 'published'}
            >
              Publish
            </Button>
          </>
        }
      />

      {problems.length > 0 && (
        <div className="banner banner--warn">
          {problems.map((p, i) => (
            <div key={i}>{p}</div>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <WorkflowCanvas
          workflow={workflow}
          selectedNodeId={selectedNode?.id ?? null}
          activeNodeId={activeNodeId}
          onSelectNode={setSelectedNode}
        />

        <div className={styles.side}>
          <Card title="Node" padding="sm">
            {selectedNode ? (
              <div className={styles.nodeDetail}>
                <div className={styles.nodeDetailRow}>
                  <span className={styles.nodeDetailLabel}>Type</span>
                  <span>{WORKFLOW_NODE_LABELS[selectedNode.type]}</span>
                </div>
                <div className={styles.nodeDetailRow}>
                  <span className={styles.nodeDetailLabel}>Label</span>
                  <span>{selectedNode.label}</span>
                </div>
                {selectedNode.detail && (
                  <div className={styles.nodeDetailRow}>
                    <span className={styles.nodeDetailLabel}>Detail</span>
                    <span>{selectedNode.detail}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">Click a node on the canvas to inspect it.</p>
            )}
          </Card>

          <Card title="Settings" padding="sm">
            <div className={styles.settingsGrid}>
              <div>
                <span className={styles.nodeDetailLabel}>Retry count</span>
                <p>{workflow.retryCount}x</p>
              </div>
              <div>
                <span className={styles.nodeDetailLabel}>Timeout</span>
                <p>{workflow.timeoutSeconds}s</p>
              </div>
              <div>
                <span className={styles.nodeDetailLabel}>On failure</span>
                <p>{workflow.escalateOnFailure ? 'Escalate to agent' : 'Return error to caller'}</p>
              </div>
            </div>
          </Card>

          <Card title="Version history" padding="sm" actions={<HistoryIcon size={15} color="var(--color-text-faint)" />}>
            <ul className={styles.history}>
              {[...workflow.history].reverse().map((h) => (
                <li key={h.version} className={styles.historyItem}>
                  <div>
                    <p className={styles.historyVersion}>
                      v{h.version} <Badge tone={STATUS_TONE[h.status]}>{h.status}</Badge>
                    </p>
                    <p className={styles.historyMeta}>
                      {formatDateTime(h.updatedAt)} · {h.note}
                    </p>
                  </div>
                  {h.version !== workflow.version && (
                    <Button variant="ghost" size="sm" onClick={() => handleRollback(h.version)}>
                      Roll back
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this workflow?"
        description="Publishing makes this the live version every matching intent will run in production calls."
        confirmLabel="Publish"
        loading={publishing}
        onConfirm={handlePublish}
        onCancel={() => setConfirmPublish(false)}
      />
    </div>
  );
}
