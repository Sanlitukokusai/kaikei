import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const customConfig: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^server-only$": "<rootDir>/src/__mocks__/server-only.ts",
    "^next/cache$": "<rootDir>/src/__mocks__/next-cache.ts",
    "^next/navigation$": "<rootDir>/src/__mocks__/next-navigation.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{ts,tsx}"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/lib/queries.ts",
    "src/app/actions/*.ts",
  ],
};

export default createJestConfig(customConfig);
