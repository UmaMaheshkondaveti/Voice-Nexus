import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  interactive?: boolean;
}

export function Card({
  title,
  subtitle,
  actions,
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [styles.card, styles[`pad-${padding}`], interactive ? styles.interactive : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {(title || actions) && (
        <div className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
