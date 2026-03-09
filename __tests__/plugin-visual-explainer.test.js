const { spawnSync } = require("child_process")
const { addProvider, syncCatalog } = require("../cli/skills-catalog")
const {
  run,
  buildRemoteEntriesFromTree
} = require("../plugins/visual-explainer/scripts/post-install")

jest.mock("child_process")
jest.mock("../cli/skills-catalog")

describe("plugin-visual-explainer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("buildRemoteEntriesFromTree filters only normalized markdown skills", () => {
    const entries = buildRemoteEntriesFromTree({
      tree: [
        { type: "blob", path: "plugins/visual-explainer-normalized/SKILL.md" },
        { type: "blob", path: "plugins/visual-explainer-normalized/commands/diff-review.md" },
        { type: "blob", path: "plugins/visual-explainer/commands/diff-review.md" },
        { type: "blob", path: "plugins/visual-explainer-normalized/templates/architecture.html" }
      ]
    })

    expect(entries).toHaveLength(2)
    expect(entries[0].id).toBe("visual-explainer.commands.diff-review")
    expect(entries[1].id).toBe("visual-explainer.skill")
  })

  test("run stores provider and syncs catalog", () => {
    spawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        tree: [
          { type: "blob", path: "plugins/visual-explainer-normalized/SKILL.md" },
          { type: "blob", path: "plugins/visual-explainer-normalized/commands/generate-web-diagram.md" }
        ]
      })
    })
    syncCatalog.mockReturnValue({ skills: [1, 2, 3] })

    const result = run()

    expect(addProvider).toHaveBeenCalledWith(expect.objectContaining({
      name: "visual-explainer",
      type: "remote_static",
      entries: expect.any(Array)
    }))
    expect(syncCatalog).toHaveBeenCalled()
    expect(result).toEqual({
      provider: "visual-explainer",
      entries: 2,
      synced_skills: 3
    })
  })

  test("run throws on curl failure", () => {
    spawnSync.mockReturnValue({ status: 22, stderr: "404" })
    expect(() => run()).toThrow(/Failed to fetch visual-explainer metadata/)
  })
})
