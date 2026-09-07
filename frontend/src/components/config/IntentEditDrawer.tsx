import { useEffect, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { IntentDefinition } from '../../types/config';
import type { WorkflowDefinition } from '../../types/config';
import type { IntentKey } from '../../types/analytics';
import { INTENT_LABELS } from '../../types/analytics';
import styles from './IntentEditDrawer.module.css';

export interface IntentDraft {
  key: IntentKey;
  name: string;
  description: string;
  utterances: string;
  confidenceThreshold: number;
  authRequired: boolean;
  workflowId: string;
  primaryAction: string;
  escalationRule: string;
  status: IntentDefinition['status'];
}

function toDraft(intent: IntentDefinition | null): IntentDraft {
  if (!intent) {
    return {
      key: 'other',
      name: '',
      description: '',
      utterances: '',
      confidenceThreshold: 0.75,
      authRequired: true,
      workflowId: '',
      primaryAction: '',
      escalationRule: '',
      status: 'draft',
    };
  }
  return {
    key: intent.key,
    name: intent.name,
    description: intent.description,
    utterances: intent.utterances.join('\n'),
    confidenceThreshold: intent.confidenceThreshold,
    authRequired: intent.authRequired,
    workflowId: intent.workflowId ?? '',
    primaryAction: intent.primaryAction,
    escalationRule: intent.escalationRule,
    status: intent.status,
  };
}

export interface IntentEditDrawerProps {
  open: boolean;
  intent: IntentDefinition | null;
  workflows: WorkflowDefinition[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: IntentDraft) => void;
}

export function IntentEditDrawer({ open, intent, workflows, saving, onClose, onSave }: IntentEditDrawerProps) {
  const [draft, setDraft] = useState<IntentDraft>(() => toDraft(intent));

  useEffect(() => {
    setDraft(toDraft(intent));
  }, [intent, open]);

  return (
    <Drawer open={open} onClose={onClose} title={intent ? `Edit ${intent.name}` : 'New intent'} width={520}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <label className={styles.field}>
          Name
          <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
        </label>

        <label className={styles.field}>
          Intent key
          <Select
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value as IntentKey })}
            options={(Object.keys(INTENT_LABELS) as IntentKey[]).map((k) => ({ value: k, label: INTENT_LABELS[k] }))}
          />
        </label>

        <label className={styles.field}>
          Description
          <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>

        <label className={styles.field}>
          Example utterances <span className={styles.hint}>one per line</span>
          <textarea rows={4} value={draft.utterances} onChange={(e) => setDraft({ ...draft, utterances: e.target.value })} />
        </label>

        <label className={styles.field}>
          Confidence threshold <span className={styles.hint}>{Math.round(draft.confidenceThreshold * 100)}%</span>
          <input
            type="range"
            min={0.5}
            max={0.95}
            step={0.01}
            value={draft.confidenceThreshold}
            onChange={(e) => setDraft({ ...draft, confidenceThreshold: Number(e.target.value) })}
          />
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={draft.authRequired}
            onChange={(e) => setDraft({ ...draft, authRequired: e.target.checked })}
          />
          Require authentication before acting on this intent
        </label>

        <label className={styles.field}>
          Workflow
          <Select
            value={draft.workflowId}
            onChange={(e) => setDraft({ ...draft, workflowId: e.target.value })}
            options={[{ value: '', label: 'None assigned' }, ...workflows.map((w) => ({ value: w.id, label: w.name }))]}
          />
        </label>

        <label className={styles.field}>
          Primary action
          <input type="text" value={draft.primaryAction} onChange={(e) => setDraft({ ...draft, primaryAction: e.target.value })} />
        </label>

        <label className={styles.field}>
          Escalation rule
          <textarea rows={2} value={draft.escalationRule} onChange={(e) => setDraft({ ...draft, escalationRule: e.target.value })} />
        </label>

        <label className={styles.field}>
          Status
          <Select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as IntentDefinition['status'] })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'disabled', label: 'Disabled' },
            ]}
          />
        </label>

        <div className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save intent
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
