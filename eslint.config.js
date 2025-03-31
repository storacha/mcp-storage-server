// eslint.config.js
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // Node.js and Browser globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        global: 'readonly',
        File: 'readonly',
        Headers: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortSignal: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-console': 'off',
      'no-unused-vars': 'off', // Using TypeScript's version instead
    },
  },
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  },
  prettier,
];