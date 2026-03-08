const fs = require("fs")
const { spawnSync } = require("child_process")
const path = require("path")

// Mock dependencies
jest.mock("fs")
jest.mock("child_process")
jest.mock("../cli/plugins-store")

const {
  installPlugin,
  removePlugin,
  getPlugin,
  listInstalledPlugins,
  doctorPlugin,
  doctorAllPlugins
} = require("../cli/plugins-manager")

const {
  readPluginsLock,
  writePluginsLock,
  listInstalledPlugins: mockListInstalledPlugins
} = require("../cli/plugins-store")

describe("plugins-manager", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for readPluginsLock
    readPluginsLock.mockReturnValue({ installed: {} })
  })

  describe("loadPluginManifest", () => {
    test("throws error if manifest not found", () => {
      fs.existsSync.mockReturnValue(false)
      expect(() => installPlugin("nonexistent")).toThrow(/Plugin 'nonexistent' not found/)
    })

    test("throws error if manifest is invalid JSON", () => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => false })
      fs.readFileSync.mockReturnValue("invalid json")
      expect(() => installPlugin("plugin.json")).toThrow(/Invalid plugin manifest/)
    })

    test("throws error if manifest is missing name or commands", () => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => false })
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: "1.0.0" }))
      expect(() => installPlugin("plugin.json")).toThrow(/missing name or commands/)
    })

    test("resolves manifest path from directory", () => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => true })
      fs.readFileSync.mockReturnValue(JSON.stringify({ name: "dir-plugin", commands: [] }))
      
      const result = installPlugin("some-dir")
      expect(result.plugin).toBe("dir-plugin")
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining("some-dir/plugin.json"), "utf-8")
    })
  })

  describe("installPlugin", () => {
    const validManifest = {
      name: "test-plugin",
      version: "1.2.3",
      description: "A test plugin",
      commands: [
        { namespace: "test", resource: "res", action: "act", adapter: "builtin" }
      ]
    }

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => false })
      fs.readFileSync.mockReturnValue(JSON.stringify(validManifest))
    })

    test("installs a new plugin successfully", () => {
      const result = installPlugin("test-plugin")
      
      expect(result.plugin).toBe("test-plugin")
      expect(result.installed_commands).toBe(1)
      expect(writePluginsLock).toHaveBeenCalledWith(expect.objectContaining({
        installed: expect.objectContaining({
          "test-plugin": expect.objectContaining({
            version: "1.2.3",
            commands: validManifest.commands
          })
        })
      }))
    })

    test("throws error on conflict with 'fail' strategy", () => {
      readPluginsLock.mockReturnValue({
        installed: {
          "other-plugin": {
            commands: [{ namespace: "test", resource: "res", action: "act" }]
          }
        }
      })

      expect(() => installPlugin("test-plugin", { onConflict: "fail" }))
        .toThrow(/Plugin install conflict/)
    })

    test("skips conflicting commands with 'skip' strategy", () => {
      readPluginsLock.mockReturnValue({
        installed: {
          "other-plugin": {
            commands: [{ namespace: "test", resource: "res", action: "act" }]
          }
        }
      })

      const result = installPlugin("test-plugin", { onConflict: "skip" })
      expect(result.installed_commands).toBe(0)
      expect(result.conflicts[0].action).toBe("skipped")
    })

    test("replaces conflicting commands with 'replace' strategy", () => {
      const lock = {
        installed: {
          "other-plugin": {
            commands: [{ namespace: "test", resource: "res", action: "act" }]
          }
        }
      }
      readPluginsLock.mockReturnValue(lock)

      const result = installPlugin("test-plugin", { onConflict: "replace" })
      expect(result.installed_commands).toBe(1)
      expect(result.conflicts[0].action).toBe("replaced")
      expect(lock.installed["other-plugin"].commands).toHaveLength(0)
    })

    test("blocks replace if owner is 'base'", () => {
      const result = installPlugin("test-plugin", { 
        onConflict: "replace",
        currentCommands: [{ namespace: "test", resource: "res", action: "act" }]
      })
      expect(result.installed_commands).toBe(0)
      expect(result.conflicts[0].action).toBe("blocked")
    })

    test("handles installation when existing plugin has no commands", () => {
      readPluginsLock.mockReturnValue({
        installed: { "test-plugin": { name: "test-plugin" } } // missing commands
      })
      const result = installPlugin("test-plugin")
      expect(result.plugin).toBe("test-plugin")
    })

    test("handles replacement when owner has no commands field", () => {
      const lock = {
        installed: {
          "other-plugin": { name: "other-plugin" } // missing commands
        }
      }
      readPluginsLock.mockReturnValue(lock)
      // Conflict with base command
      const result = installPlugin("test-plugin", { 
        onConflict: "replace",
        currentCommands: [{ namespace: "test", resource: "res", action: "act" }]
      })
      expect(result.conflicts[0].owner).toBe("base")
    })

    test("throws error for invalid onConflict strategy", () => {
      expect(() => installPlugin("test", { onConflict: "invalid" }))
        .toThrow(/Invalid --on-conflict/)
    })
  })

  describe("removePlugin", () => {
    test("removes an installed plugin", () => {
      readPluginsLock.mockReturnValue({
        installed: { "test-plugin": { name: "test-plugin" } }
      })

      const result = removePlugin("test-plugin")
      expect(result).toBe(true)
      expect(writePluginsLock).toHaveBeenCalledWith({ installed: {} })
    })

    test("returns false if plugin not installed", () => {
      readPluginsLock.mockReturnValue({ installed: {} })
      const result = removePlugin("nonexistent")
      expect(result).toBe(false)
      expect(writePluginsLock).not.toHaveBeenCalled()
    })
  })

  describe("doctorPlugin", () => {
    test("returns a report with binary checks", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "test-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ status: 0, stdout: "v1.0.0", stderr: "" })

      const report = doctorPlugin("test")
      expect(report.ok).toBe(true)
      expect(report.checks[0]).toMatchObject({ binary: "test-bin", ok: true })
    })

    test("reports policy violations for unsafe shell commands", () => {
      const plugin = {
        name: "test",
        commands: [{
          namespace: "test", resource: "sh", action: "run",
          adapter: "shell",
          adapterConfig: { unsafe: false }
        }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })

      const report = doctorPlugin("test")
      expect(report.ok).toBe(false)
      expect(report.checks[0].message).toContain("must set adapterConfig.unsafe=true")
    })

    test("throws error if plugin not found for doctor", () => {
      readPluginsLock.mockReturnValue({ installed: {} })
      expect(() => doctorPlugin("missing")).toThrow(/is not installed/)
    })

    test("reports error when binary is missing", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "missing-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ error: { code: "ENOENT" } })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toBe("not installed")
    })

    test("reports error when binary check returns non-zero", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "bad-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ status: 1, stderr: "error output" })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toBe("error output")
    })

    test("reports generic exit code when stderr is empty", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "bad-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ status: 127, stderr: "" })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toBe("exit 127")
    })

    test("reports default ok when stdout is empty", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "good-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ status: 0, stdout: "", stderr: "" })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toBe("ok")
    })

    test("reports binary check error when not ENOENT", () => {
      const plugin = {
        name: "test",
        commands: [],
        checks: [{ type: "binary", name: "fail-bin" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      spawnSync.mockReturnValue({ error: { code: "UNKNOWN", message: "low-level fail" } })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toBe("low-level fail")
    })

    test("handles plugins with missing adapter field", () => {
      const plugin = {
        name: "test",
        commands: [{ namespace: "t", resource: "r", action: "a" }] // no adapter
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })

      const report = doctorPlugin("test")
      expect(report.adapter_counts).toHaveProperty("(missing)")
    })

    test("reports policy violation for unknown adapter", () => {
      const plugin = {
        name: "test",
        commands: [{ namespace: "t", resource: "r", action: "a", adapter: "unknown" }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toContain("uses unknown adapter 'unknown'")
    })

    test("reports policy violation for non-interactive shell command", () => {
      const plugin = {
        name: "test",
        commands: [{
          namespace: "t", resource: "r", action: "a",
          adapter: "shell",
          adapterConfig: { unsafe: true, non_interactive: false }
        }]
      }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })

      const report = doctorPlugin("test")
      expect(report.checks[0].message).toContain("cannot disable non_interactive")
    })
  })

  describe("doctorAllPlugins", () => {
    test("aggregates reports for all plugins", () => {
      mockListInstalledPlugins.mockReturnValue([{ name: "p1" }, { name: "p2" }])
      
      // Mock doctorPlugin behavior internally by controlling lock
      readPluginsLock.mockReturnValue({
        installed: {
          p1: { name: "p1", commands: [] },
          p2: { name: "p2", commands: [] }
        }
      })

      const report = doctorAllPlugins()
      expect(report.total_plugins).toBe(2)
      expect(report.ok).toBe(true)
    })
  })

  describe("getPlugin", () => {
    test("returns null if plugin not found", () => {
      readPluginsLock.mockReturnValue({ installed: {} })
      expect(getPlugin("any")).toBeNull()
    })

    test("returns plugin if found", () => {
      const plugin = { name: "test" }
      readPluginsLock.mockReturnValue({ installed: { test: plugin } })
      expect(getPlugin("test")).toBe(plugin)
    })
  })
})
