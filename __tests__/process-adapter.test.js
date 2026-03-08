const os = require("os")
const { execute } = require("../cli/adapters/process")

describe("process adapter", () => {
  test("coerces array flags and skips false values", async () => {
    const result = await execute({
      adapterConfig: {
        command: "node",
        baseArgs: ["-e", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", "--"],
        parseJson: true,
        timeout_ms: 2000
      }
    }, {
      name: "demo",
      tags: ["a", "b"],
      enabled: false,
      count: 2
    })

    expect(result).toContain("--name")
    expect(result).toContain("demo")
    expect(result).toContain("--tags")
    expect(result).toContain("a")
    expect(result).toContain("b")
    expect(result).toContain("--count")
    expect(result).not.toContain("--enabled")
  })

  test("returns invalid_argument with missing dependency help", async () => {
    await expect(execute({
      adapterConfig: {
        command: "definitely_missing_binary_xyz",
        parseJson: false,
        missingDependencyHelp: "Run: dcli beads install steps"
      }
    }, {})).rejects.toMatchObject({
      code: 85,
      type: "invalid_argument"
    })
  })

  test("supports cwd and env injection", async () => {
    const result = await execute({
      adapterConfig: {
        command: "node",
        baseArgs: ["-e", "process.stdout.write(JSON.stringify({cwd:process.cwd(),x:process.env.X_TEST}))", "--"],
        parseJson: true,
        cwd: os.tmpdir(),
        env: { X_TEST: "ok" },
        timeout_ms: 2000
      }
    }, {})

    expect(result.cwd).toBe(os.tmpdir())
    expect(result.x).toBe("ok")
  })

  test("rejects interactive flags in non-tty context", async () => {
    const originalIsTTY = process.stdout.isTTY
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true
    })

    await expect(execute({
      adapterConfig: {
        command: "node",
        baseArgs: ["-e", "process.stdout.write('ok')", "--"],
        parseJson: false,
        interactiveFlags: ["--interactive", "-i"]
      }
    }, {
      interactive: true
    })).rejects.toMatchObject({
      code: 91,
      type: "safety_violation"
    })

    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true
    })
  })

  test("rejects requiresInteractive in non-tty context", async () => {
    const originalIsTTY = process.stdout.isTTY
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true
    })

    await expect(execute({
      adapterConfig: {
        command: "node",
        baseArgs: ["-e", "process.stdout.write('ok')", "--"],
        parseJson: false,
        requiresInteractive: true
      }
    }, {})).rejects.toMatchObject({
      code: 91,
      type: "safety_violation"
    })

    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true
    })
  })
})
