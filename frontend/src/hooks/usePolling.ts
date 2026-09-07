import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
  intervalMs: number;
  immediate?: boolean;
}

/**
 * Runs `fetcher` on mount and every `intervalMs`, exposing the latest resolved
 * value plus a manual `refresh`. Extracted from the duplicated fetch+setInterval
 * pattern previously copy-pasted across DashboardPage and AgentHandoffPage.
 */
export function usePolling<T>(fetcher: () => Promise<T>, { intervalMs, immediate = true }: UsePollingOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
