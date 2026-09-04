import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import type { ChaosConfig } from '@buggybooks/types';

const defaultChaosConfig: ChaosConfig = {
  checkoutFailureRate: 0.0,
  inventoryDelayMs: 0,
  jwtExpirySeconds: 900,
  websocketDropRate: 0.0,
  uploadFailureRate: 0.0,
  injectA11yViolations: false,
  visualChaos: false,
  inventoryLockingRate: 0.0
};

interface PresetProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: Partial<ChaosConfig>;
}

const PRESETS: PresetProfile[] = [
  {
    id: 'preset-baseline',
    name: 'Clean Baseline',
    icon: '🛡️',
    description: 'Zero failure injection, no artificial latency, all visual glitches disabled.',
    config: {
      checkoutFailureRate: 0.0,
      inventoryDelayMs: 0,
      jwtExpirySeconds: 900,
      websocketDropRate: 0.0,
      uploadFailureRate: 0.0,
      injectA11yViolations: false,
      visualChaos: false,
      inventoryLockingRate: 0.0
    }
  },
  {
    id: 'preset-flaky-gateway',
    name: 'Flaky Gateway',
    icon: '⚡',
    description: 'High payment timeout failure rates with elevated file upload drops.',
    config: {
      checkoutFailureRate: 0.40,
      inventoryDelayMs: 1500,
      jwtExpirySeconds: 900,
      websocketDropRate: 0.10,
      uploadFailureRate: 0.35,
      injectA11yViolations: false,
      visualChaos: false,
      inventoryLockingRate: 0.0
    }
  },
  {
    id: 'preset-high-contention',
    name: 'High Contention',
    icon: '⚔️',
    description: 'Simulates 80% optimistic stock locking contention on checkout.',
    config: {
      checkoutFailureRate: 0.0,
      inventoryDelayMs: 500,
      jwtExpirySeconds: 900,
      websocketDropRate: 0.0,
      uploadFailureRate: 0.0,
      injectA11yViolations: false,
      visualChaos: false,
      inventoryLockingRate: 0.80
    }
  },
  {
    id: 'preset-ui-stress',
    name: 'UI & A11y Stress',
    icon: '🌪️',
    description: 'Enables intentional accessibility regressions, layout shifts, and visual blur.',
    config: {
      checkoutFailureRate: 0.10,
      inventoryDelayMs: 1000,
      jwtExpirySeconds: 300,
      websocketDropRate: 0.25,
      uploadFailureRate: 0.15,
      injectA11yViolations: true,
      visualChaos: true,
      inventoryLockingRate: 0.20
    }
  }
];

export default function ChaosDashboard() {
  const [config, setConfig] = useState<ChaosConfig>(defaultChaosConfig);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api.getChaosConfig()
      .then((data) => {
        if (!ignore) {
          setConfig({
            ...defaultChaosConfig,
            ...data
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load chaos configuration:', err);
          toast.error('Failed to load live chaos configuration from backend');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSliderChange = (key: keyof ChaosConfig, value: number) => {
    setActivePreset(null);
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggleChange = (key: keyof ChaosConfig, value: boolean) => {
    setActivePreset(null);
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyPreset = (preset: PresetProfile) => {
    setActivePreset(preset.id);
    setConfig(prev => ({
      ...prev,
      ...preset.config
    }));
    toast.success(`Preset "${preset.name}" selected! Click "Apply" to save.`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateChaosConfig(config);
      if (res.success && res.config) {
        setConfig(prev => ({ ...prev, ...res.config }));
      }
      toast.success('⚡ Chaos configuration synchronized with backend!');
    } catch (err) {
      console.error('Failed to update chaos config:', err);
      toast.error('Failed to apply chaos configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await api.resetChaosConfig();
      setConfig(defaultChaosConfig);
      setActivePreset('preset-baseline');
      toast.success('🛡️ State reset to factory default baseline!');
    } catch (err) {
      console.error('Failed to reset chaos state:', err);
      toast.error('Failed to reset chaos state');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chaos-dashboard-container" id="chaos-dashboard">
      {/* Header Banner */}
      <header className="chaos-header-banner">
        <div>
          <h1 className="chaos-header-title">⚡ Chaos Control Center</h1>
          <p className="chaos-header-subtitle">
            Inject stochastic API failures, artificial latency, optimistic locking contention, and accessibility defects on the fly.
          </p>
        </div>
        <div className="chaos-status-badge" id="chaos-status-badge">
          <span className="chaos-status-dot" />
          <span>{loading ? 'Connecting...' : 'Live Engine Active'}</span>
        </div>
      </header>

      {/* Preset Profiles */}
      <section className="chaos-presets-section">
        <h2 className="chaos-presets-title">🎯 Instant Testing Presets</h2>
        <div className="chaos-preset-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={preset.id}
              type="button"
              className={`chaos-preset-card ${activePreset === preset.id ? 'active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              <div className="chaos-preset-name">
                {preset.icon} {preset.name}
              </div>
              <div className="chaos-preset-desc">{preset.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Controls Grid */}
      <div className="chaos-grid">
        {/* Section 1: Stochastic Failure Rates */}
        <div className="chaos-card">
          <h2 className="chaos-card-title">🎲 Stochastic Failure Rates</h2>

          {/* Checkout Failure Rate */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-checkout-failure" className="chaos-label">
                Checkout Failure Rate
              </label>
              <span className="chaos-value-badge" id="val-checkout-failure">
                {Math.round(config.checkoutFailureRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              id="slider-checkout-failure"
              min="0"
              max="1"
              step="0.05"
              value={config.checkoutFailureRate}
              onChange={(e) => handleSliderChange('checkoutFailureRate', parseFloat(e.target.value))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              Probability of POST /api/checkout/process returning 500 Payment Gateway Timeout.
            </span>
          </div>

          {/* Inventory Locking Rate */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-inventory-locking" className="chaos-label">
                Stock Lock Contention Rate
              </label>
              <span className="chaos-value-badge" id="val-inventory-locking">
                {Math.round(config.inventoryLockingRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              id="slider-inventory-locking"
              min="0"
              max="1"
              step="0.05"
              value={config.inventoryLockingRate}
              onChange={(e) => handleSliderChange('inventoryLockingRate', parseFloat(e.target.value))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              Simulates optimistic locking race collisions throwing 409 Conflict during checkout.
            </span>
          </div>

          {/* Upload Failure Rate */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-upload-failure" className="chaos-label">
                Avatar Upload Failure Rate
              </label>
              <span className="chaos-value-badge" id="val-upload-failure">
                {Math.round(config.uploadFailureRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              id="slider-upload-failure"
              min="0"
              max="1"
              step="0.05"
              value={config.uploadFailureRate}
              onChange={(e) => handleSliderChange('uploadFailureRate', parseFloat(e.target.value))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              Probability of avatar multipart uploads failing with 500 Storage Exception.
            </span>
          </div>

          {/* WebSocket Drop Rate */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-websocket-drop" className="chaos-label">
                WebSocket Drop Rate
              </label>
              <span className="chaos-value-badge" id="val-websocket-drop">
                {Math.round(config.websocketDropRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              id="slider-websocket-drop"
              min="0"
              max="1"
              step="0.05"
              value={config.websocketDropRate}
              onChange={(e) => handleSliderChange('websocketDropRate', parseFloat(e.target.value))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              Rate of socket connection drops and stock ticker event disruptions.
            </span>
          </div>
        </div>

        {/* Section 2: Artificial Latency & TTL */}
        <div className="chaos-card">
          <h2 className="chaos-card-title">⏱️ Latencies & Expirations</h2>

          {/* Inventory Delay */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-inventory-delay" className="chaos-label">
                Inventory Report Latency
              </label>
              <span className="chaos-value-badge" id="val-inventory-delay">
                {config.inventoryDelayMs}ms
              </span>
            </div>
            <input
              type="range"
              id="slider-inventory-delay"
              min="0"
              max="5000"
              step="250"
              value={config.inventoryDelayMs}
              onChange={(e) => handleSliderChange('inventoryDelayMs', parseInt(e.target.value, 10))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              Simulated database lag on GET /api/inventory/report to test client timeout resilience.
            </span>
          </div>

          {/* JWT Expiry */}
          <div className="chaos-control-group">
            <div className="chaos-label-row">
              <label htmlFor="slider-jwt-expiry" className="chaos-label">
                Access Token Lifetime
              </label>
              <span className="chaos-value-badge" id="val-jwt-expiry">
                {config.jwtExpirySeconds}s
              </span>
            </div>
            <input
              type="range"
              id="slider-jwt-expiry"
              min="10"
              max="3600"
              step="10"
              value={config.jwtExpirySeconds}
              onChange={(e) => handleSliderChange('jwtExpirySeconds', parseInt(e.target.value, 10))}
              className="chaos-slider"
            />
            <span className="chaos-slider-description">
              JWT token TTL. Set low (e.g. 10s) to exercise client-side silent refresh workflows.
            </span>
          </div>

          {/* Fault Injections Sub-section */}
          <div className="chaos-control-group" style={{ marginTop: '0.5rem' }}>
            <span className="chaos-label" style={{ marginBottom: '0.25rem' }}>
              Fault Injection Toggles
            </span>

            {/* Accessibility Violations */}
            <div className="chaos-toggle-row">
              <div className="chaos-toggle-meta">
                <span className="chaos-toggle-name">Inject A11y Violations</span>
                <span className="chaos-toggle-desc">
                  Strips alt tags, decouples labels, and breaks contrast for Axe testing.
                </span>
              </div>
              <label className="chaos-switch" htmlFor="toggle-a11y-violations">
                <input
                  type="checkbox"
                  id="toggle-a11y-violations"
                  aria-label="Inject A11y Violations"
                  checked={config.injectA11yViolations}
                  onChange={(e) => handleToggleChange('injectA11yViolations', e.target.checked)}
                />
                <span className="chaos-switch-slider" />
              </label>
            </div>

            {/* Visual Chaos */}
            <div className="chaos-toggle-row">
              <div className="chaos-toggle-meta">
                <span className="chaos-toggle-name">Visual Chaos & Layout Shifts</span>
                <span className="chaos-toggle-desc">
                  Triggers unpredictable DOM skew, font shifts, and image filters.
                </span>
              </div>
              <label className="chaos-switch" htmlFor="toggle-visual-chaos">
                <input
                  type="checkbox"
                  id="toggle-visual-chaos"
                  aria-label="Visual Chaos & Layout Shifts"
                  checked={config.visualChaos}
                  onChange={(e) => handleToggleChange('visualChaos', e.target.checked)}
                />
                <span className="chaos-switch-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <footer className="chaos-actions-bar">
        <button
          type="button"
          id="btn-reset-chaos"
          className="chaos-btn chaos-btn-secondary"
          onClick={handleReset}
          disabled={saving}
        >
          🔄 Reset Factory Defaults
        </button>

        <button
          type="button"
          id="btn-save-chaos"
          className="chaos-btn chaos-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ Synchronizing...' : '⚡ Apply Chaos Config'}
        </button>
      </footer>
    </div>
  );
}
