import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      // Old UserScript files (deprecated, keeping for reference)
      'src/firestarter.ts',
      'src/utils.ts',
      'src/tin.ts',
    ],
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        location: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',

        // Chrome extension API
        chrome: 'readonly',

        // Built-in types
        Set: 'readonly',
        Map: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        Number: 'readonly',
        String: 'readonly',
        RegExp: 'readonly',
        Promise: 'readonly',

        // DOM types
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLBodyElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        KeyboardEvent: 'readonly',
        MutationObserver: 'readonly',
        MutationCallback: 'readonly',
        XPathResult: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },
];
