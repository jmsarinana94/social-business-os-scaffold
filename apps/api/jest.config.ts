import type { Config } from 'jest';

const base: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // no "verbose" here (it was causing the warning)
};

const unit: Config = {
  ...base,
  displayName: 'unit',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
};

const e2e: Config = {
  ...base,
  displayName: 'e2e',
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts', '<rootDir>/test/**/*.e2e-spec.ts'],
};

const config: Config = {
  projects: [unit, e2e],
};
export default config;