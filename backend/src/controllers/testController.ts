import { Request, Response } from 'express';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';

export const updateConfig = (req: Request, res: Response) => {
  chaosStore.updateConfig(req.body);
  res.json({ success: true, config: chaosStore.getConfig() });
};

export const resetData = (req: Request, res: Response) => {
  dataStore.resetData();
  chaosStore.resetConfig();
  res.json({ success: true, message: 'Test state reset successfully' });
};
