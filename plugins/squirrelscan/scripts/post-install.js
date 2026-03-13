const path = require("path")
const { addProvider, syncCatalog } = require("../../../cli/skills-catalog")

const PROVIDER = "squirrelscan"
const SKILLS_ROOT = path.resolve(__dirname, "..", "skills")

function run() {
  addProvider({
    name: PROVIDER,
    type: "local_fs",
    roots: [SKILLS_ROOT],
    enabled: true,
  })

  const index = syncCatalog()
  return {
    provider: PROVIDER,
    roots: [SKILLS_ROOT],
    synced_skills: Array.isArray(index.skills) ? index.skills.length : 0,
  }
}

if (require.main === module) {
  try {
    const result = run()
    process.stdout.write(JSON.stringify(result))
  } catch (err) {
    process.stderr.write(err.message)
    process.exit(1)
  }
}

module.exports = { run }
