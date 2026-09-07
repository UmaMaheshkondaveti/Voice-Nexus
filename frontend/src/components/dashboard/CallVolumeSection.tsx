import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { TrendLineChart } from '../charts/TrendLineChart';
import { getCallVolume } from '../../services/analyticsService';
import type { CallVolumeData } from '../../types/analytics';

export function CallVolumeSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<CallVolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'hour' | 'day'>('hour');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCallVolume(range).then((result) => {
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
    <Card
      title="Call volume"
      subtitle="Total calls handled vs. automated and escalated volume"
      actions={
        <Tabs
          size="sm"
          items={[
            { value: 'hour', label: 'By hour' },
            { value: 'day', label: 'By day' },
          ]}
          value={view}
          onChange={(v) => setView(v as 'hour' | 'day')}
        />
      }
    >
      {loading || !data ? (
        <Skeleton variant="block" height={260} />
      ) : (
        <>
          <Badge tone="info" icon={<TrendingUp size={12} />} style={{ marginBottom: 4 }}>
            {data.peakLabel}
          </Badge>
          <TrendLineChart
            data={view === 'hour' ? data.byHour : data.byDay}
            xKey="bucket"
            series={[
              { key: 'total', label: 'Total', color: 'var(--chart-7)' },
              { key: 'automated', label: 'Automated', color: 'var(--chart-1)' },
              { key: 'escalated', label: 'Escalated', color: 'var(--chart-8)' },
            ]}
          />
        </>
      )}
    </Card>
  );
}
