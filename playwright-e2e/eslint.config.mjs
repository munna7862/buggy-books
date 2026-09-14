import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'reports/**',
    'test-results/**',
    'blob-report/**',
    'node_modules/**',
    '.auth/**',
    'playwright-report/**',
    'coverage/**',
  ]),
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-empty-pattern': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['src/tests/**/*.ts'],
    plugins: {
      playwright,
    },
    rules: {
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/prefer-web-first-assertions': 'error',
    },
  },
]);
