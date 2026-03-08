const { execute } = require("../cli/executor")
const { validateAdapterConfig } = require("../cli/adapter-schema")
const path = require("path")

jest.mock("../cli/adapter-schema")

// Mock adapters
const mockAdapters = {
  process: { execute: jest.fn() },
  builtin: { execute: jest.fn() },
  shell: { execute: jest.fn() },
  http: { execute: jest.fn() },
  mcp: { execute: jest.fn() },
  openapi: { execute: jest.fn() }
}

jest.mock("../cli/adapters/process", () => mockAdapters.process, { virtual: true })
jest.mock("../cli/adapters/builtin", () => mockAdapters.builtin, { virtual: true })
jest.mock("../cli/adapters/shell", () => mockAdapters.shell, { virtual: true })
jest.mock("../cli/adapters/http", () => mockAdapters.http, { virtual: true })
jest.mock("../cli/adapters/mcp", () => mockAdapters.mcp, { virtual: true })
jest.mock("../cli/adapters/openapi", () => mockAdapters.openapi, { virtual: true })

global.fetch = jest.fn()

describe("executor", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("executes basic command through adapter", async () => {
    const cmd = { adapter: "process", namespace: "test", resource: "res", action: "act" }
    const flags = { foo: "bar" }
    const context = {}
    
    mockAdapters.process.execute.mockResolvedValue({ ok: true })
    
    const result = await execute(cmd, flags, context)
    
    expect(validateAdapterConfig).toHaveBeenCalledWith(cmd)
    expect(mockAdapters.process.execute).toHaveBeenCalledWith(cmd, flags, context)
    expect(result).toEqual({ ok: true })
  })

  test("throws error for unknown adapter", async () => {
    const cmd = { adapter: "nonexistent", namespace: "test", resource: "res", action: "act" }
    
    await expect(execute(cmd, {}, {})).rejects.toMatchObject({
      code: 110,
      type: "internal_error"
    })
  })

  test("executes workflow with multiple steps", async () => {
    const workflow = {
      type: "workflow",
      namespace: "wf",
      resource: "res",
      action: "act",
      steps: [
        "ns1.res1.act1",
        { command: "ns2.res2.act2", args: { extra: "val" } }
      ]
    }
    
    const context = {
      config: {
        commands: [
          { namespace: "ns1", resource: "res1", action: "act1", adapter: "process" },
          { namespace: "ns2", resource: "res2", action: "act2", adapter: "builtin" }
        ]
      }
    }

    mockAdapters.process.execute.mockResolvedValue({ data: "result1" })
    mockAdapters.builtin.execute.mockResolvedValue({ data: "result2" })

    const result = await execute(workflow, { initial: "flag" }, context)

    expect(result.steps).toHaveLength(2)
    expect(result.steps[0].result).toEqual({ data: "result1" })
    expect(result.steps[1].result).toEqual({ data: "result2" })
    
    // Verify data piping and merging
    expect(mockAdapters.builtin.execute).toHaveBeenCalledWith(
      expect.objectContaining({ namespace: "ns2" }),
      expect.objectContaining({ initial: "flag", extra: "val", data: "result1" }),
      context
    )
  })

  test("handles workflow step template replacement", async () => {
    const workflow = {
      type: "workflow",
      steps: [
        { command: "ns.res.act1", args: { name: "initial" } },
        { command: "ns.res.act2", args: { greeting: "Hello {{args.user}}", info: "Last was {{step.0.result.data}}" } }
      ]
    }
    
    const context = {
      config: {
        commands: [
          { namespace: "ns", resource: "res", action: "act1", adapter: "builtin" },
          { namespace: "ns", resource: "res", action: "act2", adapter: "builtin" }
        ]
      }
    }

    mockAdapters.builtin.execute
      .mockResolvedValueOnce({ data: "first-result" })
      .mockResolvedValueOnce({ data: "second-result" })

    await execute(workflow, { user: "Alice" }, context)

    expect(mockAdapters.builtin.execute).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        greeting: "Hello Alice",
        info: "Last was first-result"
      }),
      expect.anything()
    )
  })

  test("fetches missing command from server during workflow", async () => {
    const workflow = {
      type: "workflow",
      steps: ["remote.res.act"]
    }
    
    const context = {
      server: "http://api.test",
      config: { commands: [] }
    }

    const remoteCmd = { namespace: "remote", resource: "res", action: "act", adapter: "shell" }
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(remoteCmd)
    })
    
    mockAdapters.shell.execute.mockResolvedValue({ ok: true })

    await execute(workflow, {}, context)

    expect(global.fetch).toHaveBeenCalledWith("http://api.test/api/command/remote/res/act")
    expect(mockAdapters.shell.execute).toHaveBeenCalledWith(remoteCmd, expect.anything(), context)
  })

  test("throws error if workflow step is invalid", async () => {
    const workflow = {
      type: "workflow",
      steps: ["invalid-step"]
    }
    
    await expect(execute(workflow, {}, {})).rejects.toMatchObject({
      code: 85,
      type: "invalid_argument"
    })
  })

  test("throws error if command not found and no server", async () => {
    const workflow = {
      type: "workflow",
      steps: ["missing.ns.act"]
    }
    
    await expect(execute(workflow, {}, { config: { commands: [] } })).rejects.toMatchObject({
      code: 92,
      type: "resource_not_found"
    })
  })
  
  test("throws error if server fetch fails", async () => {
    const workflow = {
      type: "workflow",
      steps: ["remote.res.act"]
    }
    
    const context = {
      server: "http://api.test",
      config: { commands: [] }
    }

    global.fetch.mockResolvedValue({ ok: false })

    await expect(execute(workflow, {}, context)).rejects.toMatchObject({
      code: 92,
      type: "resource_not_found"
    })
  })
})
