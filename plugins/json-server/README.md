# json-server Plugin Harness

This plugin integrates `@javimosch/json-server` into supercli with agent-friendly background server lifecycle wrappers and full passthrough.

## What You Get

- wrappers for `server start/status/logs/stop`
- `cli version` wrapper for environment checks
- full passthrough for all upstream `json-server` commands
- learn content via `supercli plugins learn json-server`

## Prerequisites

Install the package globally so the `json-server` binary is available:

```bash
npm install -g @javimosch/json-server
```

## Install Plugin

```bash
supercli plugins learn json-server
supercli plugins install json-server --json
```

## Wrapper Commands

```bash
supercli json-server cli version
supercli json-server server start --file fixtures/db.json --port 43111 --state-dir .json-server-test
supercli json-server server status --state-dir .json-server-test
supercli json-server server logs --state-dir .json-server-test --lines 50
supercli json-server server stop --state-dir .json-server-test
```

## Full Passthrough Examples

```bash
supercli json-server server start fixtures/db.json --json
supercli json-server fixtures/db.json --json --no-interactive --no-color
```

## Important Caveats

- Prefer wrapper args as flags (`--file`, `--state-dir`) for deterministic invocation.
- `server start` runs detached and returns immediately; use a short readiness retry loop before API calls.
- Default state directory is `./.json-server`; isolate environments with `--state-dir` to avoid PID/log collisions.
- Always run `server stop` after automation flows so stale state does not block future starts.

Example readiness check:

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sS http://localhost:43111/posts >/dev/null && break
  sleep 0.2
done
```
