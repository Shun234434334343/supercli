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

  test("accepts process safety metadata", () => {
    expect(() => validateAdapterConfig({
      adapter: "process",
      adapterConfig: {
        command: "docker",
        safetyLevel: "guarded",
        interactiveFlags: ["-i", "--interactive"],
        requiresInteractive: false
      }
    })).not.toThrow()
  })

  test("rejects non-array interactiveFlags", () => {
    expect(() => validateAdapterConfig({
      adapter: "process",
      adapterConfig: { command: "docker", interactiveFlags: "--tty" }
    })).toThrow(/interactiveFlags must be an array/)
  })

  test("rejects non-string interactiveFlags values", () => {
    expect(() => validateAdapterConfig({
      adapter: "process",
      adapterConfig: { command: "docker", interactiveFlags: ["--tty", 42] }
    })).toThrow(/interactiveFlags values must be strings/)
  })
})
