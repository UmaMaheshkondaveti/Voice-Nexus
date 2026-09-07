import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

export function Tabs({ items, value, onChange, size = 'md' }: TabsProps) {
  return (
    <div className={[styles.tabs, styles[size]].join(' ')} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={[styles.tab, active ? styles.active : ''].join(' ')}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
