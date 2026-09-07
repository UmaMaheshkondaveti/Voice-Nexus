import styles from './charts.module.css';

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface HorizontalBarListProps {
  items: BarListItem[];
  onItemClick?: (item: BarListItem) => void;
  valueFormatter?: (value: number) => string;
}

export function HorizontalBarList({ items, onItemClick, valueFormatter }: HorizontalBarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className={styles.barList}>
      {items.map((item) => (
        <div
          key={item.key}
          className={onItemClick ? styles.barRowClickable : styles.barRow}
          onClick={() => onItemClick?.(item)}
          role={onItemClick ? 'button' : undefined}
          tabIndex={onItemClick ? 0 : undefined}
        >
          <span className={styles.barLabel}>{item.label}</span>
          <span className={styles.barTrack}>
            <span
              className={styles.barFill}
              style={{ width: `${(item.value / max) * 100}%`, background: item.color ?? 'var(--color-primary-500)' }}
            />
          </span>
          <span className={styles.barValue}>{valueFormatter ? valueFormatter(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}
