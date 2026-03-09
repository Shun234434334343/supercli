const { spawnSync } = require("child_process")
const { addProvider, syncCatalog } = require("../cli/skills-catalog")
const {
  run,
  buildRemoteEntriesFromTree
} = require("../plugins/agency-agents/scripts/post-install")

jest.mock("child_process")
jest.mock("../cli/skills-catalog")

describe("plugin-agency-agents", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("buildRemoteEntriesFromTree filters only agent markdown files", () => {
    const entries = buildRemoteEntriesFromTree({
      tree: [
        { type: "blob", path: "engineering/engineering-frontend-developer.md" },
        { type: "blob", path: "strategy/QUICKSTART.md" },
        { type: "blob", path: "design/README.md" },
        { type: "blob", path: "marketing/marketing-growth-hacker.md" }
      ]
    })

    expect(entries).toHaveLength(2)
    expect(entries[0].id).toBe("engineering.engineering-frontend-developer")
    expect(entries[1].id).toBe("marketing.marketing-growth-hacker")
  })

  test("run stores provider and syncs catalog", () => {
    spawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        tree: [
          { type: "blob", path: "engineering/engineering-frontend-developer.md" },
          { type: "blob", path: "testing/testing-api-tester.md" }
        ]
      })
    })
    syncCatalog.mockReturnValue({ skills: [1, 2, 3] })

    const result = run()

    expect(addProvider).toHaveBeenCalledWith(expect.objectContaining({
      name: "agency-agents",
      type: "remote_static",
      entries: expect.any(Array)
    }))
    expect(syncCatalog).toHaveBeenCalled()
    expect(result).toEqual({
      provider: "agency-agents",
      entries: 2,
      synced_skills: 3
    })
  })

  test("run throws on curl failure", () => {
    spawnSync.mockReturnValue({ status: 22, stderr: "404" })
    expect(() => run()).toThrow(/Failed to fetch agency-agents metadata/)
  })
})
