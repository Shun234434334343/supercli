# Goose Plugin

Use this plugin to run the `goose` CLI through SuperCLI with safer headless defaults.

## Install

```bash
curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash
supercli plugins install goose
```

## Fast path

```bash
supercli goose cli version
supercli goose task text --text "Summarize this repository"
supercli goose task json --text "List the main services as JSON"
supercli goose task stream --text "Plan a docs update"
supercli goose task file --instructions ./task.txt
```

These wrapped commands default to `goose run --no-session --quiet` so they work better in CI and other non-interactive automation.

## Passthrough

Use passthrough when you need an upstream flag that is not wrapped yet:

```bash
supercli goose run --text "Explain this project" --output-format json --no-session
```

## Notes

- Prefer the wrapped commands for deterministic automation.
- `task stream` emits JSONL events.
- `task file` accepts a file path or `-` for stdin.
