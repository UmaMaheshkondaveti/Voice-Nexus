import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { PromptSlot } from '../../types/config';
import styles from './PromptEditDrawer.module.css';

export interface PromptEditDrawerProps {
  prompt: PromptSlot | null;
  saving: boolean;
  onClose: () => void;
  onSaveDraft: (key: string, text: string) => void;
  onPublish: (key: string) => void;
}

export function PromptEditDrawer({ prompt, saving, onClose, onSaveDraft, onPublish }: PromptEditDrawerProps) {
  const [text, setText] = useState('');
  const { speak, isSupported } = useSpeechSynthesis();

  useEffect(() => {
    setText(prompt?.draftText ?? '');
  }, [prompt]);

  const isDirty = prompt ? text !== prompt.draftText : false;
  const hasUnpublishedChanges = prompt ? prompt.draftText !== prompt.publishedText || prompt.status === 'draft' : false;

  return (
    <Drawer open={prompt !== null} onClose={onClose} title={prompt?.label} subtitle={prompt?.category} width={480}>
      {prompt && (
        <div className={styles.wrap}>
          <div className={styles.statusRow}>
            <Badge tone={prompt.status === 'published' ? 'success' : 'neutral'}>{prompt.status}</Badge>
          </div>

          <label className={styles.field}>
            Draft text
            <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          </label>

          <Button variant="outline" leftIcon={<Volume2 size={14} />} onClick={() => speak(text)} disabled={!isSupported || !text}>
            Preview
          </Button>

          {prompt.publishedText !== text && (
            <div className={styles.publishedPreview}>
              <span className={styles.publishedLabel}>Currently published</span>
              <p>{prompt.publishedText}</p>
            </div>
          )}

          <div className={styles.footer}>
            <Button variant="outline" onClick={() => onSaveDraft(prompt.key, text)} disabled={!isDirty} loading={saving}>
              Save draft
            </Button>
            <Button onClick={() => onPublish(prompt.key)} disabled={isDirty || !hasUnpublishedChanges} loading={saving}>
              Publish
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
