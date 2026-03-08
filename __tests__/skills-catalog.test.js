const fs = require("fs")
const os = require("os")
const path = require("path")

const {
  addProvider,
  removeProvider,
  getProvider,
  listProviders,
  syncCatalog,
  listCatalogSkills,
  searchCatalog,
  getCatalogSkill,
  readIndex
} = require("../cli/skills-catalog")

describe("skills catalog", () => {
  let tempHome
  let skillsRoot

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "supercli-skills-"))
    process.env.SUPERCLI_HOME = tempHome
    skillsRoot = path.join(tempHome, "kb", "skills")
    fs.mkdirSync(path.join(skillsRoot, "sample"), { recursive: true })
    fs.writeFileSync(
      path.join(skillsRoot, "sample", "SKILL.md"),
      "---\nskill_name: sample_skill\ndescription: Sample description\n---\n\n# Sample\n\ncontent"
    )
  })

  afterEach(() => {
    delete process.env.SUPERCLI_HOME
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test("provider lifecycle and sync catalog", () => {
    addProvider({ name: "testkb", type: "local_fs", roots: [skillsRoot], enabled: true })

    const providers = listProviders()
    expect(providers.find(p => p.name === "testkb")).toBeTruthy()
    expect(getProvider("testkb")).toBeTruthy()
    expect(getProvider("missing")).toBeNull()

    const index = syncCatalog()
    expect(index.skills.length).toBeGreaterThan(0)

    const listed = listCatalogSkills({ provider: "testkb" })
    expect(listed.find(s => s.id === "testkb:sample_skill")).toBeTruthy()

    const searched = searchCatalog("sample", { provider: "testkb" })
    expect(searched.length).toBeGreaterThan(0)
    
    // Coverage for line 181
    const searchedDesc = searchCatalog("description")
    expect(searchedDesc.length).toBeGreaterThan(0)

    const full = getCatalogSkill("testkb:sample_skill")
    expect(full).toBeTruthy()
    expect(full.markdown).toContain("skill_name: sample_skill")

    const removed = removeProvider("testkb")
    expect(removed).toBe(true)
  })

  test("readJson error coverage", () => {
    const providersFile = path.join(tempHome, "skills-providers.json")
    fs.writeFileSync(providersFile, "invalid-json")
    // Should fallback to default providers
    const providers = listProviders()
    expect(providers.length).toBeGreaterThan(0)
  })

  test("readIndex coverage", () => {
    expect(readIndex().skills).toEqual([])
    const indexFile = path.join(tempHome, "skills-index.json")
    fs.writeFileSync(indexFile, "null")
    expect(readIndex().skills).toEqual([])
  })
})
