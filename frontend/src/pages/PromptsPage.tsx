import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { PromptEditDrawer } from '../components/config/PromptEditDrawer';
import { getPrompts, publishPrompt, saveDraftPrompt } from '../services/configService';
import type { PromptSlot } from '../types/config';
import { formatDateTime } from '../utils/format';
import styles from './PromptsPage.module.css';

export function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setPrompts(await getPrompts());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PromptSlot[]>();
    prompts.forEach((p) => {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    });
    return Array.from(map.entries());
  }, [prompts]);

  const editing = prompts.find((p) => p.key === editingKey) ?? null;

  async function handleSaveDraft(key: string, text: string) {
    setSaving(true);
    await saveDraftPrompt(key, text);
    await load();
    setSaving(false);
    toast.push({ title: 'Draft saved', tone: 'success' });
  }

  async function handlePublish(key: string) {
    setSaving(true);
    await publishPrompt(key);
    await load();
    setSaving(false);
    setEditingKey(null);
    toast.push({ title: 'Prompt published', tone: 'success' });
  }

  return (
    <div className="page">
      <PageHeader
        title="Prompts"
        subtitle="The exact language VoiceNexus uses at every point in a call."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Prompts' }]}
      />

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : (
        grouped.map(([category, items]) => (
          <Card key={category} title={category}>
            <div className={styles.list}>
              {items.map((p) => (
                <button key={p.key} type="button" className={styles.row} onClick={() => setEditingKey(p.key)}>
                  <div>
                    <p className={styles.label}>{p.label}</p>
                    <p className={styles.preview}>{p.publishedText}</p>
                  </div>
                  <div className={styles.meta}>
                    <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</Badge>
                    <span className={styles.updated}>{formatDateTime(p.updatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))
      )}

      <PromptEditDrawer
        prompt={editing}
        saving={saving}
        onClose={() => setEditingKey(null)}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />
    </div>
  );
}
