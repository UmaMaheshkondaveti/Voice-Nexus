import { useEffect, useState } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import type { CallSummary, EscalationPayload } from '@shared/types';
import { api } from '../api/client';
import { EscalationCard } from '../components/EscalationCard';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

type Escalation = CallSummary & { escalation: EscalationPayload };

export function AgentHandoffPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  async function load() {
    const { escalations: list } = await api.getEscalations();
    setEscalations(list);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Escalations"
        subtitle="Calls transferred from VoiceNexus, with verified identity and full context."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Escalations' }]}
        actions={
          <Button variant="outline" leftIcon={<RefreshCw size={14} />} onClick={load}>
            Refresh
          </Button>
        }
      />

      {escalations.length === 0 ? (
        <EmptyState icon={<Inbox size={22} />} title="No escalations yet" description="Calls transferred to a live agent will appear here in real time." />
      ) : (
        <div className="escalation-grid">
          {escalations.map((call) => (
            <EscalationCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
