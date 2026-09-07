import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangeFilter, presetRange, type DateRangeValue } from '../components/ui/DateRangeFilter';
import { AIPerformanceSection } from '../components/dashboard/AIPerformanceSection';
import { IntentSection } from '../components/dashboard/IntentSection';
import { EscalationSection } from '../components/dashboard/EscalationSection';

export function AIAnalyticsPage() {
  const [range, setRange] = useState<DateRangeValue>(presetRange('30d'));

  return (
    <div className="page">
      <PageHeader
        title="AI Analytics"
        subtitle="How well VoiceNexus's conversational engine understands, responds, and knows when to hand off."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Analytics' }, { label: 'AI Analytics' }]}
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />
      <AIPerformanceSection range={range} />
      <IntentSection range={range} />
      <EscalationSection range={range} />
    </div>
  );
}
