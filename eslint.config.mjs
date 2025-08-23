// eslint.config.mjs
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import * as tseslint from 'typescript-eslint';

export default [
  // 0) Ignore stuff
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'pnpm-lock.yaml',
    ],
  },

  // 1) JS recommended
  js.configs.recommended,

  // 2) TS recommended
  ...tseslint.configs.recommended,

  // 3) Base rules for TS/JS
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // ✅ Prefer VALUE imports (no `import type`)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'no-type-imports', disallowTypeAnnotations: false },
      ],

      // Keep imports tidy
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',

      // Unused cleanup
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Noise control
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // 4) Web app (React/Next)
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': nextPlugin, // rule namespace must match
    },
    settings: {
      react: { version: 'detect' },
      // next: { rootDir: ['apps/web'] }, // if you need it later
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...(nextPlugin.configs?.recommended?.rules ?? {}),
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },

  // 5) Worker (Node-only)
  {
    files: ['apps/worker/**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // 6) Prettier compatibility
  eslintConfigPrettier,
];
