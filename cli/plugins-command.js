const {
  installPlugin,
  removePlugin,
  getPlugin,
  listInstalledPlugins,
  getPluginInstallGuidance,
  doctorPlugin,
  doctorAllPlugins
} = require("./plugins-manager")
const { listRegistryPlugins } = require("./plugins-registry")
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
    const gitRepo = flags.git
    const manifestPath = flags["manifest-path"]
    const gitRef = flags.ref

    if (!ref && !gitRepo) {
      outputError({
        code: 85,
        type: "invalid_argument",
        message: "Usage: dcli plugins install <name|path> [--on-conflict fail|skip|replace] OR dcli plugins install --git <repo> --manifest-path <path> [--ref <ref>]",
        recoverable: false
      })
      return true
    }
    const config = await loadConfig()
    const result = installPlugin(ref || "(git)", {
      onConflict: flags["on-conflict"] || "fail",
      currentCommands: config.commands || [],
      git: gitRepo,
      manifestPath,
      ref: gitRef
    })
    const guidance = getPluginInstallGuidance(result.plugin)
    output({ ok: true, ...result, install_guidance: guidance })
    return true
  }

  if (subcommand === "explore") {
    const tags = String(flags.tags || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
    const name = flags.name ? String(flags.name).trim() : ""
    const plugins = listRegistryPlugins({ name, tags }).map(p => ({
      name: p.name,
      description: p.description,
      tags: p.tags,
      source_type: (p.source && p.source.type) || "bundled",
      source_repo: p.source && p.source.repo ? p.source.repo : ""
    }))

    if (humanMode) {
      console.log("\n  ⚡ Plugin Registry\n")
      outputHumanTable(plugins, [
        { key: "name", label: "Name" },
        { key: "source_type", label: "Source" },
        { key: "tags", label: "Tags" },
        { key: "description", label: "Description" }
      ])
      console.log("")
    } else {
      output({
        plugins,
        filters: {
          name: name || null,
          tags
        }
      })
    }
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
    const report = name ? doctorPlugin(name) : doctorAllPlugins()
    output(report)
    return true
  }

  outputError({ code: 85, type: "invalid_argument", message: "Unknown plugins subcommand. Use: list, explore, install, remove, show, doctor", recoverable: false })
  return true
}

module.exports = { handlePluginsCommand }
