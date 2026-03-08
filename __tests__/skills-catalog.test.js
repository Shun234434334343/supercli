const fs = require("fs")
const os = require("os")
const path = require("path")

const {
  addProvider,
  removeProvider,
  listProviders,
  syncCatalog,
  listCatalogSkills,
  searchCatalog,
  getCatalogSkill
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

    const index = syncCatalog()
    expect(index.skills.length).toBeGreaterThan(0)

    const listed = listCatalogSkills({ provider: "testkb" })
    expect(listed.find(s => s.id === "testkb:sample_skill")).toBeTruthy()

    const searched = searchCatalog("sample", { provider: "testkb" })
    expect(searched.length).toBeGreaterThan(0)

    const full = getCatalogSkill("testkb:sample_skill")
    expect(full).toBeTruthy()
    expect(full.markdown).toContain("skill_name: sample_skill")

    const removed = removeProvider("testkb")
    expect(removed).toBe(true)
  })
})
