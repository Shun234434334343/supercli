# Clever Passthrough Safety Skill

Use `dcli clever _ _ ...` only when no dedicated wrapper exists.

## Safe Pattern

1. Prefer wrapped commands first (`doctor`, `whoami`, `apps list`, `addons list`, `tokens list`).
2. If passthrough is required, add `--format json` whenever the target command supports it.
3. Keep credentials in environment variables instead of command arguments.

## Example

```bash
dcli clever _ _ applications --format json
```

## Guardrails

- Do not assume all passthrough subcommands return JSON.
- Check exit status and error text before continuing dependent actions.
- Avoid destructive commands unless explicitly required by user intent.
