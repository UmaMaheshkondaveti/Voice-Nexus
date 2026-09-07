import { useEffect, useState } from 'react';
import { Save, Play, ShieldCheck, ShieldAlert, ShieldQuestion, KeyRound } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { getAuthSettings, updateAuthSettings } from '../services/configService';
import type { AuthSettings } from '../types/config';
import styles from './AuthenticationPage.module.css';

type DemoState = 'idle' | 'required' | 'verifying' | 'verified' | 'failed';

const STEPS: { key: DemoState; label: string; icon: typeof ShieldQuestion }[] = [
  { key: 'required', label: 'Authentication required', icon: ShieldQuestion },
  { key: 'verifying', label: 'Verification in progress', icon: KeyRound },
  { key: 'verified', label: 'Verified', icon: ShieldCheck },
];

export function AuthenticationPage() {
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [demo, setDemo] = useState<DemoState>('idle');
  const toast = useToast();

  useEffect(() => {
    getAuthSettings().then(setSettings);
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    await updateAuthSettings(settings);
    setSaving(false);
    toast.push({ title: 'Authentication settings saved', tone: 'success' });
  }

  async function runDemo() {
    setDemo('required');
    await new Promise((r) => setTimeout(r, 800));
    setDemo('verifying');
    await new Promise((r) => setTimeout(r, 1200));
    setDemo(Math.random() < 0.82 ? 'verified' : 'failed');
  }

  if (!settings) {
    return (
      <div className="page">
        <Skeleton variant="line" width="240px" height="2rem" />
        <Skeleton variant="block" height={300} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Authentication"
        subtitle="How VoiceNexus verifies who it's talking to before touching an account."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Authentication' }]}
        actions={
          <Button leftIcon={<Save size={14} />} onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card title="Verification methods">
          <label className={styles.checkboxField}>
            <input type="checkbox" checked={settings.aniMatchingEnabled} onChange={(e) => setSettings({ ...settings, aniMatchingEnabled: e.target.checked })} />
            <div>
              <p className={styles.checkboxLabel}>ANI matching</p>
              <p className={styles.checkboxHint}>Match the caller's phone number against the number on file.</p>
            </div>
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" checked={settings.kbaEnabled} onChange={(e) => setSettings({ ...settings, kbaEnabled: e.target.checked })} />
            <div>
              <p className={styles.checkboxLabel}>Knowledge-based authentication</p>
              <p className={styles.checkboxHint}>Ask a security question on file for the account.</p>
            </div>
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" checked={settings.mfaEnabled} onChange={(e) => setSettings({ ...settings, mfaEnabled: e.target.checked })} />
            <div>
              <p className={styles.checkboxLabel}>Multi-factor authentication</p>
              <p className={styles.checkboxHint}>Send a one-time code to the number or email on file.</p>
            </div>
          </label>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Retry limit
              <input type="number" min={0} max={5} value={settings.retryLimit} onChange={(e) => setSettings({ ...settings, retryLimit: Number(e.target.value) })} />
            </label>
            <label className={styles.field}>
              Timeout <span className={styles.hint}>seconds</span>
              <input type="number" min={5} max={60} value={settings.timeoutSeconds} onChange={(e) => setSettings({ ...settings, timeoutSeconds: Number(e.target.value) })} />
            </label>
          </div>

          <p className={styles.notice}>
            <ShieldAlert size={14} /> Sensitive customer data (KBA answers, MFA codes) is never sent to or rendered in the frontend.
          </p>
        </Card>

        <Card title="Live authentication state" subtitle="What a caller's verification looks like in real time" actions={
          <Button variant="outline" size="sm" leftIcon={<Play size={13} />} onClick={runDemo} disabled={demo === 'verifying'}>
            Run demo
          </Button>
        }>
          <div className={styles.stepper}>
            {STEPS.map((step, i) => {
              const stepIndex = STEPS.findIndex((s) => s.key === demo);
              const active = demo === step.key;
              const completed = stepIndex > i || (demo === 'verified' && step.key !== 'verified' ? true : demo === 'failed' && i < 2);
              const Icon = step.key === 'verified' && demo === 'failed' ? ShieldAlert : step.icon;
              return (
                <div key={step.key} className={styles.step}>
                  <span
                    className={[
                      styles.stepIcon,
                      active ? styles.stepActive : '',
                      completed ? styles.stepDone : '',
                      demo === 'failed' && step.key === 'verified' ? styles.stepFailed : '',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                  </span>
                  <span className={styles.stepLabel}>
                    {step.key === 'verified' && demo === 'failed' ? 'Verification failed' : step.label}
                  </span>
                  {i < STEPS.length - 1 && <span className={styles.stepConnector} />}
                </div>
              );
            })}
          </div>
          {demo === 'idle' && <p className="empty-state">Click "Run demo" to see the verification flow a caller experiences.</p>}
        </Card>
      </div>
    </div>
  );
}
