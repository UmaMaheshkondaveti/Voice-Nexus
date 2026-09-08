import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { DonutChart, type DonutSlice } from '../charts/DonutChart';
import { getResolutionBreakdown } from '../../services/analyticsService';
import type { ResolutionBreakdown } from '../../types/analytics';
import { formatNumber } from '../../utils/format';

export function ResolutionSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<ResolutionBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getResolutionBreakdown(range).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const total = data ? data.resolved + data.partial + data.escalated + data.failed : 0;

  const slices: DonutSlice[] | null = data && [
    { key: 'resolved', label: 'Resolved', value: data.resolved, color: 'var(--color-success)' },
    { key: 'partial', label: 'Partially resolved', value: data.partial, color: 'var(--color-warn)' },
    { key: 'escalated', label: 'Escalated', value: data.escalated, color: 'var(--color-escalation)' },
    { key: 'failed', label: 'Failed', value: data.failed, color: 'var(--color-danger)' },
  ];

  return (
    <Card title="Resolution outcomes" subtitle="How calls concluded">
      {loading || !slices ? (
        <Skeleton variant="block" height={200} />
      ) : (
        <DonutChart
          data={slices}
          centerValue={formatNumber(total)}
          centerLabel="calls"
          onSliceClick={(slice) => navigate(`/calls?resolution=${slice.key}`)}
        />
      )}
    </Card>
  );
}
