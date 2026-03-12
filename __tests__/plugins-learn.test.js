const fs = require("fs")
const { spawnSync } = require("child_process")
const { getPlugin } = require("../cli/plugins-manager")
const { getRegistryPlugin } = require("../cli/plugins-registry")
const { getPluginLearn, resolveLearnMarkdown } = require("../cli/plugins-learn")

jest.mock("fs")
jest.mock("child_process")
jest.mock("../cli/plugins-manager")
jest.mock("../cli/plugins-registry")

describe("plugins-learn", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    spawnSync.mockReturnValue({ status: 0, stdout: "" })
    getPlugin.mockReturnValue(null)
    getRegistryPlugin.mockReturnValue(null)
  })

  test("loads learn markdown from registry bundled file", () => {
    getRegistryPlugin.mockReturnValue({
      name: "browser-use",
      source: { type: "bundled", manifest_path: "plugins/browser-use/plugin.json" },
    })

    fs.existsSync.mockImplementation((p) => String(p).includes("plugin.json") || String(p).includes("SKILL.md"))
    fs.readFileSync.mockImplementation((p) => {
      if (String(p).includes("plugin.json")) {
        return JSON.stringify({ name: "browser-use", learn: { file: "skills/quickstart/SKILL.md" } })
      }
      return "# Browser Use Learn"
    })

    const out = getPluginLearn("browser-use")
    expect(out.plugin).toBe("browser-use")
    expect(out.installed).toBe(false)
    expect(out.learn_markdown).toContain("Browser Use Learn")
  })

  test("prefers installed plugin source when available", () => {
    getPlugin.mockReturnValue({
      name: "browser-use",
      resolved_from: { type: "path", manifest_path: "/tmp/browser-use/plugin.json" },
    })

    fs.existsSync.mockImplementation((p) => String(p).includes("plugin.json") || String(p).includes("learn.md"))
    fs.readFileSync.mockImplementation((p) => {
      if (String(p).includes("plugin.json")) {
        return JSON.stringify({ name: "browser-use", learn: { file: "learn.md" } })
      }
      return "# Installed Learn"
    })

    const out = getPluginLearn("browser-use")
    expect(out.installed).toBe(true)
    expect(out.learn_markdown).toContain("Installed Learn")
  })

  test("resolveLearnMarkdown rejects invalid learn object", () => {
    expect(() => resolveLearnMarkdown({ name: "x", learn: { file: "a.md", text: "b" } }, "/tmp/plugin.json")).toThrow(/either learn.text or learn.file/)
  })
})
