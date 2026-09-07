import { Card } from '../ui/Card';
import { StatusDot } from '../ui/StatusDot';
import { Tooltip } from '../ui/Tooltip';
import { Skeleton } from '../ui/Skeleton';
import { usePolling } from '../../hooks/usePolling';
import { getSystemHealth } from '../../services/analyticsService';
import styles from './SystemHealthSection.module.css';

export function SystemHealthSection() {
  const { data, loading } = usePolling(getSystemHealth, { intervalMs: 15000 });

  return (
    <Card title="System health" subtitle="Live status of the services VoiceNexus depends on">
      {loading || !data ? (
        <div className={styles.grid}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} variant="line" height="2.4rem" />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {data.map((svc) => (
            <Tooltip
              key={svc.key}
              content={
                svc.status === 'operational'
                  ? `${svc.uptimePct}% uptime · ${svc.latencyMs}ms avg latency`
                  : `${svc.uptimePct}% uptime · last incident ${svc.lastIncident}`
              }
            >
              <div className={styles.row}>
                <StatusDot status={svc.status} label={svc.label} pulse={svc.status !== 'operational'} />
                <span className={styles.uptime}>{svc.uptimePct}%</span>
              </div>
            </Tooltip>
          ))}
        </div>
      )}
    </Card>
  );
}
