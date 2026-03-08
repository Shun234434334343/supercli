const { validateAdapterConfig } = require("../cli/adapter-schema")

describe("adapter-schema", () => {
  test("accepts valid process adapter", () => {
    expect(() => validateAdapterConfig({
      adapter: "process",
      adapterConfig: { command: "br", baseArgs: ["list"], timeout_ms: 5000 }
    })).not.toThrow()
  })

  test("rejects interactive config", () => {
    expect(() => validateAdapterConfig({
      adapter: "http",
      adapterConfig: { url: "https://example.com", non_interactive: false }
    })).toThrow(/Interactive command execution is not supported/)
  })

  test("requires unsafe true for shell adapter", () => {
    expect(() => validateAdapterConfig({
      adapter: "shell",
      adapterConfig: { script: "echo hi" }
    })).toThrow(/unsafe=true/)
  })

  test("accepts shell adapter with unsafe true", () => {
    expect(() => validateAdapterConfig({
      adapter: "shell",
      adapterConfig: { script: "echo '{\"ok\":true}'", unsafe: true, timeout_ms: 1000 }
    })).not.toThrow()
  })
})
