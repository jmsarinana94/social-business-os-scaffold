 
// Keep this as TS if you like; ts-jest will handle it

const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Make sure TS is used to transform .ts files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
  },
};

export default {
  cacheDirectory: '<rootDir>/.jest-cache',
  // IMPORTANT: apply the base config to each project
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
    },
    {
      ...base,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
    },
  ],
};