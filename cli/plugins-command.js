const {
  installPlugin,
  removePlugin,
  getPlugin,
  listInstalledPlugins,
  getPluginInstallGuidance,
  doctorPlugin,
  doctorAllPlugins
} = require("./plugins-manager")
const { loadConfig } = require("./config")

async function handlePluginsCommand(options) {
  const { positional, flags, humanMode, output, outputHumanTable, outputError } = options
  const subcommand = positional[1]

  if (subcommand === "list") {
    const plugins = listInstalledPlugins().map(p => ({
      name: p.name,
      version: p.version,
      commands: (p.commands || []).length,
      description: p.description || ""
    }))
    if (humanMode) {
      console.log("\n  ⚡ Plugins\n")
      outputHumanTable(plugins, [
        { key: "name", label: "Name" },
        { key: "version", label: "Version" },
        { key: "commands", label: "Commands" },
        { key: "description", label: "Description" }
      ])
      console.log("")
    } else {
      output({ plugins })
    }
    return true
  }

  if (subcommand === "install") {
    const ref = positional[2]
    if (!ref) {
      outputError({ code: 85, type: "invalid_argument", message: "Usage: dcli plugins install <name|path> [--on-conflict fail|skip|replace]", recoverable: false })
      return true
    }
    const config = await loadConfig()
    const result = installPlugin(ref, {
      onConflict: flags["on-conflict"] || "fail",
      currentCommands: config.commands || []
    })
    const guidance = getPluginInstallGuidance(result.plugin)
    output({ ok: true, ...result, install_guidance: guidance })
    return true
  }

  if (subcommand === "remove") {
    const name = positional[2]
    if (!name) {
      outputError({ code: 85, type: "invalid_argument", message: "Usage: dcli plugins remove <name>", recoverable: false })
      return true
    }
    output({ ok: true, removed: removePlugin(name) })
    return true
  }

  if (subcommand === "show") {
    const name = positional[2]
    if (!name) {
      outputError({ code: 85, type: "invalid_argument", message: "Usage: dcli plugins show <name>", recoverable: false })
      return true
    }
    const plugin = getPlugin(name)
    if (!plugin) {
      outputError({ code: 92, type: "resource_not_found", message: `Plugin '${name}' is not installed`, suggestions: ["Run: dcli plugins list"] })
      return true
    }
    output({ plugin, install_guidance: getPluginInstallGuidance(name) })
    return true
  }

  if (subcommand === "doctor") {
    const name = positional[2]
    const report = name ? doctorPlugin(name) : { plugins: doctorAllPlugins() }
    output(report)
    return true
  }

  outputError({ code: 85, type: "invalid_argument", message: "Unknown plugins subcommand. Use: list, install, remove, show, doctor", recoverable: false })
  return true
}

module.exports = { handlePluginsCommand }
