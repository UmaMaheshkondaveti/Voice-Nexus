import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusDot } from '../components/ui/StatusDot';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { IntegrationDetailDrawer } from '../components/config/IntegrationDetailDrawer';
import { getIntegrations, testIntegrationConnection } from '../services/configService';
import type { IntegrationDefinition } from '../types/config';
import styles from './IntegrationsPage.module.css';

const STATUS_TONE = { connected: 'success', demo: 'info', disconnected: 'neutral' } as const;

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IntegrationDefinition | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setIntegrations(await getIntegrations());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, IntegrationDefinition[]>();
    integrations.forEach((i) => {
      const list = map.get(i.category) ?? [];
      list.push(i);
      map.set(i.category, list);
    });
    return Array.from(map.entries());
  }, [integrations]);

  async function handleTest(id: string) {
    setTestingId(id);
    const result = await testIntegrationConnection(id);
    setTestingId(null);
    toast.push({ title: result.message, tone: result.ok ? 'success' : 'error' });
    load();
  }

  return (
    <div className="page">
      <PageHeader
        title="Integrations"
        subtitle="Every external system VoiceNexus can call on — clearly marked as demo, connected, or disconnected."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Integrations' }]}
      />

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : (
        grouped.map(([category, items]) => (
          <Card key={category} title={category}>
            <div className={styles.grid}>
              {items.map((integration) => (
                <div key={integration.id} className={styles.tile}>
                  <div className={styles.tileHeader}>
                    <p className={styles.name}>{integration.name}</p>
                    <Badge tone={STATUS_TONE[integration.status]}>{integration.status === 'demo' ? 'Demo / Mock' : integration.status}</Badge>
                  </div>
                  <p className={styles.description}>{integration.description}</p>
                  <StatusDot status={integration.health} />
                  <div className={styles.actions}>
                    <Button variant="outline" size="sm" onClick={() => handleTest(integration.id)} loading={testingId === integration.id}>
                      Test connection
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(integration)}>
                      View logs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      <IntegrationDetailDrawer integration={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
