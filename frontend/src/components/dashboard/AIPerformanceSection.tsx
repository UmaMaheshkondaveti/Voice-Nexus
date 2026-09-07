import { useEffect, useState } from 'react';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { RadialGauge } from '../charts/RadialGauge';
import { getAIPerformance } from '../../services/analyticsService';
import type { AIPerformance } from '../../types/analytics';
import styles from './AIPerformanceSection.module.css';

export function AIPerformanceSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<AIPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAIPerformance(range).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <Card title="AI performance" subtitle="How well the conversational engine is understanding and responding">
      {loading || !data ? (
        <Skeleton variant="block" height={160} />
      ) : (
        <div className={styles.grid}>
          <RadialGauge value={data.intentConfidence * 100} displayValue={`${Math.round(data.intentConfidence * 100)}%`} label="Intent confidence" color="var(--chart-1)" />
          <RadialGauge value={data.recognitionAccuracy * 100} displayValue={`${Math.round(data.recognitionAccuracy * 100)}%`} label="Recognition accuracy" color="var(--chart-5)" />
          <RadialGauge value={data.fallbackRate * 100} max={20} displayValue={`${Math.round(data.fallbackRate * 100)}%`} label="Fallback rate" color="var(--color-warn)" />
          <RadialGauge value={data.avgResponseLatencyMs} max={1000} displayValue={`${Math.round(data.avgResponseLatencyMs)}ms`} label="Avg. response latency" color="var(--chart-3)" />
        </div>
      )}
    </Card>
  );
}
