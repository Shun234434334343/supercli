const { spawnSync } = require("child_process")
const { addProvider, syncCatalog } = require("../../../cli/skills-catalog")

const OWNER = "RightNow-AI"
const REPO = "openfang"
const REF = "main"
const SOURCE_REPO = `https://github.com/${OWNER}/${REPO}`
const TREE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${REF}?recursive=1`
const SKILLS_BASE = "crates/openfang-skills/bundled"

function integrationError(message, suggestions = []) {
  return Object.assign(new Error(message), {
    code: 105,
    type: "integration_error",
    recoverable: true,
    suggestions
  })
}

function fetchJson(url) {
  const res = spawnSync("curl", ["-fsSL", url], { encoding: "utf-8", timeout: 30000 })
  if (res.error) {
    throw integrationError(`Failed to fetch from GitHub API: ${res.error.message}`, ["Check internet connectivity", "Retry: supercli plugins install openfang"])
  }
  if (res.status !== 0) {
    throw integrationError(`Failed to fetch from GitHub API: ${(res.stderr || "").trim() || `exit ${res.status}`}`, ["Check internet connectivity", "Retry: supercli plugins install openfang"])
  }
  try {
    return JSON.parse((res.stdout || "").trim() || "{}")
  } catch (err) {
    throw integrationError(`Invalid JSON response: ${err.message}`)
  }
}

// Map skill folder names to human-readable names
const SKILL_DISPLAY_NAMES = {
  "ansible": "Ansible",
  "api-tester": "API Tester",
  "aws": "AWS Expert",
  "azure": "Azure Expert",
  "ci-cd": "CI/CD",
  "code-reviewer": "Code Reviewer",
  "compliance": "Compliance",
  "confluence": "Confluence",
  "crypto-expert": "Cryptocurrency Expert",
  "css-expert": "CSS Expert",
  "data-analyst": "Data Analyst",
  "data-pipeline": "Data Pipeline",
  "docker": "Docker",
  "elasticsearch": "Elasticsearch",
  "email-writer": "Email Writer",
  "figma-expert": "Figma Expert",
  "gcp": "Google Cloud Expert",
  "git-expert": "Git Expert",
  "github": "GitHub",
  "golang-expert": "Go Expert",
  "graphql-expert": "GraphQL Expert",
  "helm": "Helm",
  "interview-prep": "Interview Preparation",
  "jira": "Jira",
  "kubernetes": "Kubernetes",
  "linear-tools": "Linear",
  "linux-networking": "Linux Networking",
  "llm-finetuning": "LLM Fine-tuning",
  "ml-engineer": "ML Engineer",
  "mongodb": "MongoDB",
  "nextjs-expert": "Next.js Expert",
  "nginx": "Nginx",
  "notion": "Notion",
  "oauth-expert": "OAuth Expert",
  "openapi-expert": "OpenAPI Expert",
  "pdf-reader": "PDF Reader",
  "postgres-expert": "PostgreSQL Expert",
  "presentation": "Presentation",
  "project-manager": "Project Manager",
  "prometheus": "Prometheus",
  "prompt-engineer": "Prompt Engineer",
  "python-expert": "Python Expert",
  "react-expert": "React Expert",
  "redis-expert": "Redis Expert",
  "regex-expert": "Regex Expert",
  "rust-expert": "Rust Expert",
  "security-audit": "Security Audit",
  "sentry": "Sentry",
  "shell-scripting": "Shell Scripting",
  "slack-tools": "Slack",
  "sql-analyst": "SQL Analyst",
  "sqlite-expert": "SQLite Expert",
  "sysadmin": "System Administrator",
  "technical-writer": "Technical Writer",
  "terraform": "Terraform",
  "typescript-expert": "TypeScript Expert",
  "vector-db": "Vector Database",
  "wasm-expert": "WebAssembly Expert",
  "web-search": "Web Search",
  "writing-coach": "Writing Coach"
}

function run() {
  // Fetch the tree to get all skills
  const treeData = fetchJson(TREE_URL)
  
  if (!treeData.tree) {
    throw integrationError("Failed to get repository tree from GitHub")
  }

  // Find all skill directories under crates/openfang-skills/bundled
  const skillEntries = treeData.tree
    .filter(item => item.path.startsWith(SKILLS_BASE + "/") && item.type === "tree")
    .map(item => item.path.replace(SKILLS_BASE + "/", ""))

  if (skillEntries.length === 0) {
    throw integrationError("No skills found in openfang-skills/bundled")
  }

  // Build provider entries for each skill
  const entries = skillEntries.map(skillName => {
    const displayName = SKILL_DISPLAY_NAMES[skillName] || skillName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    
    return {
      id: skillName,
      name: displayName,
      description: `OpenFang bundled skill: ${displayName}`,
      path: `${SKILLS_BASE}/${skillName}`,
      source_url: `https://github.com/${OWNER}/${REPO}/tree/${REF}/${SKILLS_BASE}/${skillName}`
    }
  })

  // Add as a remote static provider
  addProvider({
    name: "openfang",
    type: "remote_static",
    enabled: true,
    source_repo: SOURCE_REPO,
    ref: REF,
    entries: entries
  })

  const index = syncCatalog()
  return {
    provider: "openfang",
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
  run
}

