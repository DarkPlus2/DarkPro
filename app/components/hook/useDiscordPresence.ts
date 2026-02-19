import { useEffect, useState, useRef, useCallback } from 'react';

export interface DiscordData {
  user: any;
  presence: any;
  roles: any[];
  voice: any;
  guild: any;
}

export function useDiscordPresence(initialInterval = 5000) {
  const [data, setData] = useState<DiscordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [intervalMs, setIntervalMs] = useState(initialInterval);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const res = await fetch('/api/discord', {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs, fetchData]);

  // Save interval preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('discordFlexInterval');
    if (saved) setIntervalMs(parseInt(saved, 10));
  }, []);

  const changeInterval = (ms: number) => {
    setIntervalMs(ms);
    localStorage.setItem('discordFlexInterval', ms.toString());
  };

  return {
    data,
    error,
    isLoading,
    intervalMs,
    autoRefresh,
    setAutoRefresh,
    changeInterval,
    refresh: fetchData,
  };
}
