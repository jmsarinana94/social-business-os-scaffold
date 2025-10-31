import type { Config } from 'jest';

const e2e: Config = {
  displayName: 'e2e',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/e2e/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};

const config: Config = {
  // we keep a single project named "e2e" since you select it via --selectProjects=e2e
  projects: [e2e],
};

export default config;
