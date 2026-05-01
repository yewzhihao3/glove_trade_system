import React, { useEffect, useState, useRef } from 'react';
import { useBackend } from '../context/BackendContext';
import { healthService } from '../services/api';
import { RefreshCw } from 'lucide-react';

const BackendReconnectOverlay: React.FC = () => {
  const { isBackendDown, setBackendHealthy } = useBackend();
  const [isTakingLong, setIsTakingLong] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isBackendDown) {
      setIsTakingLong(false);
      return;
    }

    const startTime = Date.now();
    let isMounted = true;

    const checkHealth = async () => {
      try {
        await healthService.checkHealth();
        if (isMounted) {
          setBackendHealthy();
        }
      } catch (err) {
        if (!isMounted) return;
        
        if (Date.now() - startTime > 30000) {
          setIsTakingLong(true);
        }
        
        // Retry loop every 2 seconds
        retryTimeoutRef.current = setTimeout(checkHealth, 2000);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [isBackendDown, setBackendHealthy]);

  const handleManualRetry = () => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setIsTakingLong(false);
    
    // Create an immediate local async wrapper since we can't easily re-trigger the exact scoped effect
    const manualCheck = async () => {
      try {
        await healthService.checkHealth();
        setBackendHealthy();
      } catch (err) {
        setIsTakingLong(true);
        retryTimeoutRef.current = setTimeout(() => {
          if (isBackendDown) {
             // Since we're outside the effect, this manual loop isn't ideal for long term, 
             // but it will quickly just hit the timeout again if it fails.
             // Actually, the easiest way to restart the exact same effect loop is to toggle state, but 
             // we can just re-execute the manualCheck.
             manualCheck();
          }
        }, 2000);
      }
    };
    manualCheck();
  };

  if (!isBackendDown) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center flex flex-col items-center">
        
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full relative">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Reconnecting to server...
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Waking up backend (this may take a few seconds)
        </p>

        {isTakingLong && (
          <div className="mt-2 animate-fade-in flex flex-col items-center">
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-4">
              Server is taking longer than expected.
            </p>
            <button
              onClick={handleManualRetry}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendReconnectOverlay;
