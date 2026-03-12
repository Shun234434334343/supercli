const { addProvider, syncCatalog } = require("../../../cli/skills-catalog")

const OWNER = "resend"
const REPO = "resend-cli"
const REF = "main"
const SOURCE_REPO = `https://github.com/${OWNER}/${REPO}`
const RAW_BASE_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${REF}`

const CATALOG_FILES = [
  {
    id: "root.readme",
    name: "Resend CLI Overview",
    path: "README.md",
    description: "Official CLI documentation for Resend, covering installation, authentication, and email sending commands.",
    tags: ["email", "resend", "api", "cli", "usage"]
  }
]

function buildRemoteEntries() {
  return CATALOG_FILES.map(file => ({
    ...file,
    source_url: `${RAW_BASE_URL}/${file.path}`
  }))
}

function run() {
  const entries = buildRemoteEntries()
  addProvider({
    name: "resend",
    type: "remote_static",
    enabled: true,
    source_repo: SOURCE_REPO,
    ref: REF,
    entries
  })

  const index = syncCatalog()
  return {
    provider: "resend",
    entries: entries.length,
    synced_skills: Array.isArray(index.skills) ? index.skills.length : 0
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

module.exports = {
  CATALOG_FILES,
  buildRemoteEntries,
  run
}
