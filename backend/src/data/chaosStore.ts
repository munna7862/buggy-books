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
    this.config = { ...this.defaultConfig };
  }

  public getConfig(): ChaosConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<ChaosConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  public resetConfig(): void {
    this.config = { ...this.defaultConfig };
  }
}

export const chaosStore = new ChaosStore();
