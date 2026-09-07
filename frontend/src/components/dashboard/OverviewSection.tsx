import { useEffect, useState } from 'react';
import {
  PhoneCall,
  Activity,
  Bot,
  ShieldCheck,
  ArrowUpRight as EscalatedIcon,
  PhoneMissed,
  Clock,
  Percent,
  ArrowRightLeft,
  CheckCircle2,
  Smile,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DateRangeValue } from '../ui/DateRangeFilter';
import { getOverviewMetrics } from '../../services/analyticsService';
import type { OverviewMetrics } from '../../types/analytics';
import { MetricTile } from './MetricTile';
import { MetricDetailModal, type MetricDetailModalProps } from './MetricDetailModal';
import { formatCurrency, formatNumber, formatPercent, formatSeconds } from '../../utils/format';
import styles from './OverviewSection.module.css';

type ModalConfig = Omit<MetricDetailModalProps, 'open' | 'onClose'>;

export function OverviewSection({ range }: { range: DateRangeValue }) {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOverviewMetrics(range).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  function openModal(title: string, description: string, formatted: string, m: OverviewMetrics[keyof OverviewMetrics], positiveDirection: 'up' | 'down' = 'up') {
    setModal({ title, description, value: formatted, deltaPct: m.deltaPct, trend: m.trend, positiveDirection });
  }

  function scrollToLiveOps() {
    document.getElementById('live-ops')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const tiles = data && [
    {
      icon: <PhoneCall size={16} />,
      label: 'Total calls',
      value: formatNumber(data.totalCalls.value),
      m: data.totalCalls,
      onClick: () => navigate('/calls'),
    },
    {
      icon: <Activity size={16} />,
      label: 'Active calls',
      value: formatNumber(data.activeCalls.value),
      m: data.activeCalls,
      onClick: scrollToLiveOps,
    },
    {
      icon: <Bot size={16} />,
      label: 'Automated calls',
      value: formatNumber(data.automatedCalls.value),
      m: data.automatedCalls,
      onClick: () => navigate('/calls?escalated=false'),
    },
    {
      icon: <ShieldCheck size={16} />,
      label: 'Contained calls',
      value: formatNumber(data.containedCalls.value),
      m: data.containedCalls,
      onClick: () => navigate('/calls?escalated=false&resolution=resolved'),
    },
    {
      icon: <EscalatedIcon size={16} />,
      label: 'Escalated calls',
      value: formatNumber(data.escalatedCalls.value),
      m: data.escalatedCalls,
      positiveDirection: 'down' as const,
      onClick: () => navigate('/calls?escalated=true'),
    },
    {
      icon: <PhoneMissed size={16} />,
      label: 'Abandoned calls',
      value: formatNumber(data.abandonedCalls.value),
      m: data.abandonedCalls,
      positiveDirection: 'down' as const,
      onClick: () =>
        openModal('Abandoned calls', 'Callers who disconnected before an intent could be resolved or an agent reached.', formatNumber(data.abandonedCalls.value), data.abandonedCalls, 'down'),
    },
    {
      icon: <Clock size={16} />,
      label: 'Avg. handle time',
      value: formatSeconds(data.avgHandleTimeSeconds.value),
      m: data.avgHandleTimeSeconds,
      positiveDirection: 'down' as const,
      onClick: () =>
        openModal('Average handle time', 'Average duration of a call from start to resolution or transfer.', formatSeconds(data.avgHandleTimeSeconds.value), data.avgHandleTimeSeconds, 'down'),
    },
    {
      icon: <Percent size={16} />,
      label: 'Containment rate',
      value: formatPercent(data.containmentRate.value),
      m: data.containmentRate,
      onClick: () =>
        openModal('Containment rate', 'Share of calls fully handled by VoiceNexus without a human agent.', formatPercent(data.containmentRate.value), data.containmentRate),
    },
    {
      icon: <ArrowRightLeft size={16} />,
      label: 'Transfer rate',
      value: formatPercent(data.transferRate.value),
      m: data.transferRate,
      positiveDirection: 'down' as const,
      onClick: () =>
        openModal('Transfer rate', 'Share of calls transferred to a live agent.', formatPercent(data.transferRate.value), data.transferRate, 'down'),
    },
    {
      icon: <CheckCircle2 size={16} />,
      label: 'Resolution rate',
      value: formatPercent(data.resolutionRate.value),
      m: data.resolutionRate,
      onClick: () =>
        openModal('Resolution rate', 'Share of calls that ended in a fully or partially resolved outcome.', formatPercent(data.resolutionRate.value), data.resolutionRate),
    },
    {
      icon: <Smile size={16} />,
      label: 'CSAT',
      value: `${data.csat.value.toFixed(1)} / 5`,
      m: data.csat,
      onClick: () => openModal('CSAT', 'Average post-call satisfaction score.', `${data.csat.value.toFixed(1)} / 5`, data.csat),
    },
    {
      icon: <DollarSign size={16} />,
      label: 'Est. cost savings',
      value: formatCurrency(data.estimatedCostSavings.value),
      m: data.estimatedCostSavings,
      onClick: () =>
        openModal('Estimated cost savings', 'Modeled savings from automating calls vs. routing every call to a live agent.', formatCurrency(data.estimatedCostSavings.value), data.estimatedCostSavings),
    },
  ];

  return (
    <>
      <div className={styles.grid}>
        {loading || !tiles
          ? Array.from({ length: 12 }).map((_, i) => <MetricTile key={i} icon={null} label="" value="" loading />)
          : tiles.map((tile) => (
              <MetricTile
                key={tile.label}
                icon={tile.icon}
                label={tile.label}
                value={tile.value}
                deltaPct={tile.m.deltaPct}
                trend={tile.m.trend}
                positiveDirection={tile.positiveDirection ?? 'up'}
                onClick={tile.onClick}
              />
            ))}
      </div>
      {modal && <MetricDetailModal open onClose={() => setModal(null)} {...modal} />}
    </>
  );
}
