import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL as string;
const RETRY_INTERVAL_MS = 2000;
const SLOW_THRESHOLD_MS = 30_000;
const MIN_DISPLAY_MS = 1000; // Prevent UI flicker on instant responses

export type BackendStatus = 'loading' | 'slow' | 'ready' | 'error';

export interface BackendHealthState {
  status: BackendStatus;
  isReady: boolean;
  isSlow: boolean;
  retryCount: number;
  manualRetry: () => void;
}

export function useBackendHealth(): BackendHealthState {
  const [status, setStatus] = useState<BackendStatus>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isReadyRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
  }, []);

  const checkHealth = useCallback(async () => {
    if (!isMountedRef.current || isReadyRef.current) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok && isMountedRef.current && !isReadyRef.current) {
        isReadyRef.current = true;
        clearTimers();

        // Enforce minimum display time to prevent flash
        const elapsed = Date.now() - startTimeRef.current;
        const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          if (isMountedRef.current) setStatus('ready');
        }, delay);
      }
    } catch {
      // Network error or abort — will retry via interval
      if (isMountedRef.current && !isReadyRef.current) {
        setRetryCount((c) => c + 1);
      }
    }
  }, [clearTimers]);

  const startPolling = useCallback(() => {
    isReadyRef.current = false;
    startTimeRef.current = Date.now();
    setStatus('loading');
    setRetryCount(0);
    clearTimers();

    // Fire immediately, then repeat every RETRY_INTERVAL_MS
    checkHealth();
    intervalRef.current = setInterval(checkHealth, RETRY_INTERVAL_MS);

    // After SLOW_THRESHOLD_MS, mark as slow (but keep retrying)
    slowTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && !isReadyRef.current) {
        setStatus('slow');
      }
    }, SLOW_THRESHOLD_MS);
  }, [checkHealth, clearTimers]);

  // Start polling on mount
  useEffect(() => {
    isMountedRef.current = true;
    startPolling();
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [startPolling, clearTimers]);

  const manualRetry = useCallback(() => {
    if (status === 'ready') return;
    startPolling();
  }, [status, startPolling]);

  return {
    status,
    isReady: status === 'ready',
    isSlow: status === 'slow',
    retryCount,
    manualRetry,
  };
}
