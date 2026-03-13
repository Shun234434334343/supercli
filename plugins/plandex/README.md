# Plandex Plugin

`plandex` wraps the Plandex CLI for agent-safe, non-interactive usage in supercli.

## Install

```bash
supercli plugins install ./plugins/plandex --json
# Install Plandex CLI from official docs and ensure `plandex` is on PATH
```

## Commands

- `supercli plandex cli version`
- `supercli plandex plan new --name "my-plan" --full`
- `supercli plandex plan set-auto full`
- `supercli plandex task tell --prompt "Implement X"`
- `supercli plandex task chat --prompt "Explain Y"`
- `supercli plandex <any upstream args...>`

## Notes

- Use `plan set-auto` to control autonomy in CI and local automation.
- Prefer explicit, one-shot prompts for deterministic scripting.
- Use passthrough for advanced commands not exposed by wrappers.
