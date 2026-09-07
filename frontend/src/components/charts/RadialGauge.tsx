import styles from './charts.module.css';

export interface RadialGaugeProps {
  value: number;
  max?: number;
  label: string;
  displayValue: string;
  color?: string;
  size?: number;
}

export function RadialGauge({ value, max = 100, label, displayValue, color = 'var(--color-primary-500)', size = 108 }: RadialGaugeProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className={styles.gauge}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.gaugeSvg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-gray-200)"
          strokeWidth={9}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={styles.gaugeArc}
        />
      </svg>
      <div className={styles.gaugeCenter}>
        <span className={styles.gaugeValue}>{displayValue}</span>
      </div>
      <span className={styles.gaugeLabel}>{label}</span>
    </div>
  );
}
