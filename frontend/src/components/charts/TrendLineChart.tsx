import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './charts.module.css';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

export interface TrendLineChartProps<T> {
  data: T[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
}

export function TrendLineChart<T extends object>({ data, xKey, series, height = 260 }: TrendLineChartProps<T>) {
  return (
    <div className={styles.chartWrap} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dataKey={xKey as any}
            tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-gray-900)',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              color: 'white',
            }}
            labelStyle={{ color: 'white', fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
