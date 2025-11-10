// apps/api/jest-e2e.config.js
/**
 * Jest configuration for E2E tests (NestJS + ts-jest)
 * Resolves "@/..." to "<rootDir>/src/..."
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "./",
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],

  // Use modern ts-jest config placement (deprecates globals.ts-jest)
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.json", diagnostics: false },
    ],
  },

  // 👇 map "@/..." to "src/..."
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Stable E2E runs
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  testTimeout: 30000,
};
