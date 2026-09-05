import { storage } from './storage';
import type { ChaosConfig } from '@buggybooks/types';

export type { ChaosConfig };

class ChaosStore {
  private readonly defaultConfig: ChaosConfig = {
    checkoutFailureRate: 0.0,
    inventoryDelayMs: 0,
    jwtExpirySeconds: 900,
    websocketDropRate: 0.0,
    uploadFailureRate: 0.0,
    injectA11yViolations: false,
    visualChaos: false,
    inventoryLockingRate: 0.0
  };

  public getConfig(sessionId?: string): ChaosConfig {
    const saved = storage.get('chaosStore', sessionId);
    if (saved) return { ...this.defaultConfig, ...saved };
    
    // If a session has no custom chaos yet, check global config fallback
    if (sessionId) {
      const globalSaved = storage.get('chaosStore');
      if (globalSaved) return { ...this.defaultConfig, ...globalSaved };
    }

    const initial = { ...this.defaultConfig };
    storage.set('chaosStore', initial, sessionId);
    return initial;
  }

  public updateConfig(newConfig: Partial<ChaosConfig>, sessionId?: string): void {
    const current = this.getConfig(sessionId);
    const updated = {
      ...current,
      ...newConfig
    };
    storage.set('chaosStore', updated, sessionId);
  }

  public resetConfig(sessionId?: string): void {
    storage.set('chaosStore', { ...this.defaultConfig }, sessionId);
  }
}

export const chaosStore = new ChaosStore();
