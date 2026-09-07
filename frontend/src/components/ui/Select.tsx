import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: 'sm' | 'md';
}

export function Select({ options, size = 'md', className, ...rest }: SelectProps) {
  return (
    <span className={[styles.wrap, styles[size]].join(' ')}>
      <select className={[styles.select, className ?? ''].join(' ')} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
    </span>
  );
}
