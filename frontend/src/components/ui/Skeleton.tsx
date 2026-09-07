import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'line' | 'block' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'line', width, height, className }: SkeletonProps) {
  const classes = [styles.skeleton, styles[variant], className ?? ''].filter(Boolean).join(' ');
  return <span className={classes} style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <span className={styles.textGroup}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="line" width={i === lines - 1 && lines > 1 ? '70%' : '100%'} />
      ))}
    </span>
  );
}
