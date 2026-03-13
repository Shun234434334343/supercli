# cocoindex-code Plugin Harness

This plugin integrates `cocoindex-code` into supercli with automatic local MCP server registration, a fast direct search capability for day-to-day use, and an MCP-backed search capability for MCP-native workflows.

## What You Get

- auto-registers local MCP server `cocoindex-code`
- fast capability: `supercli cocoindex code search`
- MCP capability: `supercli cocoindex mcp search`
- helper capability: `supercli cocoindex index build`
- learn content via `supercli plugins learn cocoindex-code`

## Prerequisites

Install `cocoindex-code` first (choose one):

```bash
pipx install cocoindex-code
# or
uv tool install --upgrade cocoindex-code --prerelease explicit --with "cocoindex>=1.0.0a24"
```

Verify binary availability:

```bash
cocoindex-code --help
```

## Install Plugin

```bash
supercli plugins learn cocoindex-code
supercli plugins install cocoindex-code --json
```

## Wrapped Capabilities

```bash
# Build/refresh index first (recommended for large repos)
supercli cocoindex index build --json

# Preferred for humans and bots: fast semantic code search
supercli cocoindex code search --query "where is auth middleware implemented" --limit 5 --json
supercli cocoindex code search --query "session handling" --offset 5 --json
supercli cocoindex code search --query "entrypoint reads process.argv rawArgs and parses flags" --paths "cli/*" --limit 5 --json

# Optional MCP-native search
supercli cocoindex mcp search --query "where is auth middleware implemented" --limit 5 --json
```

## Notes

- Prefer `cocoindex code search` for both humans and non-human agents. It is the fastest, easiest path and searches the current repo directly.
- `cocoindex code search` uses a direct wrapper around the installed `cocoindex-code` Python package, so it avoids per-query MCP server startup overhead.
- `cocoindex mcp search` maps to MCP tool `search` on server `cocoindex-code`.
- Use `cocoindex mcp search` only when you specifically need an MCP-shaped workflow.
- For advanced MCP input fields such as `languages` or `paths`, use direct MCP call:

```bash
supercli mcp call --mcp-server cocoindex-code --tool search --input-json '{"query":"auth","languages":["python"],"paths":["src/*"],"limit":5}' --timeout-ms 180000 --json
```

- By default, cocoindex-code auto-discovers root from `.cocoindex_code/`, `.git/`, or current directory.
- Optional env vars: `COCOINDEX_CODE_ROOT_PATH`, `COCOINDEX_CODE_EMBEDDING_MODEL`, `COCOINDEX_CODE_EXCLUDED_PATTERNS`.
