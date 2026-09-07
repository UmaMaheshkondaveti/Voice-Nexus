export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSeconds(value: number): string {
  const mins = Math.floor(value / 60);
  const secs = Math.round(value % 60);
  return `${mins}m ${secs}s`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  if (value < 10) {
    return `$${value.toFixed(2)}`;
  }
  return `$${Math.round(value)}`;
}

export function formatDelta(deltaPct: number): string {
  const sign = deltaPct >= 0 ? '+' : '';
  return `${sign}${(deltaPct * 100).toFixed(1)}%`;
}

export function formatMs(value: number): string {
  return `${Math.round(value)}ms`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
