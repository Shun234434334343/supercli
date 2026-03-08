const { handlePluginsCommand } = require("../cli/plugins-command")
const {
  installPlugin,
  removePlugin,
  getPlugin,
  listInstalledPlugins,
  getPluginInstallGuidance,
  doctorPlugin,
  doctorAllPlugins
} = require("../cli/plugins-manager")
const { listRegistryPlugins } = require("../cli/plugins-registry")
const { loadConfig } = require("../cli/config")

jest.mock("../cli/plugins-manager")
jest.mock("../cli/plugins-registry")
jest.mock("../cli/config")

describe("plugins-command", () => {
  let mockOutput
  let mockOutputHumanTable
  let mockOutputError
  let consoleSpy

  beforeEach(() => {
    jest.clearAllMocks()
    mockOutput = jest.fn()
    mockOutputHumanTable = jest.fn()
    mockOutputError = jest.fn()
    consoleSpy = jest.spyOn(console, "log").mockImplementation()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test("list subcommand", async () => {
    const mockPlugins = [{ name: "p1", version: "1.0", commands: [{}] }]
    listInstalledPlugins.mockReturnValue(mockPlugins)

    await handlePluginsCommand({
      positional: ["plugins", "list"],
      humanMode: false,
      output: mockOutput
    })

    expect(mockOutput).toHaveBeenCalledWith({
      plugins: [{ name: "p1", version: "1.0", commands: 1, description: "" }]
    })
  })

  test("list subcommand in human mode", async () => {
    listInstalledPlugins.mockReturnValue([])
    await handlePluginsCommand({
      positional: ["plugins", "list"],
      humanMode: true,
      outputHumanTable: mockOutputHumanTable
    })
    expect(mockOutputHumanTable).toHaveBeenCalled()
  })

  test("install subcommand validation error", async () => {
    await handlePluginsCommand({
      positional: ["plugins", "install"],
      flags: {},
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
      code: 85,
      type: "invalid_argument"
    }))
  })

  test("install subcommand success", async () => {
    loadConfig.mockResolvedValue({ commands: [] })
    installPlugin.mockReturnValue({ plugin: "p1", version: "1.0" })
    getPluginInstallGuidance.mockReturnValue({ steps: [] })

    await handlePluginsCommand({
      positional: ["plugins", "install", "p1"],
      flags: { "on-conflict": "skip" },
      output: mockOutput
    })

    expect(installPlugin).toHaveBeenCalledWith("p1", expect.objectContaining({
      onConflict: "skip"
    }))
    expect(mockOutput).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      plugin: "p1"
    }))
  })

  test("install via git", async () => {
    loadConfig.mockResolvedValue({ commands: [] })
    installPlugin.mockReturnValue({ plugin: "git-p" })

    await handlePluginsCommand({
      positional: ["plugins", "install"],
      flags: { git: "repo", "manifest-path": "p", ref: "v1" },
      output: mockOutput
    })

    expect(installPlugin).toHaveBeenCalledWith("(git)", expect.objectContaining({
      git: "repo",
      manifestPath: "p",
      ref: "v1"
    }))
  })

  test("explore subcommand", async () => {
    const mockReg = [{ name: "p1", tags: ["t1"] }]
    listRegistryPlugins.mockReturnValue(mockReg)

    await handlePluginsCommand({
      positional: ["plugins", "explore"],
      flags: { tags: "t1, t2", name: "query" },
      humanMode: false,
      output: mockOutput
    })

    expect(listRegistryPlugins).toHaveBeenCalledWith({
      name: "query",
      tags: ["t1", "t2"]
    })
    expect(mockOutput).toHaveBeenCalledWith(expect.objectContaining({
      plugins: expect.any(Array)
    }))
  })

  test("explore subcommand in human mode", async () => {
    listRegistryPlugins.mockReturnValue([])
    await handlePluginsCommand({
      positional: ["plugins", "explore"],
      flags: {},
      humanMode: true,
      outputHumanTable: mockOutputHumanTable
    })
    expect(mockOutputHumanTable).toHaveBeenCalled()
  })

  test("remove subcommand success", async () => {
    removePlugin.mockReturnValue(true)
    await handlePluginsCommand({
      positional: ["plugins", "remove", "p1"],
      output: mockOutput
    })
    expect(mockOutput).toHaveBeenCalledWith({ ok: true, removed: true })
  })

  test("remove subcommand validation error", async () => {
    await handlePluginsCommand({
      positional: ["plugins", "remove"],
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalled()
  })

  test("show subcommand success", async () => {
    getPlugin.mockReturnValue({ name: "p1" })
    getPluginInstallGuidance.mockReturnValue({ info: "how" })

    await handlePluginsCommand({
      positional: ["plugins", "show", "p1"],
      output: mockOutput
    })

    expect(mockOutput).toHaveBeenCalledWith({
      plugin: { name: "p1" },
      install_guidance: { info: "how" }
    })
  })

  test("show subcommand not found", async () => {
    getPlugin.mockReturnValue(null)
    await handlePluginsCommand({
      positional: ["plugins", "show", "missing"],
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
      code: 92
    }))
  })

  test("show subcommand validation error", async () => {
    await handlePluginsCommand({
      positional: ["plugins", "show"],
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalled()
  })

  test("doctor subcommand for specific plugin", async () => {
    doctorPlugin.mockReturnValue({ ok: true })
    await handlePluginsCommand({
      positional: ["plugins", "doctor", "p1"],
      output: mockOutput
    })
    expect(doctorPlugin).toHaveBeenCalledWith("p1")
    expect(mockOutput).toHaveBeenCalledWith({ ok: true })
  })

  test("doctor subcommand for all", async () => {
    doctorAllPlugins.mockReturnValue({ ok: true })
    await handlePluginsCommand({
      positional: ["plugins", "doctor"],
      output: mockOutput
    })
    expect(doctorAllPlugins).toHaveBeenCalled()
  })

  test("unknown subcommand", async () => {
    await handlePluginsCommand({
      positional: ["plugins", "unknown"],
      outputError: mockOutputError
    })
    expect(mockOutputError).toHaveBeenCalledWith(expect.objectContaining({
      code: 85
    }))
  })
})
