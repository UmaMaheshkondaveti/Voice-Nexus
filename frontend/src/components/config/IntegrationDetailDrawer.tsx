import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { StatusDot } from '../ui/StatusDot';
import type { IntegrationDefinition } from '../../types/config';
import { formatDateTime } from '../../utils/format';
import styles from './IntegrationDetailDrawer.module.css';

const STATUS_TONE = { connected: 'success', demo: 'info', disconnected: 'neutral' } as const;
const LOG_TONE = { info: 'neutral', warn: 'warn', error: 'danger' } as const;

export function IntegrationDetailDrawer({ integration, onClose }: { integration: IntegrationDefinition | null; onClose: () => void }) {
  return (
    <Drawer open={integration !== null} onClose={onClose} title={integration?.name} subtitle={integration?.category} width={480}>
      {integration && (
        <div className={styles.wrap}>
          <div className={styles.badgeRow}>
            <Badge tone={STATUS_TONE[integration.status]}>{integration.status === 'demo' ? 'Demo / Mock' : integration.status}</Badge>
            <StatusDot status={integration.health} />
          </div>
          <p className={styles.description}>{integration.description}</p>
          <dl className={styles.factGrid}>
            <div>
              <dt>Last successful connection</dt>
              <dd>{integration.lastSuccessfulConnection ? formatDateTime(integration.lastSuccessfulConnection) : 'Never'}</dd>
            </div>
          </dl>

          <h3 className={styles.sectionTitle}>Recent logs</h3>
          {integration.logs.length === 0 ? (
            <p className="empty-state">No log activity yet.</p>
          ) : (
            <ul className={styles.logs}>
              {integration.logs.map((log, i) => (
                <li key={i} className={styles.logRow}>
                  <Badge tone={LOG_TONE[log.level]}>{log.level}</Badge>
                  <div>
                    <p className={styles.logMessage}>{log.message}</p>
                    <p className={styles.logTime}>{formatDateTime(log.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Drawer>
  );
}
