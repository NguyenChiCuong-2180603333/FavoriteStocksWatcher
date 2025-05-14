/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleFileExtensions: [
    "js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"
  ],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ["./src/tests/setupTests.js"],
  testTimeout: 10000,
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.js",
    "**/__tests__/**/*.mjs"
  ],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/" 
  ],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^axios$': '<rootDir>/__mocks__/axios.js' 
  }
};

export default config;