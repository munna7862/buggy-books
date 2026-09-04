import { Request, Response } from 'express';
import { z } from 'zod';
import { dataStore } from '../data/dataStore';
import { chaosStore } from '../data/chaosStore';
import { authService } from '../services/auth.service';
import { storage } from '../data/storage';

const chaosConfigSchema = z.object({
  checkoutFailureRate: z.number().min(0).max(1).optional(),
  inventoryDelayMs: z.number().int().min(0).max(30000).optional(),
  jwtExpirySeconds: z.number().int().min(1).max(86400).optional(),
  websocketDropRate: z.number().min(0).max(1).optional(),
  uploadFailureRate: z.number().min(0).max(1).optional(),
  injectA11yViolations: z.boolean().optional(),
  visualChaos: z.boolean().optional(),
  inventoryLockingRate: z.number().min(0).max(1).optional(),
}).strict(); // reject unknown keys

const bookStockSchema = z.object({
  stock: z.number().int().min(0)
});

export const updateConfig = (req: Request, res: Response) => {
  const validConfig = chaosConfigSchema.parse(req.body);
  chaosStore.updateConfig(validConfig);
  res.json({ success: true, config: chaosStore.getConfig() });
};

export const resetData = (req: Request, res: Response) => {
  dataStore.resetData();
  chaosStore.resetConfig();
  authService.resetUsers();
  res.json({ success: true, message: 'Test state reset successfully' });
};

export const getConfig = (req: Request, res: Response) => {
  res.json(chaosStore.getConfig());
};

export const setBookStock = (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock } = bookStockSchema.parse(req.body);
  const updatedBook = dataStore.setStock(id, stock);
  if (!updatedBook) {
    return res.status(404).json({ error: `Book with id ${id} not found` });
  }
  return res.json({ success: true, bookId: id, stock: updatedBook.stock, version: updatedBook.version });
};

export const deleteSession = (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = storage.deleteSession(id);
  res.json({
    success: true,
    message: `Session ${id} deleted successfully`,
    deleted,
    activeSessions: storage.getActiveSessionCount()
  });
};
