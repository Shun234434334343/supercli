const { removeProvider, syncCatalog } = require("../../../cli/skills-catalog")

const PROVIDER = "squirrelscan"

function run() {
  const removed = removeProvider(PROVIDER)
  const index = syncCatalog()
  return {
    provider: PROVIDER,
    removed,
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
