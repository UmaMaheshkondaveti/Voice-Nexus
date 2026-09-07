import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { testIntentUtterance, type IntentTestResult } from '../../services/configService';
import styles from './IntentTestPanel.module.css';

const SAMPLES = [
  'My internet has stopped working',
  'I was charged twice on my last bill',
  'I want to see if there is a cheaper plan available',
  'Can I speak to a real person about something else entirely',
];

export function IntentTestPanel() {
  const [utterance, setUtterance] = useState('');
  const [result, setResult] = useState<IntentTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTest(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setUtterance(text);
    const res = await testIntentUtterance(text);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <input
          type="text"
          placeholder="Type what a customer might say…"
          value={utterance}
          onChange={(e) => setUtterance(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runTest(utterance)}
          aria-label="Customer utterance"
        />
        <Button onClick={() => runTest(utterance)} loading={loading} leftIcon={<Send size={14} />}>
          Test
        </Button>
      </div>

      <div className={styles.samples}>
        <span className={styles.samplesLabel}>Try:</span>
        {SAMPLES.map((s) => (
          <button key={s} type="button" className={styles.sampleChip} onClick={() => runTest(s)}>
            {s}
          </button>
        ))}
      </div>

      {result && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <Sparkles size={16} className={styles.resultIcon} />
            <span>Detected intent</span>
          </div>

          {result.matched ? (
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Intent</span>
                <span className={styles.fieldValue}>{result.matched.name}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Confidence</span>
                <div className={styles.confidenceBar}>
                  <div className={styles.confidenceTrack}>
                    <div
                      className={styles.confidenceFill}
                      style={{
                        width: `${result.confidence * 100}%`,
                        background: result.belowThreshold ? 'var(--color-warn)' : 'var(--color-success)',
                      }}
                    />
                  </div>
                  <span>{Math.round(result.confidence * 100)}%</span>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Authentication</span>
                <Badge tone={result.authRequired ? 'warn' : 'neutral'}>{result.authRequired ? 'Required' : 'Not required'}</Badge>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Workflow</span>
                <span className={styles.fieldValue}>{result.workflowName ?? '—'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Action</span>
                <span className={styles.fieldValue}>{result.action}</span>
              </div>
              {result.belowThreshold && (
                <div className={styles.warning}>
                  Confidence is below this intent's threshold — VoiceNexus would ask a clarifying question rather than act automatically.
                </div>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Result</span>
                <Badge tone="warn">Unsupported / low confidence</Badge>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Next step</span>
                <span className={styles.fieldValue}>{result.action}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
