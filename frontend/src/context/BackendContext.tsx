import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackendContextProps {
  isBackendDown: boolean;
  isReconnecting: boolean;
  triggerReconnect: () => void;
  setBackendHealthy: () => void;
}

const BackendContext = createContext<BackendContextProps>({} as BackendContextProps);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const triggerReconnect = () => {
    setIsBackendDown(true);
    setIsReconnecting(true);
  };

  const setBackendHealthy = () => {
    setIsBackendDown(false);
    setIsReconnecting(false);
  };

  useEffect(() => {
    const handleBackendDown = () => {
      // Prevent multiple triggers
      setIsBackendDown(prev => {
        if (!prev) return true;
        return prev;
      });
      setIsReconnecting(prev => {
        if (!prev) return true;
        return prev;
      });
    };

    window.addEventListener('backend-down', handleBackendDown);
    return () => window.removeEventListener('backend-down', handleBackendDown);
  }, []);

  return (
    <BackendContext.Provider value={{ isBackendDown, isReconnecting, triggerReconnect, setBackendHealthy }}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => useContext(BackendContext);
