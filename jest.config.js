module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testTimeout: 15000,
  collectCoverage: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "cli/**/*.js",
    "!cli/supercli.js",
    "!cli/adapters/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  }
}
