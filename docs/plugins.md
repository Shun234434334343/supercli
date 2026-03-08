# Plugins

DCLI supports local plugins that install sets of commands without requiring a server.

## Plugin Commands

```bash
dcli plugins list
dcli plugins install beads
dcli plugins install gwc
dcli plugins show beads
dcli plugins show gwc
dcli plugins doctor
dcli plugins doctor beads
dcli plugins doctor gwc
dcli plugins remove beads
dcli plugins remove gwc
```

Install conflict policy:

```bash
dcli plugins install beads --on-conflict fail
dcli plugins install beads --on-conflict skip
dcli plugins install beads --on-conflict replace
dcli plugins install gwc --on-conflict fail
```

Default is `fail`.

## Beads Plugin

The `beads` plugin wraps the `br` binary from `beads_rust`:

- source: `https://github.com/Dicklesworthstone/beads_rust`
- local plugin manifest: `plugins/beads/plugin.json`

If `br` is not installed, ask DCLI for install guidance:

```bash
dcli beads install steps --json
```

Install execution is delegated to your LLM automation flow (dcli/scli/supercli).

## Example Commands

```bash
dcli beads workspace init
dcli beads issue create --title "Fix timeout" --type bug --priority 1 --json
dcli beads issue list --status open --json
dcli beads issue ready --json
dcli beads issue close --id bd-abc123 --reason "Done" --json
dcli beads dep add --child bd-child --parent bd-parent
dcli beads sync run --flush-only
dcli beads stats show --json
```

## GWC Plugin

The `gwc` plugin wraps the `gws` binary from Google Workspace CLI:

- source: `https://github.com/googleworkspace/cli`
- local plugin manifest: `plugins/gwc/plugin.json`

If `gws` is not installed, ask DCLI for install guidance:

```bash
dcli gwc install steps --json
```

Example passthrough commands:

```bash
dcli gwc --help
dcli gwc auth setup
dcli gwc schema drive.files.list
dcli gwc drive files list --params '{"pageSize": 5}'
```
