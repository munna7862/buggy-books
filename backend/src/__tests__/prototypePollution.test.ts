import request from 'supertest';
import app from '../app';

describe('Prototype Pollution Protection', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('should reject registration with __proto__ as username', async () => {
    const res = await request(app).post('/api/register').send({
      username: '__proto__',
      password: 'testpassword123'
    });

    // Should fail — either 400 Bad Request or silent rejection (user not found on login)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject registration with constructor as username', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'constructor',
      password: 'testpassword123'
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject registration with prototype as username', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'prototype',
      password: 'testpassword123'
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should not pollute Object.prototype via __proto__ username', async () => {
    // Attempt to register with a dangerous username
    await request(app).post('/api/register').send({
      username: '__proto__',
      password: 'testpassword123'
    });

    // Verify Object.prototype is not polluted
    const emptyObj: any = {};
    expect(emptyObj.passwordHash).toBeUndefined();
    expect(emptyObj.avatarUrl).toBeUndefined();
  });

  it('should allow normal usernames to register and login', async () => {
    const regRes = await request(app).post('/api/register').send({
      username: 'safe_user_test',
      password: 'testpassword123'
    });
    expect(regRes.status).toBe(201);

    const loginRes = await request(app).post('/api/login').send({
      username: 'safe_user_test',
      password: 'testpassword123'
    });
    expect(loginRes.status).toBe(200);
  });
});
