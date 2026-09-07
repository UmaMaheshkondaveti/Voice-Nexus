import { useState } from 'react';
import { Calendar } from 'lucide-react';
import styles from './DateRangeFilter.module.css';

export type DateRangeKey = 'today' | '7d' | '30d' | 'custom';

export interface DateRangeValue {
  key: DateRangeKey;
  start: string;
  end: string;
  label: string;
}

const PRESETS: { key: Exclude<DateRangeKey, 'custom'>; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: '7 days', days: 6 },
  { key: '30d', label: '30 days', days: 29 },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function presetRange(key: Exclude<DateRangeKey, 'custom'>): DateRangeValue {
  const preset = PRESETS.find((p) => p.key === key)!;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - preset.days);
  return { key, start: isoDate(start), end: isoDate(end), label: preset.label };
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(value.start);
  const [draftEnd, setDraftEnd] = useState(value.end);

  return (
    <div className={styles.wrap}>
      <div className={styles.segmented} role="tablist" aria-label="Date range">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={value.key === p.key}
            className={[styles.segment, value.key === p.key ? styles.active : ''].join(' ')}
            onClick={() => onChange(presetRange(p.key))}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={value.key === 'custom'}
          className={[styles.segment, value.key === 'custom' ? styles.active : ''].join(' ')}
          onClick={() => setCustomOpen((o) => !o)}
        >
          <Calendar size={13} />
          {value.key === 'custom' ? `${value.start} → ${value.end}` : 'Custom'}
        </button>
      </div>

      {customOpen && (
        <div className={styles.popover}>
          <label className={styles.fieldLabel}>
            From
            <input type="date" value={draftStart} max={draftEnd} onChange={(e) => setDraftStart(e.target.value)} />
          </label>
          <label className={styles.fieldLabel}>
            To
            <input type="date" value={draftEnd} min={draftStart} onChange={(e) => setDraftEnd(e.target.value)} />
          </label>
          <button
            type="button"
            className={styles.apply}
            onClick={() => {
              onChange({ key: 'custom', start: draftStart, end: draftEnd, label: 'Custom' });
              setCustomOpen(false);
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
