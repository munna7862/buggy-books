import { storage } from './storage';

export interface ChaosConfig {
  checkoutFailureRate: number; // 0.0 to 1.0 (default 0.15)
  inventoryDelayMs: number;    // milliseconds (default 3000)
}

class ChaosStore {
  private config: ChaosConfig;

  private readonly defaultConfig: ChaosConfig = {
    checkoutFailureRate: 0.15,
    inventoryDelayMs: 3000
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
