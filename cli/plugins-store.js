const fs = require("fs")
const os = require("os")
const path = require("path")

const DCLI_DIR = path.join(os.homedir(), ".dcli")
const PLUGINS_FILE = path.join(DCLI_DIR, "plugins.lock.json")

function ensureDir() {
  if (!fs.existsSync(DCLI_DIR)) fs.mkdirSync(DCLI_DIR, { recursive: true })
}

function emptyLock() {
  return { version: 1, installed: {} }
}

function readPluginsLock() {
  try {
    if (!fs.existsSync(PLUGINS_FILE)) return emptyLock()
    const parsed = JSON.parse(fs.readFileSync(PLUGINS_FILE, "utf-8"))
    if (!parsed || typeof parsed !== "object") return emptyLock()
    if (!parsed.installed || typeof parsed.installed !== "object") parsed.installed = {}
    return parsed
  } catch {
    return emptyLock()
  }
}

function writePluginsLock(lock) {
  ensureDir()
  fs.writeFileSync(PLUGINS_FILE, JSON.stringify(lock, null, 2))
  return lock
}

function listInstalledPlugins() {
  const lock = readPluginsLock()
  return Object.values(lock.installed)
}

function getInstalledPluginCommands() {
  const lock = readPluginsLock()
  const commands = []
  for (const plugin of Object.values(lock.installed)) {
    for (const cmd of (plugin.commands || [])) {
      commands.push(cmd)
    }
  }
  return commands
}

module.exports = {
  PLUGINS_FILE,
  readPluginsLock,
  writePluginsLock,
  listInstalledPlugins,
  getInstalledPluginCommands
}
