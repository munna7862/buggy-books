import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ChaosConfig } from '@buggybooks/types';

interface ChaosContextType {
  config: Partial<ChaosConfig>;
}

const ChaosContext = createContext<ChaosContextType>({ config: {} });

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:4000/api`;
  }
  return envUrl || 'http://127.0.0.1:4000/api';
};

const BASE_API_URL = resolveBaseUrl();

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Partial<ChaosConfig>>({});

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

  // Toggle the a11y violation body class
  useEffect(() => {
    if (config.injectA11yViolations) {
      document.body.classList.add('a11y-violations-active');
    } else {
      document.body.classList.remove('a11y-violations-active');
    }
  }, [config.injectA11yViolations]);

  // Toggle the visual chaos body class
  useEffect(() => {
    if (config.visualChaos) {
      document.body.classList.add('visual-chaos-active');
    } else {
      document.body.classList.remove('visual-chaos-active');
    }
  }, [config.visualChaos]);

  return (
    <ChaosContext.Provider value={{ config }}>
      {children}
    </ChaosContext.Provider>
  );
}

export const useChaos = () => useContext(ChaosContext);

