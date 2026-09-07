import styles from './StatusDot.module.css';

export type HealthStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

const LABELS: Record<HealthStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  maintenance: 'Maintenance',
};

export interface StatusDotProps {
  status: HealthStatus;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function StatusDot({ status, label, pulse = false, size = 'md' }: StatusDotProps) {
  return (
    <span className={styles.wrap}>
      <span
        className={[styles.dot, styles[status], size === 'sm' ? styles.sm : '', pulse ? styles.pulse : '']
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      />
      <span className={styles.label}>{label ?? LABELS[status]}</span>
    </span>
  );
}
