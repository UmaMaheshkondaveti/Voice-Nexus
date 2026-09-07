import { useState } from 'react';
import { Send } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PipelineDebugView } from '../components/config/PipelineDebugView';
import { testIntentUtterance, type IntentTestResult } from '../services/configService';
import styles from './AITestingPage.module.css';

const SCENARIOS = [
  { label: 'Internet outage', text: 'My internet has stopped working since this morning' },
  { label: 'Billing dispute', text: 'I was charged twice on my last bill' },
  { label: 'Plan change', text: 'I want to see if there is a cheaper plan available' },
  { label: 'Account update', text: 'I need to update my service address' },
  { label: 'Scheduling', text: 'I need to schedule a technician visit' },
  { label: 'Unsupported request', text: 'Can you help me file a lawsuit against my neighbor' },
];

export function AITestingPage() {
  const [utterance, setUtterance] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [result, setResult] = useState<IntentTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(text: string) {
    if (!text.trim()) return;
    setSubmitted(text);
    setResult(null);
    setLoading(true);
    const res = await testIntentUtterance(text);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="page">
      <PageHeader
        title="AI Testing"
        subtitle="Step through exactly what VoiceNexus's AI pipeline does with a single utterance, end to end."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'AI Testing' }]}
      />

      <div className={styles.layout}>
        <Card title="Try a scenario">
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="Type what a customer might say…"
              value={utterance}
              onChange={(e) => setUtterance(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(utterance)}
            />
            <Button onClick={() => run(utterance)} loading={loading} leftIcon={<Send size={14} />}>
              Run
            </Button>
          </div>
          <div className={styles.scenarios}>
            {SCENARIOS.map((s) => (
              <button key={s.label} type="button" className={styles.scenarioCard} onClick={() => run(s.text)}>
                <span className={styles.scenarioLabel}>{s.label}</span>
                <span className={styles.scenarioText}>"{s.text}"</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Pipeline" subtitle="Live trace of this request through VoiceNexus">
          <PipelineDebugView utterance={submitted} result={result} loading={loading} />
        </Card>
      </div>
    </div>
  );
}
