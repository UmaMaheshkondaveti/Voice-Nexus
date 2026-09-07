import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Sparkline } from '../charts/Sparkline';
import { Skeleton } from '../ui/Skeleton';
import { formatDelta } from '../../utils/format';
import styles from './MetricTile.module.css';

export interface MetricTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  deltaPct?: number;
  trend?: number[];
  positiveDirection?: 'up' | 'down';
  onClick?: () => void;
  loading?: boolean;
}

export function MetricTile({
  icon,
  label,
  value,
  deltaPct,
  trend,
  positiveDirection = 'up',
  onClick,
  loading = false,
}: MetricTileProps) {
  if (loading) {
    return (
      <div className={styles.tile}>
        <Skeleton variant="circle" />
        <Skeleton variant="line" width="60%" />
        <Skeleton variant="line" width="40%" height="1.6em" />
      </div>
    );
  }

  const isGood = deltaPct === undefined ? null : (deltaPct >= 0) === (positiveDirection === 'up');

  return (
    <button
      type="button"
      className={[styles.tile, onClick ? styles.clickable : ''].join(' ')}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        {deltaPct !== undefined && (
          <span className={[styles.delta, isGood ? styles.good : styles.bad].join(' ')}>
            {deltaPct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatDelta(deltaPct)}
          </span>
        )}
      </div>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {trend && trend.length > 1 && (
        <div className={styles.sparkline}>
          <Sparkline data={trend} color={isGood === false ? 'var(--color-danger)' : 'var(--color-primary-500)'} height={28} />
        </div>
      )}
    </button>
  );
}
