import request from 'supertest';
import app from '../app';
import router from '../routes/api';
import { logger, loggerStore } from '../utils/logger';

describe('Correlation ID and Structured Logging Integration', () => {
  let loggerInfoSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on logger but let it print or mock implementation to suppress log pollution in tests
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('should attach x-correlation-id to all response headers', async () => {
    const res = await request(app).get('/api/books');
    expect(res.headers['x-correlation-id']).toBeDefined();
    expect(typeof res.headers['x-correlation-id']).toBe('string');
  });

  it('should reuse x-correlation-id if sent in request headers', async () => {
    const customId = 'test-correlation-uuid-999';
    const res = await request(app)
      .get('/api/books')
      .set('x-correlation-id', customId);
    expect(res.headers['x-correlation-id']).toBe(customId);
  });

  it('should include correlationId in the JSON body for centralized server errors (500)', async () => {
    // Send invalid JSON body to an endpoint to trigger a 400/500 JSON parsing error in Express body-parser,
    // which automatically goes to the centralized error handler.
    const customId = 'error-trigger-correlation-id';
    const res = await request(app)
      .post('/api/login')
      .set('x-correlation-id', customId)
      .set('Content-Type', 'application/json')
      .send('invalid-json-{'); // Trigger BodyParser syntax error

    expect(res.status).toBe(400); // Express body-parser returns 400 for bad JSON
    expect(res.body.error).toBe('Internal Server Error');
    expect(res.body.correlationId).toBe(customId);
  });

  it('should propagate correlation ID context through AsyncLocalStorage during request lifetime', async () => {
    const customId = 'context-check-id';
    
    // Register a temporary test route on the API router to directly check active AsyncLocalStorage store context
    router.get('/test-correlation-context-direct', (req, res) => {
      res.json(loggerStore.getStore() || { error: 'No context found' });
    });

    const res = await request(app)
      .get('/api/test-correlation-context-direct')
      .set('x-correlation-id', customId);
      
    expect(res.status).toBe(200);
    expect(res.body.correlationId).toBe(customId);
  });
});
