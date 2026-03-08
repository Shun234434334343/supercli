module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,
  collectCoverage: true,
  collectCoverageFrom: [
    "cli/planner.js",
    "cli/plan-runtime.js",
    "cli/help-json.js",
    "cli/skills.js"
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  }
}
