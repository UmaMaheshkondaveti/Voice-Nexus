import { useEffect, useState } from 'react';
import { Save, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { getGuardrails, updateGuardrails } from '../services/configService';
import type { GuardrailsConfig } from '../types/config';
import styles from './GuardrailsPage.module.css';

export function GuardrailsPage() {
  const [config, setConfig] = useState<GuardrailsConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getGuardrails().then(setConfig);
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await updateGuardrails(config);
    setSaving(false);
    toast.push({ title: 'Guardrails saved', tone: 'success' });
  }

  if (!config) {
    return (
      <div className="page">
        <Skeleton variant="line" width="240px" height="2rem" />
        <Skeleton variant="block" height={400} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Guardrails"
        subtitle="Safe-failure rules — VoiceNexus never guesses, and always escalates when it can't safely resolve a request."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Guardrails' }]}
        actions={
          <Button leftIcon={<Save size={14} />} onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card title="AI safety rules" subtitle="What VoiceNexus will never do, regardless of confidence">
          {config.aiSafety.map((rule) => (
            <label key={rule.key} className={styles.ruleRow}>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    aiSafety: config.aiSafety.map((r) => (r.key === rule.key ? { ...r, enabled: e.target.checked } : r)),
                  })
                }
              />
              <div>
                <p className={styles.ruleLabel}>{rule.label}</p>
                <p className={styles.ruleDescription}>{rule.description}</p>
              </div>
            </label>
          ))}
        </Card>

        <Card title="Transaction safety" subtitle="Sensitive actions that always require explicit caller confirmation">
          {config.sensitiveActions.map((action) => (
            <label key={action.key} className={styles.ruleRow}>
              <input
                type="checkbox"
                checked={action.requireConfirmation}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sensitiveActions: config.sensitiveActions.map((a) =>
                      a.key === action.key ? { ...a, requireConfirmation: e.target.checked } : a,
                    ),
                  })
                }
              />
              <p className={styles.ruleLabel}>{action.label}</p>
            </label>
          ))}

          <div className={styles.notice}>
            <ShieldAlert size={14} /> Disabling confirmation for a sensitive action is not recommended for production use.
          </div>
        </Card>

        <Card title="Privacy" subtitle="How long call data is kept, and who can act on it">
          <label className={styles.ruleRow}>
            <input
              type="checkbox"
              checked={config.privacy.piiMasking}
              onChange={(e) => setConfig({ ...config, privacy: { ...config.privacy, piiMasking: e.target.checked } })}
            />
            <div>
              <p className={styles.ruleLabel}>Mask PII in transcripts and logs</p>
              <p className={styles.ruleDescription}>Card numbers, SSNs, and KBA answers are redacted before storage.</p>
            </div>
          </label>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Transcript retention <span className={styles.hint}>days</span>
              <input
                type="number"
                min={1}
                max={365}
                value={config.privacy.transcriptRetentionDays}
                onChange={(e) => setConfig({ ...config, privacy: { ...config.privacy, transcriptRetentionDays: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Recording retention <span className={styles.hint}>days</span>
              <input
                type="number"
                min={1}
                max={365}
                value={config.privacy.recordingRetentionDays}
                onChange={(e) => setConfig({ ...config, privacy: { ...config.privacy, recordingRetentionDays: Number(e.target.value) } })}
              />
            </label>
          </div>

          <label className={styles.ruleRow}>
            <input
              type="checkbox"
              checked={config.privacy.allowDataDeletionRequests}
              onChange={(e) => setConfig({ ...config, privacy: { ...config.privacy, allowDataDeletionRequests: e.target.checked } })}
            />
            <p className={styles.ruleLabel}>Allow customers to request data deletion</p>
          </label>
        </Card>
      </div>
    </div>
  );
}
