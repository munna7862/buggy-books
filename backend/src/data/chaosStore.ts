import { storage } from './storage';
import type { ChaosConfig } from '@buggybooks/types';

export type { ChaosConfig };

class ChaosStore {
  private config: ChaosConfig;

  private readonly defaultConfig: ChaosConfig = {
    checkoutFailureRate: 0.15,
    inventoryDelayMs: 3000,
    jwtExpirySeconds: 900,
    websocketDropRate: 0.0,
    uploadFailureRate: 0.0,
    injectA11yViolations: false,
    visualChaos: false
  };

  constructor() {
    const saved = storage.get('chaosStore');
    this.config = saved || { ...this.defaultConfig };
  }

  private save() {
    storage.set('chaosStore', this.config);
  }

  public getConfig(): ChaosConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<ChaosConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    this.save();
  }

  public resetConfig(): void {
    this.config = { ...this.defaultConfig };
    this.save();
  }
}

export const chaosStore = new ChaosStore();
