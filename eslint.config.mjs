// eslint.config.mjs — Flat config for monorepo (development-friendly)

import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  // Global ignores (replacement for .eslintignore)
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.vercel/**",
      "**/*.min.js",
    ],
  },

  // Base JS & TS recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // General JS/TS hygiene
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // Relax noisy TS rules for faster iteration
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Node/CommonJS style files (configs, scripts, seeders, etc.)
  {
    files: [
      "**/*.{cjs,cts,mjs,js}",
      "scripts/**/*.{js,ts,mjs,cjs}",
      "**/jest*.{js,ts}",
      "**/postcss.config.js",
      "**/tailwind.config.js",
      "**/prisma/**/*.{js,ts,cjs,mjs}",
    ],
    languageOptions: {
      sourceType: "script",
      globals: {
        module: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        exports: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-redeclare": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // k6 load tests
  {
    files: ["apps/api/k6/**/*.js"],
    languageOptions: {
      globals: {
        __ENV: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // API backend — keep relaxed during dev
  {
    files: ["apps/api/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-namespace": "off",
    },
  },

  // Worker/queue
  {
    files: [
      "apps/worker/**/*.{ts,js}",
      "apps/api/src/modules/queue/**/*.{ts,js}",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // Web (React + Hooks + A11y)
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "detect" },
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
    },
  },
];
