import { test, expect } from '@playwright/test';
import { envConfig } from '../../../config/env.config';
import apiUtil from '../../../utils/api.util';
import { CommonFunctions } from '../../../utils/common.util';
import testData from '../../../test-data/api/Test_002_RegisterAndLoginUser.json';

const commonUtil = new CommonFunctions();
const REGISTER_URL = `${envConfig.apiBaseUrl}/api/register`;
const LOGIN_URL = `${envConfig.apiBaseUrl}/api/login`;

type RegisterPayload = {
  username?: string;
  password?: string;
  fullName?: string;
};

type LoginPayload = {
  username?: string;
  password?: string;
};

function uniqueUsername(prefix: string = 'johndoe'): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 100000)}@`;
}

function buildValidPayload(overrides: RegisterPayload = {}): RegisterPayload {
  return {
    username: uniqueUsername(),
    password: testData.defaultPassword,
    fullName: testData.defaultFullName,
    ...overrides,
  };
}

function normalizeDynamicUsername(candidate?: string): string | undefined {
  if (!candidate) return candidate;
  if (candidate.endsWith('_placeholder')) {
    return uniqueUsername(candidate.replace('_placeholder', ''));
  }
  return candidate;
}

function normalizePayload<T extends { username?: string }>(payload: T): T {
  const normalized = { ...payload };
  if (typeof normalized.username === 'string') {
    normalized.username = normalizeDynamicUsername(normalized.username);
  }
  return normalized;
}

function buildRegisterSecurityPayload(template: any): RegisterPayload {
  if (template.field === 'username') {
    return {
      username:
        template.payload.usernamePattern === 'oversized_username'
          ? `${'a'.repeat(240)}${Date.now()}${Math.floor(Math.random() * 100000)}@`
          : `${template.payload.usernamePattern}${Date.now()}${Math.floor(Math.random() * 100000)}@`,
      password: testData.defaultPassword,
      fullName: testData.defaultFullName,
    };
  }

  return {
    username: uniqueUsername('security'),
    password: testData.defaultPassword,
    fullName: template.payload.fullName,
  };
}

function buildLoginSecurityPayload(template: any): LoginPayload {
  return {
    username:
      template.payload.usernamePattern === 'oversized_username'
        ? `${'b'.repeat(240)}${Date.now()}${Math.floor(Math.random() * 100000)}@`
        : `${template.payload.usernamePattern}${Date.now()}${Math.floor(Math.random() * 100000)}@`,
    password: template.payload.password,
  };
}

async function registerUser(payload: RegisterPayload, logMessage: string) {
  return apiUtil.makeRequest({
    method: 'POST',
    url: REGISTER_URL,
    data: payload,
    headers: { 'Content-Type': 'application/json' },
    logMessage,
    responseType: 'full',
  });
}

async function loginUser(payload: LoginPayload, logMessage: string) {
  return apiUtil.makeRequest({
    method: 'POST',
    url: LOGIN_URL,
    data: payload,
    headers: { 'Content-Type': 'application/json' },
    logMessage,
    responseType: 'full',
  });
}

async function createRegisteredUser(overrides: RegisterPayload = {}): Promise<RegisterPayload> {
  const payload = buildValidPayload(overrides);
  const response = await registerUser(payload, 'Register test user setup');

  await commonUtil.compareTwoValues(response.status, 201, 'Registration setup status');
  expect(response.status).toBe(201);

  return payload;
}

async function validateStatusIn(actualStatus: number, expectedStatuses: number[], logMessage: string) {
  await commonUtil.compareTwoValues(expectedStatuses.includes(actualStatus), true, logMessage);
  expect(expectedStatuses).toContain(actualStatus);
}

function validateNoSensitiveLeakage(responseData: any) {
  expect(responseData?.password).toBeUndefined();
  expect(JSON.stringify(responseData ?? {})).not.toContain('<script>');
}

async function validateSuccessfulRegisterContract(responseData: any, expectedUsername: string) {
  await commonUtil.compareTwoValues(typeof responseData, 'object', 'Registration response is an object');
  await commonUtil.compareTwoValues(responseData !== null, true, 'Registration response is not null');
  await commonUtil.compareTwoValues(typeof responseData?.message, 'string', 'Message is a string');
  await commonUtil.compareTwoValues(typeof responseData?.username, 'string', 'Username is a string');
  await commonUtil.compareTwoValues(responseData?.message, testData.messages.registrationSuccess, 'Registration message');
  await commonUtil.compareTwoValues(responseData?.username, expectedUsername, 'Registered username matches request');
  await commonUtil.compareTwoValues(
    JSON.stringify(Object.keys(responseData ?? {}).sort()),
    JSON.stringify(['message', 'username']),
    'Response contains only expected contract fields'
  );

  expect(responseData).toEqual({
    message: testData.messages.registrationSuccess,
    username: expectedUsername,
  });
}

async function validateSuccessfulLoginContract(responseData: any, expectedUsername: string) {
  await commonUtil.compareTwoValues(typeof responseData, 'object', 'Login response is an object');
  await commonUtil.compareTwoValues(responseData !== null, true, 'Login response is not null');
  await commonUtil.compareTwoValues(typeof responseData?.message, 'string', 'Login message is a string');
  await commonUtil.compareTwoValues(typeof responseData?.username, 'string', 'Login username is a string');
  await commonUtil.compareTwoValues(responseData?.message, testData.messages.loginSuccess, 'Login message');
  await commonUtil.compareTwoValues(responseData?.username, expectedUsername, 'Logged in username matches request');
  await commonUtil.compareTwoValues(
    JSON.stringify(Object.keys(responseData ?? {}).sort()),
    JSON.stringify(['message', 'username']),
    'Login response contains only expected contract fields'
  );

  expect(responseData).toEqual({
    message: testData.messages.loginSuccess,
    username: expectedUsername,
  });
}

test.describe('Register User API - Positive, Negative, Contract and Security', () => {
  test('Testcase 1: Positive and Contract: POST /api/register should register a user and allow login', async () => {
    const payload = buildValidPayload();
    const response = await registerUser(payload, 'Register a new valid user');

    await commonUtil.compareTwoValues(response.status, 201, 'Response status');
    expect(response.status).toBe(201);

    await validateSuccessfulRegisterContract(response.data, payload.username as string);

    const loginResponse = await loginUser(
      { username: payload.username, password: payload.password },
      'Login with newly registered user'
    );

    await commonUtil.compareTwoValues(loginResponse.status, 200, 'Login response status after registration');
    expect(loginResponse.status).toBe(200);
    await validateSuccessfulLoginContract(loginResponse.data, payload.username as string);
  });

  const missingFieldScenarios = testData.missingRegisterFieldScenarios.map((scenario) => ({
    description: scenario.description,
    payload: normalizePayload({
      ...scenario.payload,
      username: normalizeDynamicUsername(scenario.payload.username),
    }),
  }));

  for (const scenario of missingFieldScenarios) {
    test(`Testcase 2: Negative: POST /api/register should reject ${scenario.description}`, async () => {
      const response = await registerUser(scenario.payload, `Register user with ${scenario.description}`);

      await validateStatusIn(response.status, testData.negativeRegisterStatus, `Status code for ${scenario.description}`);
      expect(response.data).toBeTruthy();
      validateNoSensitiveLeakage(response.data);
    });
  }

  test('Testcase 3: Negative: POST /api/register should reject duplicate usernames', async () => {
    const payload = buildValidPayload();
    const firstResponse = await registerUser(payload, 'Register original user for duplicate validation');
    const duplicateResponse = await registerUser(payload, 'Register duplicate username');

    await commonUtil.compareTwoValues(firstResponse.status, 201, 'Initial registration response status');
    await validateStatusIn(duplicateResponse.status, testData.duplicateRegisterStatus, 'Duplicate registration status');
    expect(firstResponse.status).toBe(201);
    validateNoSensitiveLeakage(duplicateResponse.data);
  });

  test('Testcase 4: Negative: GET /api/register should not be allowed for user registration', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: REGISTER_URL,
      headers: { 'Content-Type': 'application/json' },
      logMessage: 'Attempt register endpoint with unsupported GET method',
      responseType: 'full',
    });

    await validateStatusIn(response.status, testData.unsupportedMethodStatus, 'Unsupported method status');
  });

  const securityPayloads = testData.registerSecurityScenarios.map((scenario) => ({
    description: scenario.description,
    payload: buildRegisterSecurityPayload(scenario),
  }));

  for (const scenario of securityPayloads) {
    test(`Testcase 5: Security: POST /api/register should handle ${scenario.description} without server error or sensitive leakage`, async () => {
      const response = await registerUser(scenario.payload, `Security validation for ${scenario.description}`);

      await commonUtil.compareTwoValues(response.status < 500, true, `Security status for ${scenario.description}`);
      expect(response.status).toBeLessThan(500);
      validateNoSensitiveLeakage(response.data);
    });
  }

  test('Testcase 6: Security: POST /api/register should reject unsupported content type', async () => {
    const response = await apiUtil.makeRequest({
      method: 'POST',
      url: REGISTER_URL,
      data: JSON.stringify(buildValidPayload()),
      headers: { 'Content-Type': 'text/plain' },
      logMessage: 'Register user with unsupported content type',
      responseType: 'full',
    });

    await validateStatusIn(response.status, testData.unsupportedContentTypeStatus, 'Unsupported content type status');
  });
});

test.describe('Login API - Positive, Negative and Security', () => {
  let registeredUser: RegisterPayload;

  test.beforeAll(async () => {
    registeredUser = await createRegisteredUser();
  });

  test('Testcase 7: Positive and Contract: POST /api/login should login a registered user successfully', async () => {
    const loginResponse = await loginUser(
      { username: registeredUser.username, password: registeredUser.password },
      'Login registered user'
    );

    await commonUtil.compareTwoValues(loginResponse.status, 200, 'Login response status');
    expect(loginResponse.status).toBe(200);
    await validateSuccessfulLoginContract(loginResponse.data, registeredUser.username as string);
  });

  test('Testcase 8: Negative: POST /api/login should reject incorrect password', async () => {
    const loginResponse = await loginUser(
      { username: registeredUser.username, password: 'wrongPassword123@' },
      'Login with incorrect password'
    );

    await validateStatusIn(loginResponse.status, [400, 401, 403], 'Incorrect password status');
    validateNoSensitiveLeakage(loginResponse.data);
  });

  const invalidLoginScenarios = testData.invalidLoginScenarios.map((scenario) => ({
    description: scenario.description,
    payload: normalizePayload({
      ...scenario.payload,
      username: normalizeDynamicUsername((scenario.payload as any).username),
    }),
  }));

  for (const scenario of invalidLoginScenarios) {
    test(`Testcase 9: Negative: POST /api/login should reject ${scenario.description}`, async () => {
      const response = await loginUser(scenario.payload, `Login with ${scenario.description}`);

      await validateStatusIn(response.status, testData.invalidLoginStatus, `Status code for ${scenario.description}`);
      validateNoSensitiveLeakage(response.data);
    });
  }

  test('Testcase 10: Negative: GET /api/login should not be allowed for login', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: LOGIN_URL,
      headers: { 'Content-Type': 'application/json' },
      logMessage: 'Attempt login endpoint with unsupported GET method',
      responseType: 'full',
    });

    await validateStatusIn(response.status, testData.unsupportedMethodStatus, 'Unsupported login method status');
  });

  const loginSecurityScenarios = testData.loginSecurityScenarios.map((scenario) => ({
    description: scenario.description,
    payload: buildLoginSecurityPayload(scenario),
  }));

  for (const scenario of loginSecurityScenarios) {
    test(`Testcase 11: Security: POST /api/login should handle ${scenario.description} without server error or sensitive leakage`, async () => {
      const response = await loginUser(scenario.payload, `Login security validation for ${scenario.description}`);

      await commonUtil.compareTwoValues(response.status < 500, true, `Security status for ${scenario.description}`);
      expect(response.status).toBeLessThan(500);
      validateNoSensitiveLeakage(response.data);
    });
  }

  test('Testcase 12: Security: POST /api/login should reject unsupported content type', async () => {
    const response = await apiUtil.makeRequest({
      method: 'POST',
      url: LOGIN_URL,
      data: JSON.stringify({ username: uniqueUsername('logincontent'), password: testData.defaultPassword }),
      headers: { 'Content-Type': 'text/plain' },
      logMessage: 'Login with unsupported content type',
      responseType: 'full',
    });

    await validateStatusIn(response.status, testData.unsupportedContentTypeStatus, 'Unsupported login content type status');
  });

  test('Testcase 13: Security: GET /api/cart without auth cookies should return 401 Unauthorized', async () => {
    const response = await apiUtil.makeRequest({
      method: 'GET',
      url: `${envConfig.apiBaseUrl}/api/cart`,
      headers: {}, // No credentials/cookies
      responseType: 'full',
      logMessage: 'Request /api/cart without authentication'
    });

    await commonUtil.compareTwoValues(response.status, 401, 'Response status code should be 401');
    expect(response.status).toBe(401);
    await commonUtil.compareTwoValues(response.data?.error, 'Unauthorized: Token required', 'Error message for missing token');
    expect(response.data?.error).toBe('Unauthorized: Token required');
  });
});
