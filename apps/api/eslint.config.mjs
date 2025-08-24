// ESLint v9 flat config for apps/api
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // 1) Global ignores (replaces .eslintignore)
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.turbo/**',
      '.next/**',
      'node_modules/**',
      '**/*.d.ts',
      '**/*.map',
      'jest.config.ts',
      'jest.setup.ts',
      'tsconfig*.json',
    ],
  },

  // 2) DEFAULT: non–type-aware TS lint (applies to everything)
  //    Keeps lint fast and avoids “file was not found in provided project(s)” errors.
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // 3) TYPE-AWARE lint just for app source (fewer files, better signal)
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    rules: {
      // You can enable stricter rules here later if you want
    },
  },

  // 4) Tests: allow any + non type-aware (keeps config simple/robust)
  {
    files: ['test/**/*.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 5) Controllers: allow any for request bodies/query params
  {
    files: ['src/**/*.controller.ts', 'src/**/controllers/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 6) Seed script: non type-aware (prevents project include errors)
  {
    files: ['prisma/seed.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
    rules: {},
  },
];
