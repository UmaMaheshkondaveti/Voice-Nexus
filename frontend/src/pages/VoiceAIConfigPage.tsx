import { useEffect, useState } from 'react';
import { Volume2, Save } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { getVoiceAndAIConfig, updateVoiceAndAIConfig } from '../services/configService';
import type { VoiceAndAIConfig } from '../types/config';
import styles from './VoiceAIConfigPage.module.css';

const VOICES = ['Aria (Neural, US English)', 'Marcus (Neural, US English)', 'Camila (Neural, US Spanish)', 'Noor (Neural, US English)'];

export function VoiceAIConfigPage() {
  const [config, setConfig] = useState<VoiceAndAIConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { speak, isSupported } = useSpeechSynthesis();

  useEffect(() => {
    getVoiceAndAIConfig().then(setConfig);
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await updateVoiceAndAIConfig(config);
    setSaving(false);
    toast.push({ title: 'Voice & AI configuration saved', tone: 'success' });
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
        title="Voice & AI Configuration"
        subtitle="How VoiceNexus sounds, converses, and stays within its guardrails."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Voice & AI' }]}
        actions={
          <Button leftIcon={<Save size={14} />} onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card title="Voice" subtitle="Provider, voice and speaking style">
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Provider
              <input type="text" value={config.voice.provider} onChange={(e) => setConfig({ ...config, voice: { ...config.voice, provider: e.target.value } })} />
            </label>
            <label className={styles.field}>
              Voice
              <Select
                value={config.voice.voice}
                onChange={(e) => setConfig({ ...config, voice: { ...config.voice, voice: e.target.value } })}
                options={VOICES.map((v) => ({ value: v, label: v }))}
              />
            </label>
            <label className={styles.field}>
              Speed <span className={styles.hint}>{config.voice.speed.toFixed(2)}x</span>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={config.voice.speed}
                onChange={(e) => setConfig({ ...config, voice: { ...config.voice, speed: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Pitch <span className={styles.hint}>{config.voice.pitch.toFixed(2)}</span>
              <input
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={config.voice.pitch}
                onChange={(e) => setConfig({ ...config, voice: { ...config.voice, pitch: Number(e.target.value) } })}
              />
            </label>
          </div>

          <label className={styles.field}>
            Greeting
            <textarea rows={2} value={config.voice.greeting} onChange={(e) => setConfig({ ...config, voice: { ...config.voice, greeting: e.target.value } })} />
          </label>
          <label className={styles.field}>
            Hold message
            <textarea rows={2} value={config.voice.holdMessage} onChange={(e) => setConfig({ ...config, voice: { ...config.voice, holdMessage: e.target.value } })} />
          </label>
          <label className={styles.field}>
            Closing message
            <textarea rows={2} value={config.voice.closingMessage} onChange={(e) => setConfig({ ...config, voice: { ...config.voice, closingMessage: e.target.value } })} />
          </label>

          <Button
            variant="outline"
            leftIcon={<Volume2 size={14} />}
            onClick={() => speak(config.voice.greeting, undefined, { rate: config.voice.speed, pitch: config.voice.pitch })}
            disabled={!isSupported}
          >
            {isSupported ? 'Preview greeting' : 'Voice preview unsupported in this browser'}
          </Button>
        </Card>

        <Card title="Conversation" subtitle="Timing and interruption behavior">
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Silence timeout <span className={styles.hint}>{config.conversation.silenceTimeoutSeconds}s</span>
              <input
                type="range"
                min={3}
                max={15}
                value={config.conversation.silenceTimeoutSeconds}
                onChange={(e) => setConfig({ ...config, conversation: { ...config.conversation, silenceTimeoutSeconds: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Turn timeout <span className={styles.hint}>{config.conversation.turnTimeoutSeconds}s</span>
              <input
                type="range"
                min={5}
                max={30}
                value={config.conversation.turnTimeoutSeconds}
                onChange={(e) => setConfig({ ...config, conversation: { ...config.conversation, turnTimeoutSeconds: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Retry count
              <input
                type="number"
                min={0}
                max={5}
                value={config.conversation.retryCount}
                onChange={(e) => setConfig({ ...config, conversation: { ...config.conversation, retryCount: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Interruption handling
              <Select
                value={config.conversation.interruptionHandling}
                onChange={(e) => setConfig({ ...config, conversation: { ...config.conversation, interruptionHandling: e.target.value as 'allow' | 'ignore' } })}
                options={[
                  { value: 'allow', label: 'Allow caller to interrupt' },
                  { value: 'ignore', label: 'Finish speaking before listening' },
                ]}
              />
            </label>
            <label className={styles.field}>
              Confirmation behavior
              <Select
                value={config.conversation.confirmationBehavior}
                onChange={(e) => setConfig({ ...config, conversation: { ...config.conversation, confirmationBehavior: e.target.value as never } })}
                options={[
                  { value: 'always', label: 'Always confirm before acting' },
                  { value: 'sensitive-only', label: 'Confirm only sensitive actions' },
                  { value: 'never', label: 'Never confirm' },
                ]}
              />
            </label>
          </div>
        </Card>

        <Card title="AI guardrails" subtitle="Thresholds that keep VoiceNexus from acting outside its confidence">
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Intent confidence threshold <span className={styles.hint}>{Math.round(config.guardrails.intentConfidenceThreshold * 100)}%</span>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.01}
                value={config.guardrails.intentConfidenceThreshold}
                onChange={(e) => setConfig({ ...config, guardrails: { ...config.guardrails, intentConfidenceThreshold: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Escalation threshold <span className={styles.hint}>{Math.round(config.guardrails.escalationThreshold * 100)}%</span>
              <input
                type="range"
                min={0.1}
                max={0.7}
                step={0.01}
                value={config.guardrails.escalationThreshold}
                onChange={(e) => setConfig({ ...config, guardrails: { ...config.guardrails, escalationThreshold: Number(e.target.value) } })}
              />
            </label>
            <label className={styles.field}>
              Unsupported request behavior
              <Select
                value={config.guardrails.unsupportedRequestBehavior}
                onChange={(e) => setConfig({ ...config, guardrails: { ...config.guardrails, unsupportedRequestBehavior: e.target.value as never } })}
                options={[
                  { value: 'apologize-and-escalate', label: 'Apologize and escalate' },
                  { value: 'ask-clarifying-question', label: 'Ask a clarifying question' },
                ]}
              />
            </label>
          </div>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={config.guardrails.requireConfirmationForSensitiveActions}
              onChange={(e) => setConfig({ ...config, guardrails: { ...config.guardrails, requireConfirmationForSensitiveActions: e.target.checked } })}
            />
            Require explicit confirmation before payments, plan changes, or other sensitive actions
          </label>
        </Card>

        <Card title="Disclosures" subtitle="What VoiceNexus tells every caller">
          <label className={styles.field}>
            AI disclosure
            <textarea rows={2} value={config.disclosures.aiDisclosure} onChange={(e) => setConfig({ ...config, disclosures: { ...config.disclosures, aiDisclosure: e.target.value } })} />
          </label>
          <label className={styles.field}>
            Recording disclosure
            <textarea rows={2} value={config.disclosures.recordingDisclosure} onChange={(e) => setConfig({ ...config, disclosures: { ...config.disclosures, recordingDisclosure: e.target.value } })} />
          </label>
          <label className={styles.field}>
            Transfer disclosure
            <textarea rows={2} value={config.disclosures.transferDisclosure} onChange={(e) => setConfig({ ...config, disclosures: { ...config.disclosures, transferDisclosure: e.target.value } })} />
          </label>
          <label className={styles.field}>
            Privacy message
            <textarea rows={2} value={config.disclosures.privacyMessage} onChange={(e) => setConfig({ ...config, disclosures: { ...config.disclosures, privacyMessage: e.target.value } })} />
          </label>
        </Card>
      </div>
    </div>
  );
}
