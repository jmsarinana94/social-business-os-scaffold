import type { Config } from 'jest';

const config: Config = {
  // Look at both src and tests
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/../web/.next/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/../web/.next/'
  ],
  cacheDirectory: '<rootDir>/.jest-cache',
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/**/*.spec.ts']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts']
    }
  ],
  clearMocks: true,
  verbose: true,
  testEnvironment: 'node'
};

export default config;