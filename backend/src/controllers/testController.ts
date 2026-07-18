import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import { resetUsers } from './authController';

const chaosConfigSchema = z.object({
  checkoutFailureRate: z.number().min(0).max(1).optional(),
  inventoryDelayMs: z.number().int().min(0).max(30000).optional(),
  jwtExpirySeconds: z.number().int().min(1).max(86400).optional(),
  websocketDropRate: z.number().min(0).max(1).optional(),
  uploadFailureRate: z.number().min(0).max(1).optional(),
  injectA11yViolations: z.boolean().optional(),
  visualChaos: z.boolean().optional(),
}).strict(); // reject unknown keys

export const updateConfig = (req: Request, res: Response) => {
  try {
    const validConfig = chaosConfigSchema.parse(req.body);
    chaosStore.updateConfig(validConfig);
    res.json({ success: true, config: chaosStore.getConfig() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request: Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const resetData = (req: Request, res: Response) => {
  dataStore.resetData();
  chaosStore.resetConfig();
  resetUsers();
  res.json({ success: true, message: 'Test state reset successfully' });
};

export const getConfig = (req: Request, res: Response) => {
  res.json(chaosStore.getConfig());
};
