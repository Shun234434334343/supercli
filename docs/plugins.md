# Plugins

DCLI supports plugin discovery through the registry file at `plugins/plugins.json`.

Plugin owners can submit PRs that add or update metadata in this registry:

- `name`
- `description`
- `tags`
- `source` (`bundled` path or remote `git` repo + manifest path)

## Plugin Commands

```bash
dcli plugins list
dcli plugins explore
dcli plugins explore --name commiat
dcli plugins explore --tags git,ai
dcli plugins explore --has-learn true --installed false --source bundled --limit 10 --json
dcli plugins learn <plugin-name>
dcli plugins install <plugin-name>
dcli plugins install --git https://github.com/org/repo.git --manifest-path plugins/supercli/plugin.json --ref main
dcli plugins show <plugin-name>
dcli plugins doctor
dcli plugins doctor <plugin-name>
dcli plugins remove <plugin-name>
```

Install conflict policy:

```bash
dcli plugins install <plugin-name> --on-conflict fail
dcli plugins install <plugin-name> --on-conflict skip
dcli plugins install <plugin-name> --on-conflict replace
```

Default is `fail`.

## Notes

- `plugins list` shows installed plugins.
- `plugins explore` shows discoverable plugins from `plugins/plugins.json`.
- `plugins explore` supports filters: `--name`, `--tags`, `--has-learn true|false`, `--installed true|false`, `--source bundled|git`, `--limit <n>`.
- `plugins explore --json` includes `has_learn`, `installed`, and `filters` metadata so agents can prioritize plugins with learning content.
- `plugins learn <name>` prints plugin-provided learning content before or after install.
- `plugins install` supports local path, registry name, and direct remote git manifest installs.
- Plugin manifests can define `learn` content via `learn.text` or `learn.file` (path inside plugin folder).
- Plugin manifests can define `post_install` hooks (`script`, optional `runtime`, optional `timeout_ms`) that execute from the plugin folder after install.
- `agency-agents` is a bundled zero-command plugin. Installing it adds a remote skills provider named `agency-agents` and refreshes the local skills catalog.
- `visual-explainer` is a bundled zero-command plugin. Installing it adds a remote skills provider named `visual-explainer` sourced from normalized markdown skills in `javimosch/visual-explainer` and refreshes the local skills catalog.
- `browser-use` is a bundled hybrid plugin. Installing it auto-registers a `browser-use` MCP server, discovers and binds Browser Use MCP tools into direct `browseruse.tool.*` commands, and installs local Browser Use skills from the plugin folder.
