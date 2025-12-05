// /.eslintrc.cjs
/* eslint-env node */
module.exports = {
  root: true,

  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
  ],

  env: { es2023: true, node: true, browser: true },

  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },

  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],

  rules: {
    // strict defaults for the monorepo
    "no-console": ["error", { allow: ["warn", "error", "info"] }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
  },

  overrides: [
    // ✅ Seed/prisma scripts anywhere under apps/**
    {
      files: ["apps/**/scripts/**/*.{ts,js}", "apps/**/prisma/**/*.{ts,js}"],
      rules: { "no-console": "off" },
    },

    // ✅ Logger + Redis services anywhere under apps/**/src/**
    {
      files: [
        "apps/**/src/**/logger/**/*.{ts,js}",
        "apps/**/src/**/infra/redis/**/*.{ts,js}",
        "apps/**/src/common/logger/**/*.{ts,js}",
        "apps/**/src/infra/redis/**/*.{ts,js}",
      ],
      rules: { "no-console": "off" },
    },

    // Web app browser env
    {
      files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
      env: { browser: true },
    },
  ],
};
