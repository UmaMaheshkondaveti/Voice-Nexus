import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { TrendLineChart } from '../charts/TrendLineChart';
import { formatDelta } from '../../utils/format';
import styles from './MetricDetailModal.module.css';

export interface MetricDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  value: string;
  deltaPct: number;
  trend: number[];
  positiveDirection?: 'up' | 'down';
}

export function MetricDetailModal({
  open,
  onClose,
  title,
  description,
  value,
  deltaPct,
  trend,
  positiveDirection = 'up',
}: MetricDetailModalProps) {
  const isGood = (deltaPct >= 0) === (positiveDirection === 'up');
  const data = trend.map((v, i) => ({ period: `P${i + 1}`, value: v }));

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className={styles.wrap}>
        <div className={styles.headline}>
          <span className={styles.value}>{value}</span>
          <Badge tone={isGood ? 'success' : 'danger'}>{formatDelta(deltaPct)} vs. prior period</Badge>
        </div>
        <p className={styles.description}>{description}</p>
        <TrendLineChart
          data={data}
          xKey="period"
          series={[{ key: 'value', label: title, color: 'var(--color-primary-500)' }]}
          height={220}
        />
      </div>
    </Modal>
  );
}
