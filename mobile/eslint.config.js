// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/*', '.expo/*', 'coverage/*'],
  },
  {
    rules: { 'no-console': 'error' },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    // API paths and testIDs must come from @buggybooks/contracts so the app,
    // the backend contract test and the Maestro flows cannot drift apart.
    files: ['App.tsx', 'src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/__tests__/**', 'src/test-utils/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^\\/api\\//], TemplateElement[value.raw=/^\\/api\\//]',
          message: 'Use API_ROUTES from @buggybooks/contracts instead of a literal API path.',
        },
        {
          selector: "JSXAttribute[name.name='testID'] > Literal, JSXAttribute[name.name='testID'] > JSXExpressionContainer > Literal",
          message: 'Use MOBILE_TEST_IDS from @buggybooks/contracts instead of a literal testID.',
        },
      ],
    },
  },
]);
