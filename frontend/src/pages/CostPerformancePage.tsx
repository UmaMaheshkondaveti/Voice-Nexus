import { useEffect, useState } from 'react';
import { DollarSign, PhoneForwarded, Receipt, PiggyBank } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { DateRangeFilter, presetRange, type DateRangeValue } from '../components/ui/DateRangeFilter';
import { MetricTile } from '../components/dashboard/MetricTile';
import { TrendLineChart } from '../components/charts/TrendLineChart';
import { getCostPerformance, type CostPerformanceData } from '../services/analyticsService';
import { formatCurrency } from '../utils/format';
import styles from './CostPerformancePage.module.css';

export function CostPerformancePage() {
  const [range, setRange] = useState<DateRangeValue>(presetRange('30d'));
  const [data, setData] = useState<CostPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCostPerformance(range).then((result) => {
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
        title="Cost & Performance"
        subtitle="What automation is saving, and where escalations still add cost."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Analytics' }, { label: 'Cost & Performance' }]}
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      <div className={styles.grid}>
        {loading || !data ? (
          <>
            <MetricTile icon={null} label="" value="" loading />
            <MetricTile icon={null} label="" value="" loading />
            <MetricTile icon={null} label="" value="" loading />
            <MetricTile icon={null} label="" value="" loading />
          </>
        ) : (
          <>
            <MetricTile icon={<DollarSign size={16} />} label="Cost per automated call" value={formatCurrency(data.automatedCostPerCall.value)} deltaPct={data.automatedCostPerCall.deltaPct} trend={data.automatedCostPerCall.trend} positiveDirection="down" />
            <MetricTile icon={<PhoneForwarded size={16} />} label="Cost per escalated call" value={formatCurrency(data.escalatedCostPerCall.value)} deltaPct={data.escalatedCostPerCall.deltaPct} trend={data.escalatedCostPerCall.trend} positiveDirection="down" />
            <MetricTile icon={<Receipt size={16} />} label="Cost per resolved call" value={formatCurrency(data.costPerResolvedCall.value)} deltaPct={data.costPerResolvedCall.deltaPct} trend={data.costPerResolvedCall.trend} positiveDirection="down" />
            <MetricTile icon={<PiggyBank size={16} />} label="Estimated savings" value={formatCurrency(data.estimatedSavings.value)} deltaPct={data.estimatedSavings.deltaPct} trend={data.estimatedSavings.trend} />
          </>
        )}
      </div>

      <Card title="Transfer volume" subtitle="How many calls needed a human agent, over time">
        {loading || !data ? (
          <Skeleton variant="block" height={240} />
        ) : (
          <TrendLineChart data={data.transferVolumeTrend} xKey="period" series={[{ key: 'transfers', label: 'Transfers', color: 'var(--chart-8)' }]} />
        )}
      </Card>
    </div>
  );
}
