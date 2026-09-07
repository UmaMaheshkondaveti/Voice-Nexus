import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { HorizontalBarList } from '../charts/HorizontalBarList';
import { getIntentBreakdown } from '../../services/analyticsService';
import type { IntentBreakdownItem } from '../../types/analytics';
import { formatNumber } from '../../utils/format';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)'];

export function IntentSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<IntentBreakdownItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getIntentBreakdown(range).then((result) => {
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
    <Card title="Intent distribution" subtitle="What customers are calling about">
      {loading || !data ? (
        <Skeleton variant="block" height={200} />
      ) : (
        <HorizontalBarList
          items={data.map((item, i) => ({ key: item.key, label: item.label, value: item.count, color: COLORS[i % COLORS.length] }))}
          valueFormatter={formatNumber}
          onItemClick={(item) => navigate(`/calls?intent=${item.key}`)}
        />
      )}
    </Card>
  );
}
