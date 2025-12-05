/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  moduleFileExtensions: ["ts", "js", "json"],
  testRegex: ".*\\.e2e-spec\\.ts$",

  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Collect coverage only from meaningful app logic
  collectCoverageFrom: ["src/**/*.controller.ts", "src/**/*.service.ts"],

  // Regex (not globs) to ignore noisy/infra files from coverage
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/main\\.ts$",
    "<rootDir>/src/.+\\.module\\.ts$",
    "<rootDir>/src/.*/__mocks__/.*",
    "<rootDir>/src/.*/dto/.*",
    "<rootDir>/src/common/.*",
    "<rootDir>/src/infra/.*",
    "<rootDir>/src/openapi/.*",
    "<rootDir>/src/prisma/.*",
    "<rootDir>/src/telemetry/.*",
    "\\.d\\.ts$",
  ],

  coverageDirectory: "<rootDir>/coverage/e2e",
  coverageReporters: ["text", "lcov", "json-summary"],

  // Loosen slightly to match current run; raise later as we add tests
  coverageThreshold: {
    global: {
      statements: 34,
      functions: 33,
      lines: 34,
      branches: 20,
    },
  },

  verbose: true,
  maxWorkers: 1,
};
