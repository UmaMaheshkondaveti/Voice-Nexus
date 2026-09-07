import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './charts.module.css';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSlice[];
  height?: number;
  onSliceClick?: (slice: DonutSlice) => void;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, height = 220, onSliceClick, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={styles.donutWrap}>
      <div className={styles.chartWrap} style={{ height, flex: '0 0 auto', width: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              onClick={(entry) => onSliceClick?.(entry as unknown as DonutSlice)}
            >
              {data.map((slice) => (
                <Cell key={slice.key} fill={slice.color} cursor={onSliceClick ? 'pointer' : 'default'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-gray-900)',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                color: 'white',
              }}
              formatter={(value, name) => {
                const numeric = typeof value === 'number' ? value : 0;
                return [`${numeric} (${total ? Math.round((numeric / total) * 100) : 0}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className={styles.donutCenter}>
            <span className={styles.donutCenterValue}>{centerValue}</span>
            {centerLabel && <span className={styles.donutCenterLabel}>{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className={styles.legend}>
        {data.map((slice) => (
          <li
            key={slice.key}
            className={onSliceClick ? styles.legendItemClickable : styles.legendItem}
            onClick={() => onSliceClick?.(slice)}
          >
            <span className={styles.legendDot} style={{ background: slice.color }} />
            <span className={styles.legendLabel}>{slice.label}</span>
            <span className={styles.legendValue}>
              {slice.value} · {total ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
