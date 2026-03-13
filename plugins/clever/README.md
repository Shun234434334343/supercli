# Clever Plugin

Agent-friendly SuperCLI integration for Clever Tools (`clever`), focused on non-interactive account and platform workflows.

## Why This Plugin

Clever Tools already supports two strong automation primitives:

- non-interactive auth via `CLEVER_TOKEN` and `CLEVER_SECRET`
- structured output via `--format json` / `-F json`

This plugin packages those capabilities into stable SuperCLI commands.

## Setup

```bash
dcli clever cli setup
```

Authentication can be provided either by:

- exported `CLEVER_TOKEN` and `CLEVER_SECRET`
- a prior `clever login`

## Commands

- `clever cli setup`: install `clever-tools`
- `clever cli doctor`: run `clever diag --format json`
- `clever auth whoami`: return the active profile as JSON
- `clever apps list`: list applications as JSON
- `clever addons list`: list add-ons as JSON
- `clever tokens list`: list API bridge tokens as JSON
- `clever _ _`: passthrough to raw Clever CLI commands

## Notes

- stdout should remain JSON-only for wrapped commands
- use `CLEVER_TOKEN` and `CLEVER_SECRET` in CI rather than interactive login
- prefer the wrapped commands first; use passthrough for advanced or newer Clever CLI surfaces

## Skills

- `plugins/clever/skills/quickstart/SKILL.md`
- `plugins/clever/skills/auth-and-profile.md`
- `plugins/clever/skills/resource-inventory.md`
- `plugins/clever/skills/passthrough-safety.md`
