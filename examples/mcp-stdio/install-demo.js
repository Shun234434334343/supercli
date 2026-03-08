#!/usr/bin/env node

const fs = require("fs")
const os = require("os")
const path = require("path")

const CACHE_DIR = path.join(os.homedir(), ".dcli")
const CACHE_FILE = path.join(CACHE_DIR, "config.json")
const ROOT = path.resolve(__dirname, "..", "..")
const SERVER_SCRIPT = path.join(ROOT, "examples", "mcp-stdio", "server.js")

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readConfig() {
  if (!fs.existsSync(CACHE_FILE)) {
    return { version: "1", ttl: 3600, mcp_servers: [], specs: [], commands: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
  } catch {
    return { version: "1", ttl: 3600, mcp_servers: [], specs: [], commands: [] }
  }
}

function upsertCommand(config, command) {
  const idx = config.commands.findIndex(c =>
    c.namespace === command.namespace && c.resource === command.resource && c.action === command.action
  )
  if (idx >= 0) config.commands[idx] = command
  else config.commands.push(command)
}

function main() {
  ensureDir(CACHE_DIR)
  const config = readConfig()
  if (!Array.isArray(config.commands)) config.commands = []
  if (!Array.isArray(config.mcp_servers)) config.mcp_servers = []
  if (!Array.isArray(config.specs)) config.specs = []

  upsertCommand(config, {
    _id: "command:ai.text.summarize",
    namespace: "ai",
    resource: "text",
    action: "summarize",
    description: "Mock summarize using local stdio MCP server",
    adapter: "mcp",
    adapterConfig: {
      tool: "summarize",
      command: `node ${SERVER_SCRIPT}`
    },
    args: [{ name: "text", type: "string", required: true }]
  })

  config.fetchedAt = Date.now()
  fs.writeFileSync(CACHE_FILE, JSON.stringify(config, null, 2))
  process.stdout.write(`Installed demo command ai.text.summarize in ${CACHE_FILE}\n`)
}

main()
