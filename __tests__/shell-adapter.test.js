const { execute } = require("../cli/adapters/shell")
const { spawn } = require("child_process")
const EventEmitter = require("events")

jest.mock("child_process")

describe("shell adapter", () => {
  let mockChild

  beforeEach(() => {
    jest.clearAllMocks()
    mockChild = new EventEmitter()
    mockChild.stdout = new EventEmitter()
    mockChild.stdout.setEncoding = jest.fn()
    mockChild.stderr = new EventEmitter()
    mockChild.stderr.setEncoding = jest.fn()
    mockChild.kill = jest.fn()
    spawn.mockReturnValue(mockChild)
  })

  test("interpolates script and executes", async () => {
    const promise = execute({
      adapterConfig: { script: "echo {{name}}", parseJson: false }
    }, { name: 'world"quoted' })

    mockChild.stdout.emit("data", "hello world\\\"quoted")
    mockChild.emit("close", 0)

    const result = await promise
    expect(result).toEqual({ raw: "hello world\\\"quoted" })
    expect(spawn).toHaveBeenCalledWith("bash", ["-lc", "echo world\\\"quoted"], expect.anything())
  })

  test("handles JSON parsing", async () => {
    const promise = execute({
      adapterConfig: { script: "echo '{\"ok\":true}'" }
    }, {})

    mockChild.stdout.emit("data", '{"ok":true}')
    mockChild.emit("close", 0)

    const result = await promise
    expect(result).toEqual({ ok: true })
  })

  test("handles non-JSON when parseJson is true", async () => {
    const promise = execute({
      adapterConfig: { script: "echo not-json" }
    }, {})

    mockChild.stdout.emit("data", "not-json")
    mockChild.emit("close", 0)

    const result = await promise
    expect(result).toEqual({ raw: "not-json" })
  })

  test("handles timeout", async () => {
    jest.useFakeTimers()
    const promise = execute({
      adapterConfig: { script: "sleep 10", timeout_ms: 100 }
    }, {})

    jest.advanceTimersByTime(200)

    await expect(promise).rejects.toThrow(/timed out after 100ms/)
    jest.useRealTimers()
  })

  test("handles spawn error", async () => {
    const promise = execute({
      adapterConfig: { script: "fail" }
    }, {})

    mockChild.emit("error", new Error("spawn fail"))

    await expect(promise).rejects.toThrow("Failed to start shell adapter")
  })

  test("handles non-zero exit", async () => {
    const promise = execute({
      adapterConfig: { script: "exit 1" }
    }, {})

    mockChild.stderr.emit("data", "error details")
    mockChild.emit("close", 1)

    await expect(promise).rejects.toThrow(/Shell adapter failed.*error details/)
  })
})
