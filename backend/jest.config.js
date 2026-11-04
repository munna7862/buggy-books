/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
  // Resolve the shared contracts to their source so ts-jest compiles them.
  moduleNameMapper: {
    '^@buggybooks/contracts$': '<rootDir>/../shared/contracts',
  },
  setupFiles: ['./src/__tests__/setup.ts'],
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/server.ts',
  ],
};
