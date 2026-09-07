import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangeFilter, presetRange, type DateRangeValue } from '../components/ui/DateRangeFilter';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { CallVolumeSection } from '../components/dashboard/CallVolumeSection';
import { ResolutionSection } from '../components/dashboard/ResolutionSection';

export function CallAnalyticsPage() {
  const [range, setRange] = useState<DateRangeValue>(presetRange('30d'));

  return (
    <div className="page">
      <PageHeader
        title="Call Analytics"
        subtitle="Volume, containment, and resolution trends for every VoiceNexus call."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Analytics' }, { label: 'Call Analytics' }]}
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />
      <OverviewSection range={range} />
      <CallVolumeSection range={range} />
      <ResolutionSection range={range} />
    </div>
  );
}
