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

  public getConfig(): ChaosConfig {
    const saved = storage.get('chaosStore');
    if (saved) return { ...this.defaultConfig, ...saved };
    const initial = { ...this.defaultConfig };
    storage.set('chaosStore', initial);
    return initial;
  }

  public updateConfig(newConfig: Partial<ChaosConfig>): void {
    const current = this.getConfig();
    const updated = {
      ...current,
      ...newConfig
    };
    storage.set('chaosStore', updated);
  }

  public resetConfig(): void {
    storage.set('chaosStore', { ...this.defaultConfig });
  }
}

export const chaosStore = new ChaosStore();
