// apps/api/jest.config.ts
import type { Config } from 'jest';

const e2e: Config = {
  displayName: 'e2e',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/test/e2e'],
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/e2e/jest-e2e.setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // If your code uses "@/" path alias, let Jest resolve it:
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

const config: Config = {
  projects: [e2e],
};

export default config;