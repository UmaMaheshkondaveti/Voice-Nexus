import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import {
  addLanguage,
  getLanguages,
  removeLanguage,
  setDefaultLanguage,
  updateLanguage,
} from '../services/configService';
import type { LanguageConfigItem } from '../types/config';
import styles from './LanguagesPage.module.css';

const VOICES = ['Aria (Neural, US English)', 'Camila (Neural, US Spanish)', 'Antoine (Neural, Canadian French)', 'Wei (Neural, Mandarin)'];

export function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ code: '', label: '', voice: VOICES[0] });
  const [pendingRemove, setPendingRemove] = useState<LanguageConfigItem | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setLanguages(await getLanguages());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(code: string, enabled: boolean) {
    await updateLanguage(code, { enabled });
    load();
  }

  async function handleSetDefault(code: string) {
    await setDefaultLanguage(code);
    toast.push({ title: 'Default language updated', tone: 'success' });
    load();
  }

  async function handleVoiceChange(code: string, voice: string) {
    await updateLanguage(code, { voice });
    load();
  }

  async function handleFallbackChange(code: string, fallbackCode: string) {
    await updateLanguage(code, { fallbackCode });
    load();
  }

  async function handleAdd() {
    if (!draft.code || !draft.label) return;
    await addLanguage({ code: draft.code, label: draft.label, voice: draft.voice, enabled: true, isDefault: false, fallbackCode: 'en-US' });
    toast.push({ title: `${draft.label} added`, tone: 'success' });
    setAddOpen(false);
    setDraft({ code: '', label: '', voice: VOICES[0] });
    load();
  }

  async function handleRemove() {
    if (!pendingRemove) return;
    await removeLanguage(pendingRemove.code);
    toast.push({ title: `${pendingRemove.label} removed`, tone: 'info' });
    setPendingRemove(null);
    load();
  }

  return (
    <div className="page">
      <PageHeader
        title="Languages"
        subtitle="Which languages VoiceNexus can converse in, and how each one falls back."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Languages' }]}
        actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Add language
          </Button>
        }
      />

      <Card>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : (
          <div className={styles.list}>
            {languages.map((lang) => (
              <div key={lang.code} className={styles.row}>
                <div className={styles.identity}>
                  <label className={styles.enableToggle}>
                    <input type="checkbox" checked={lang.enabled} disabled={lang.isDefault} onChange={(e) => handleToggle(lang.code, e.target.checked)} />
                  </label>
                  <div>
                    <p className={styles.label}>
                      {lang.label} <span className={styles.code}>{lang.code}</span>
                    </p>
                    {lang.isDefault && <Badge tone="primary">Default</Badge>}
                  </div>
                </div>

                <Select
                  size="sm"
                  value={lang.voice}
                  onChange={(e) => handleVoiceChange(lang.code, e.target.value)}
                  options={VOICES.map((v) => ({ value: v, label: v }))}
                />

                <Select
                  size="sm"
                  value={lang.fallbackCode}
                  onChange={(e) => handleFallbackChange(lang.code, e.target.value)}
                  options={[{ value: '', label: 'No fallback' }, ...languages.filter((l) => l.code !== lang.code).map((l) => ({ value: l.code, label: l.label }))]}
                />

                <div className={styles.rowActions}>
                  {!lang.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(lang.code)}>
                      Set default
                    </Button>
                  )}
                  {!lang.isDefault && (
                    <button
                      type="button"
                      aria-label={`Remove ${lang.label}`}
                      onClick={() => setPendingRemove(lang)}
                      style={{ background: 'transparent', color: 'var(--color-text-faint)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add language" footer={<Button onClick={handleAdd}>Add language</Button>}>
        <div className={styles.modalForm}>
          <label className={styles.field}>
            Language code <span className={styles.hint}>e.g. pt-BR</span>
            <input type="text" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          </label>
          <label className={styles.field}>
            Display name
            <input type="text" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          </label>
          <label className={styles.field}>
            Voice
            <Select value={draft.voice} onChange={(e) => setDraft({ ...draft, voice: e.target.value })} options={VOICES.map((v) => ({ value: v, label: v }))} />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={`Remove ${pendingRemove?.label}?`}
        description="Callers using this language will fall back to the default language."
        confirmLabel="Remove"
        danger
        onConfirm={handleRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
