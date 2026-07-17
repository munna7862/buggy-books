import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChaosConfig {
  checkoutFailureRate?: number;
  inventoryDelayMs?: number;
  jwtExpirySeconds?: number;
  websocketDropRate?: number;
  uploadFailureRate?: number;
  injectA11yViolations?: boolean;
}

interface ChaosContextType {
  config: ChaosConfig;
}

const ChaosContext = createContext<ChaosContextType>({ config: {} });

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ChaosConfig>({});

  const fetchConfig = () => {
    fetch(`${BASE_API_URL}/test/config`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then((data) => {
        setConfig(data);
      })
      .catch(() => {
        // Fallback or ignore in case database/server is restarting
      });
  };

  useEffect(() => {
    fetchConfig();
    // Poll the chaos config every 3 seconds to dynamically adapt changes without requiring reload
    const interval = setInterval(fetchConfig, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ChaosContext.Provider value={{ config }}>
      {children}
    </ChaosContext.Provider>
  );
}

export const useChaos = () => useContext(ChaosContext);
