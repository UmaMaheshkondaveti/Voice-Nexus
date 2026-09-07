import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { SystemHealthSection } from '../components/dashboard/SystemHealthSection';
import { getSystemEvents, type SystemEvent } from '../services/analyticsService';
import { formatDateTime } from '../utils/format';
import styles from './SystemHealthPage.module.css';

const LEVEL_TONE = { info: 'neutral', warn: 'warn', error: 'danger' } as const;

export function SystemHealthPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemEvents().then((result) => {
      setEvents(result);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="System Health"
        subtitle="Live status of every service VoiceNexus depends on, and recent events."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Administration' }, { label: 'System Health' }]}
      />

      <SystemHealthSection />

      <Card title="Event timeline" subtitle="Recent incidents, deploys, and recoveries">
        {loading ? (
          <Skeleton variant="block" height={240} />
        ) : (
          <ol className={styles.timeline}>
            {events.map((event) => (
              <li key={event.id} className={styles.item}>
                <span className={styles.dot} data-level={event.level} aria-hidden="true" />
                <div className={styles.body}>
                  <div className={styles.itemHeader}>
                    <span className={styles.service}>{event.service}</span>
                    <Badge tone={LEVEL_TONE[event.level]}>{event.level}</Badge>
                  </div>
                  <p className={styles.message}>{event.message}</p>
                  <p className={styles.time}>{formatDateTime(event.timestamp)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
