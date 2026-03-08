const { handleAskCommand } = require("../cli/ask")
const { execute } = require("../cli/executor")

jest.mock("../cli/executor")

describe("ask", () => {
  let mockOutput
  let mockOutputError
  let consoleSpy

  const mockConfig = {
    commands: [
      {
        namespace: "test",
        resource: "res",
        action: "act",
        description: "Test action",
        args: [{ name: "foo", required: true }, { name: "bar", required: false }]
      }
    ],
    features: { ask: true }
  }

  const mockContext = {
    server: "http://api.test"
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOutput = jest.fn()
    mockOutputError = jest.fn()
    consoleSpy = jest.spyOn(console, "log").mockImplementation()
    global.fetch = jest.fn()
    
    // Clear relevant environment variables
    delete process.env.OPENAI_BASE_URL
    delete process.env.OPENAI_MODEL
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test("returns error if query is missing", async () => {
    await handleAskCommand({
      positional: ["ask"],
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
      code: 85,
      type: "invalid_argument"
    }))
  })

  test("returns error if 'ask' is not configured", async () => {
    await handleAskCommand({
      positional: ["ask", "help me"],
      config: { features: {} },
      context: {},
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
      code: 105,
      type: "integration_error",
      message: expect.stringContaining("not configured")
    }))
  })

  describe("local LLM resolution", () => {
    beforeEach(() => {
      process.env.OPENAI_BASE_URL = "http://localhost:1234/v1"
    })

    test("successfully resolves and executes plan with multiple commands in config", async () => {
      const mockConfigMulti = {
        commands: [
          { namespace: "test", resource: "res", action: "act1" },
          { namespace: "test", resource: "res", action: "act2" },
          { namespace: "other", resource: "res", action: "act" }
        ],
        features: { ask: true }
      }
      const mockSteps = [{ command: "test.res.act1" }]
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockSteps) } }]
        })
      })
      execute.mockResolvedValue({})

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfigMulti,
        context: {},
        output: mockOutput
      })

      expect(execute).toHaveBeenCalled()
    })

    test("strips markdown formatting from LLM response", async () => {
      const mockSteps = [{ command: "test" }]
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: "```json\n" + JSON.stringify(mockSteps) + "\n```" } }]
        })
      })
      execute.mockResolvedValue({})

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfig,
        context: {},
        output: mockOutput
      })

      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({ adapterConfig: { steps: mockSteps } }),
        expect.anything(),
        expect.anything()
      )
    })

    test("strips generic code blocks from LLM response", async () => {
      const mockSteps = [{ command: "test" }]
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: "```\n" + JSON.stringify(mockSteps) + "\n```" } }]
        })
      })
      execute.mockResolvedValue({})

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfig,
        context: {},
        output: mockOutput
      })

      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({ adapterConfig: { steps: mockSteps } }),
        expect.anything(),
        expect.anything()
      )
    })

    test("handles fetch failure from local LLM", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
      })

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfig,
        context: {},
        outputError: mockOutputError
      })

      expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining("Local LLM Error 401: Unauthorized")
      }))
    })

    test("handles invalid response format from local LLM", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] })
      })

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfig,
        context: {},
        outputError: mockOutputError
      })

      expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
        message: "Invalid response format from local LLM"
      }))
    })

    test("handles LLM response that is not a JSON array", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"not": "an array"}' } }]
        })
      })

      await handleAskCommand({
        positional: ["ask", "test"],
        config: mockConfig,
        context: {},
        outputError: mockOutputError
      })

      expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
        message: "LLM did not return a JSON array"
      }))
    })
  })

  describe("remote LLM resolution", () => {
    test("successfully resolves via server", async () => {
      const mockSteps = [{ command: "remote.act" }]
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ steps: mockSteps })
      })
      execute.mockResolvedValue({ ok: true })

      await handleAskCommand({
        positional: ["ask", "remote", "query"],
        config: { features: { ask: true } },
        context: { server: "http://api.test" },
        output: mockOutput
      })

      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/api/ask",
        expect.objectContaining({ method: "POST" })
      )
      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({ adapterConfig: { steps: mockSteps } }),
        expect.anything(),
        expect.anything()
      )
    })

    test("handles server failure with error message", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: "Bad Gateway",
        json: () => Promise.resolve({ error: "Server too busy" })
      })

      await handleAskCommand({
        positional: ["ask", "test"],
        config: { features: { ask: true } },
        context: { server: "http://api.test" },
        outputError: mockOutputError
      })

      expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
        message: "Server LLM completion failed: Server too busy"
      }))
    })
    
    test("handles server failure with status text if no json error", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        statusText: "Forbidden",
        json: () => Promise.reject()
      })

      await handleAskCommand({
        positional: ["ask", "test"],
        config: { features: { ask: true } },
        context: { server: "http://api.test" },
        outputError: mockOutputError
      })

      expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
        message: "Server LLM completion failed: Forbidden"
      }))
    })
  })

  describe("human mode", () => {
    test("logs plan and success message with missing command parts and no description", async () => {
      process.env.OPENAI_BASE_URL = "http://localhost"
      const mockConfigWithHole = {
        commands: [
          { namespace: "test", resource: "res", action: "act" } // No description
        ],
        features: { ask: true }
      }
      
      const mockSteps = [
        { command: "test.res.act" } // No args
      ]
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(mockSteps) } }]
        })
      })
      execute.mockResolvedValue({ data: "done" })

      await handleAskCommand({
        positional: ["ask", "do", "it"],
        config: mockConfigWithHole,
        context: mockContext,
        humanMode: true
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Thinking... (local resolution)"))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("1. test res act"))
    })

    test("logs plan in server mode", async () => {
      const mockSteps = [{ command: "test.res.act", args: {} }]
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ steps: mockSteps })
      })
      execute.mockResolvedValue({})

      await handleAskCommand({
        positional: ["ask", "do", "it"],
        config: { features: { ask: true } },
        context: { server: "http://api.test" },
        humanMode: true
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Thinking... (server resolution)"))
    })
  })
})
