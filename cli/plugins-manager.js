const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const {
  readPluginsLock,
  writePluginsLock,
  listInstalledPlugins
} = require("./plugins-store")

const BUNDLED_PLUGINS = {
  beads: path.resolve(__dirname, "..", "plugins", "beads", "plugin.json"),
  gwc: path.resolve(__dirname, "..", "plugins", "gwc", "plugin.json")
}

const PLUGIN_INSTALL_GUIDANCE = {
  beads: {
    plugin: "beads",
    binary: "br",
    check: "br --version",
    install_steps: [
      "curl -fsSL \"https://raw.githubusercontent.com/Dicklesworthstone/beads_rust/main/install.sh?$(date +%s)\" | bash",
      "br --version"
    ],
    note: "Installation is intentionally delegated to your LLM/automation flow (dcli/scli/supercli)."
  },
  gwc: {
    plugin: "gwc",
    binary: "gws",
    check: "gws --version",
    install_steps: [
      "npm install -g @googleworkspace/cli",
      "gws --version"
    ],
    note: "Installation is intentionally delegated to your LLM/automation flow (dcli/scli/supercli)."
  }
}

function commandKey(cmd) {
  return `${cmd.namespace}.${cmd.resource}.${cmd.action}`
}

function resolveManifestPath(ref) {
  const base = BUNDLED_PLUGINS[ref] || path.resolve(ref)
  if (!fs.existsSync(base)) return null
  const st = fs.statSync(base)
  if (st.isDirectory()) return path.join(base, "plugin.json")
  return base
}

function loadPluginManifest(ref) {
  const manifestPath = resolveManifestPath(ref)
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    throw Object.assign(new Error(`Plugin '${ref}' not found`), {
      code: 92,
      type: "resource_not_found",
      recoverable: false,
      suggestions: ["Run: dcli plugins list"]
    })
  }
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  } catch (err) {
    throw Object.assign(new Error(`Invalid plugin manifest at ${manifestPath}: ${err.message}`), {
      code: 85,
      type: "invalid_argument",
      recoverable: false
    })
  }
  if (!raw.name || !Array.isArray(raw.commands)) {
    throw Object.assign(new Error("Invalid plugin manifest: missing name or commands"), {
      code: 85,
      type: "invalid_argument",
      recoverable: false
    })
  }
  return raw
}

function checkBinary(binary) {
  const r = spawnSync(binary, ["--version"], { encoding: "utf-8", timeout: 5000 })
  if (r.error) {
    return {
      binary,
      ok: false,
      message: r.error.code === "ENOENT" ? "not installed" : r.error.message
    }
  }
  if (r.status !== 0) {
    return {
      binary,
      ok: false,
      message: (r.stderr || "").trim() || `exit ${r.status}`
    }
  }
  return {
    binary,
    ok: true,
    message: (r.stdout || "").trim() || "ok"
  }
}

function doctorPlugin(name) {
  const plugin = getPlugin(name)
  if (!plugin) {
    throw Object.assign(new Error(`Plugin '${name}' is not installed`), {
      code: 92,
      type: "resource_not_found",
      recoverable: false,
      suggestions: ["Run: dcli plugins list"]
    })
  }

  const checks = []
  for (const check of (plugin.checks || [])) {
    if (check && check.type === "binary" && check.name) {
      checks.push(checkBinary(check.name))
    }
  }

  return {
    plugin: name,
    ok: checks.every(c => c.ok),
    checks,
    install_guidance: getPluginInstallGuidance(name)
  }
}

function doctorAllPlugins() {
  return listInstalledPlugins().map(p => doctorPlugin(p.name))
}

function installPlugin(ref, options = {}) {
  const onConflict = options.onConflict || "fail"
  if (!["fail", "skip", "replace"].includes(onConflict)) {
    throw Object.assign(new Error("Invalid --on-conflict. Use: fail, skip, replace"), {
      code: 85,
      type: "invalid_argument",
      recoverable: false
    })
  }

  const manifest = loadPluginManifest(ref)
  const lock = readPluginsLock()
  const existing = lock.installed[manifest.name]
  const currentCommands = Array.isArray(options.currentCommands) ? options.currentCommands : []

  const existingByKey = {}
  for (const cmd of currentCommands) {
    existingByKey[commandKey(cmd)] = true
  }

  const ownerByKey = {}
  for (const [pluginName, plugin] of Object.entries(lock.installed)) {
    for (const cmd of (plugin.commands || [])) {
      ownerByKey[commandKey(cmd)] = pluginName
    }
  }

  const existingKeysForSamePlugin = new Set((existing && existing.commands ? existing.commands : []).map(commandKey))
  const conflicts = []
  const installedCommands = []

  for (const cmd of manifest.commands) {
    const key = commandKey(cmd)
    const owner = ownerByKey[key]
    if ((!existingByKey[key] && !owner) || existingKeysForSamePlugin.has(key)) {
      installedCommands.push(cmd)
      continue
    }

    if (onConflict === "skip") {
      conflicts.push({ key, owner, action: "skipped" })
      continue
    }

    if (onConflict === "replace") {
      if (owner) {
        lock.installed[owner].commands = (lock.installed[owner].commands || []).filter(c => commandKey(c) !== key)
        conflicts.push({ key, owner, action: "replaced" })
        installedCommands.push(cmd)
        continue
      }
      conflicts.push({ key, owner: "base", action: "blocked" })
      continue
    }

    conflicts.push({ key, owner, action: "blocked" })
  }

  if (onConflict === "fail" && conflicts.length > 0) {
    throw Object.assign(new Error(`Plugin install conflict for: ${conflicts.map(c => c.key).join(", ")}`), {
      code: 85,
      type: "invalid_argument",
      recoverable: false,
      suggestions: [
        "Retry with --on-conflict skip",
        "Retry with --on-conflict replace"
      ]
    })
  }

  lock.installed[manifest.name] = {
    name: manifest.name,
    version: manifest.version || "0.0.0",
    description: manifest.description || "",
    source: manifest.source || ref,
    installed_at: new Date().toISOString(),
    commands: installedCommands,
    checks: manifest.checks || []
  }

  writePluginsLock(lock)
  return {
    plugin: manifest.name,
    version: manifest.version || "0.0.0",
    installed_commands: installedCommands.length,
    conflicts
  }
}

function removePlugin(name) {
  const lock = readPluginsLock()
  if (!lock.installed[name]) return false
  delete lock.installed[name]
  writePluginsLock(lock)
  return true
}

function getPlugin(name) {
  const lock = readPluginsLock()
  return lock.installed[name] || null
}

function getPluginInstallGuidance(name) {
  return PLUGIN_INSTALL_GUIDANCE[name] || null
}

module.exports = {
  installPlugin,
  removePlugin,
  getPlugin,
  listInstalledPlugins,
  getPluginInstallGuidance,
  doctorPlugin,
  doctorAllPlugins
}
