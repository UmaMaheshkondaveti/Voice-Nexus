import { Check, Loader2 } from 'lucide-react';
import type { IntentTestResult } from '../../services/configService';
import styles from './PipelineDebugView.module.css';

export interface PipelineDebugViewProps {
  utterance: string;
  result: IntentTestResult | null;
  loading: boolean;
}

export function PipelineDebugView({ utterance, result, loading }: PipelineDebugViewProps) {
  const steps = [
    { label: 'User input', value: utterance ? `"${utterance}"` : null },
    { label: 'Speech recognition', value: utterance ? 'Transcribed (simulated ASR)' : null },
    { label: 'Intent', value: result ? (result.matched ? result.matched.name : 'No confident match') : null },
    {
      label: 'Confidence',
      value: result ? `${Math.round(result.confidence * 100)}%${result.belowThreshold ? ' (below threshold)' : ''}` : null,
    },
    { label: 'Authentication', value: result ? (result.authRequired ? 'Required before action' : 'Not required') : null },
    { label: 'Workflow', value: result ? result.workflowName ?? 'None assigned' : null },
    { label: 'API action', value: result ? result.action : null },
    {
      label: 'AI response',
      value: result
        ? result.matched
          ? result.belowThreshold
            ? "Asks a clarifying question rather than guessing."
            : `Confirms and proceeds with: ${result.action.toLowerCase()}.`
          : 'Apologizes and offers to transfer to an agent.'
        : null,
    },
    { label: 'Next step', value: result ? (result.belowThreshold || !result.matched ? 'Clarify or escalate' : 'Execute workflow') : null },
  ];

  return (
    <ol className={styles.list}>
      {steps.map((step, i) => {
        const done = step.value !== null;
        const isCurrent = loading && !done && (i === 0 || steps[i - 1].value !== null);
        return (
          <li key={step.label} className={styles.item}>
            <span className={[styles.marker, done ? styles.done : '', isCurrent ? styles.current : ''].join(' ')}>
              {done ? <Check size={12} /> : isCurrent ? <Loader2 size={12} className={styles.spin} /> : i + 1}
            </span>
            <div>
              <p className={styles.label}>{step.label}</p>
              {step.value && <p className={styles.value}>{step.value}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
