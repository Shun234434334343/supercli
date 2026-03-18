const { spawnSync } = require("child_process")
const path = require("path")
const { addProvider, syncCatalog } = require("../../../cli/skills-catalog")

const OWNER = "dcstrange"
const REPO = "ClawTeam"
const REF = "main"
const SOURCE_REPO = `https://github.com/${OWNER}/${REPO}`
const TREE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${REF}?recursive=1`
const RAW_BASE_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${REF}`

const CATALOG_FILES = [
  {
    id: "root.readme",
    name: "ClawTeam Overview",
    path: "README.md",
    description: "Main project overview, core concepts, and high-level features of ClawTeam.",
    tags: ["overview", "collaboration", "agents"]
  },
  {
    id: "docs.architecture.overview",
    name: "ClawTeam Architecture",
    path: "docs/architecture/OVERVIEW.md",
    description: "Technical overview of the platform architecture (Cloud vs. Local Gateway).",
    tags: ["architecture", "design", "technical"]
  },
  {
    id: "docs.getting-started.quickstart",
    name: "ClawTeam Quickstart",
    path: "docs/getting-started/QUICKSTART.md",
    description: "Fast-track guide for setting up and using the platform.",
    tags: ["getting-started", "setup", "onboarding"]
  },
  {
    id: "docs.guides.session-management",
    name: "OpenClaw Session Management",
    path: "docs/guides/SESSION_MANAGEMENT.md",
    description: "Detailed guide for managing sessions and integrating OpenClaw agents with ClawTeam.",
    tags: ["guides", "openclaw", "integration", "session-management"]
  },
  {
    id: "docs.architecture.integration-layer",
    name: "ClawTeam Integration Layer",
    path: "docs/architecture/INTEGRATION_LAYER.md",
    description: "Technical specification for the ClawTeam integration layer (Gateway and SDKs).",
    tags: ["architecture", "integration", "technical"]
  },
  {
    id: "examples.create-your-bot",
    name: "Create Your Bot",
    path: "examples/CREATE_YOUR_BOT.md",
    description: "Tutorial on creating a new bot compatible with ClawTeam.",
    tags: ["examples", "tutorial", "bot-creation"]
  },
  {
    id: "docs.design.primitive-system",
    name: "Primitive System Design",
    path: "docs/design/PRIMITIVE_SYSTEM.md",
    description: "Deep dive into the 'Primitive System' (Identity, Presence, Delegate, etc.).",
    tags: ["design", "primitives", "technical"]
  },
  {
    id: "docs.task-operations.delegate",
    name: "Task Delegation Primitive",
    path: "docs/task-operations/DELEGATE.md",
    description: "Detailed documentation for the task delegation primitive.",
    tags: ["task-operations", "delegation", "technical"]
  }
]

function integrationError(message, suggestions = []) {
  return Object.assign(new Error(message), {
    code: 105,
    type: "integration_error",
    recoverable: true,
    suggestions
  })
}

function fetchJson(url) {
  const res = spawnSync("curl", ["-fsSL", url], { encoding: "utf-8", timeout: 15000 })
  if (res.error) {
    throw integrationError(`Failed to fetch ClawTeam metadata: ${res.error.message}`, [
      "Check internet connectivity",
      "Retry: supercli plugins install clawteam"
    ])
  }
  if (res.status !== 0) {
    throw integrationError(`Failed to fetch ClawTeam metadata: ${(res.stderr || "").trim() || `exit ${res.status}`}`, [
      "Check internet connectivity",
      "Retry: supercli plugins install clawteam"
    ])
  }
  try {
    return JSON.parse((res.stdout || "").trim() || "{}")
  } catch (err) {
    throw integrationError(`Invalid ClawTeam metadata response: ${err.message}`)
  }
}

function buildRemoteEntriesFromTree(treeResponse) {
  const tree = Array.isArray(treeResponse.tree) ? treeResponse.tree : []
  const availablePaths = new Set(
    tree
      .filter(node => node && node.type === "blob" && typeof node.path === "string")
      .map(node => node.path)
  )

  return CATALOG_FILES
    .filter(file => availablePaths.has(file.path))
    .map(file => ({
      ...file,
      source_url: `${RAW_BASE_URL}/${file.path}`
    }))
}

function run() {
  const treeResponse = fetchJson(TREE_URL)
  const entries = buildRemoteEntriesFromTree(treeResponse)
  if (entries.length === 0) {
    throw integrationError("ClawTeam plugin found no remote documentation files to index")
  }

  addProvider({
    name: "clawteam",
    type: "remote_static",
    enabled: true,
    source_repo: SOURCE_REPO,
    ref: REF,
    entries
  })

  // Register local skill provider for agent-specific workflows
  addProvider({
    name: "clawteam-local",
    type: "plugin_fs",
    enabled: true,
    plugin_dir: path.resolve(__dirname, "..")
  })

  const index = syncCatalog()
  return {
    provider: "clawteam",
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
  run,
  buildRemoteEntriesFromTree
}
