const { addProvider, removeProvider, syncCatalog } = require("../cli/skills-catalog")
const {
  CATALOG_FILES,
  buildRemoteEntries,
  run
} = require("../plugins/blogwatcher/scripts/post-install")
const { run: runUninstall } = require("../plugins/blogwatcher/scripts/post-uninstall")

jest.mock("../cli/skills-catalog")

describe("plugin-blogwatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("buildRemoteEntries maps curated blogwatcher docs", () => {
    const entries = buildRemoteEntries()

    expect(entries).toHaveLength(CATALOG_FILES.length)
    expect(entries.map(entry => entry.id)).toEqual(["root.skill", "root.readme"])
    expect(entries.every(entry => entry.source_url.includes("raw.githubusercontent.com/Hyaxia/blogwatcher/main/"))).toBe(true)
  })

  test("run stores provider and syncs catalog", () => {
    syncCatalog.mockReturnValue({ skills: [1, 2, 3] })

    const result = run()

    expect(addProvider).toHaveBeenCalledWith(expect.objectContaining({
      name: "blogwatcher",
      type: "remote_static",
      entries: expect.arrayContaining([
        expect.objectContaining({ id: "root.skill" }),
        expect.objectContaining({ id: "root.readme" })
      ])
    }))
    expect(syncCatalog).toHaveBeenCalled()
    expect(result).toEqual({
      provider: "blogwatcher",
      entries: CATALOG_FILES.length,
      synced_skills: 3
    })
  })

  test("post-uninstall removes provider and syncs catalog", () => {
    removeProvider.mockReturnValue(true)
    syncCatalog.mockReturnValue({ skills: [1] })

    const result = runUninstall()

    expect(removeProvider).toHaveBeenCalledWith("blogwatcher")
    expect(syncCatalog).toHaveBeenCalled()
    expect(result).toEqual({ provider: "blogwatcher", removed: true, synced_skills: 1 })
  })
})
