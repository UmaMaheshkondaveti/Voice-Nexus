import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { DateRangeFilter, presetRange, type DateRangeValue } from '../components/ui/DateRangeFilter';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { CallVolumeSection } from '../components/dashboard/CallVolumeSection';
import { IntentSection } from '../components/dashboard/IntentSection';
import { ResolutionSection } from '../components/dashboard/ResolutionSection';
import { EscalationSection } from '../components/dashboard/EscalationSection';
import { AIPerformanceSection } from '../components/dashboard/AIPerformanceSection';
import { LiveOpsSection } from '../components/dashboard/LiveOpsSection';
import { SystemHealthSection } from '../components/dashboard/SystemHealthSection';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const [range, setRange] = useState<DateRangeValue>(presetRange('7d'));
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="page">
      <PageHeader
        title="Contact Center Operations"
        subtitle="Real-time health and performance across every VoiceNexus call."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]}
        actions={
          <>
            <DateRangeFilter value={range} onChange={setRange} />
            <Button variant="outline" leftIcon={<RefreshCw size={14} />} onClick={() => setRefreshKey((k) => k + 1)}>
              Refresh
            </Button>
          </>
        }
      />

      <OverviewSection key={`overview-${refreshKey}`} range={range} />
      <CallVolumeSection key={`volume-${refreshKey}`} range={range} />

      <div className={styles.twoCol}>
        <IntentSection key={`intent-${refreshKey}`} range={range} />
        <ResolutionSection key={`resolution-${refreshKey}`} range={range} />
      </div>

      <EscalationSection key={`escalation-${refreshKey}`} range={range} />
      <AIPerformanceSection key={`ai-${refreshKey}`} range={range} />
      <LiveOpsSection key={`live-${refreshKey}`} />
      <SystemHealthSection key={`health-${refreshKey}`} />
    </div>
  );
}
