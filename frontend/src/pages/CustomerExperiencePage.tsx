import { useEffect, useState } from 'react';
import { Smile, CheckCircle2, Repeat } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { DateRangeFilter, presetRange, type DateRangeValue } from '../components/ui/DateRangeFilter';
import { MetricTile } from '../components/dashboard/MetricTile';
import { HorizontalBarList } from '../components/charts/HorizontalBarList';
import { getCustomerExperience, type CustomerExperienceData } from '../services/analyticsService';
import { formatPercent } from '../utils/format';
import styles from './CustomerExperiencePage.module.css';

export function CustomerExperiencePage() {
  const [range, setRange] = useState<DateRangeValue>(presetRange('30d'));
  const [data, setData] = useState<CustomerExperienceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCustomerExperience(range).then((result) => {
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
    <div className="page">
      <PageHeader
        title="Customer Experience"
        subtitle="Satisfaction and resolution quality from the customer's side of the call."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Analytics' }, { label: 'Customer Experience' }]}
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      <div className={styles.grid}>
        {loading || !data ? (
          <>
            <MetricTile icon={null} label="" value="" loading />
            <MetricTile icon={null} label="" value="" loading />
            <MetricTile icon={null} label="" value="" loading />
          </>
        ) : (
          <>
            <MetricTile icon={<Smile size={16} />} label="CSAT" value={`${data.csat.value.toFixed(1)} / 5`} deltaPct={data.csat.deltaPct} trend={data.csat.trend} />
            <MetricTile
              icon={<CheckCircle2 size={16} />}
              label="Resolution rate"
              value={formatPercent(data.resolutionRate.value)}
              deltaPct={data.resolutionRate.deltaPct}
              trend={data.resolutionRate.trend}
            />
            <MetricTile
              icon={<Repeat size={16} />}
              label="Repeat call rate"
              value={formatPercent(data.repeatCallRate.value)}
              deltaPct={data.repeatCallRate.deltaPct}
              trend={data.repeatCallRate.trend}
              positiveDirection="down"
            />
          </>
        )}
      </div>

      <Card title="Satisfaction distribution" subtitle="Post-call ratings across every survey response">
        {loading || !data ? (
          <Skeleton variant="block" height={180} />
        ) : (
          <HorizontalBarList
            items={[...data.csatDistribution].reverse().map((d) => ({ key: d.score, label: d.score, value: d.count, color: 'var(--color-success)' }))}
          />
        )}
      </Card>
    </div>
  );
}
