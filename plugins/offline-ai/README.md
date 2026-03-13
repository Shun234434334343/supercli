# offline-ai Plugin

`offline-ai` wraps `@offline-ai/cli` for script-first, non-interactive usage in supercli.

## Install

```bash
supercli plugins install ./plugins/offline-ai --json
npm install -g @offline-ai/cli
```

## Commands

- `supercli offline-ai cli version`
- `supercli offline-ai script run --entry translator --input '{"file":"./todo.md","target":"en"}'`
- `supercli offline-ai script run-file --file ./scripts/translator.ai --input '{"target":"en"}'`
- `supercli offline-ai <any upstream args...>`

## Notes

- Prefer one-shot `script run` or `script run-file` in CI to avoid interactive sessions.
- Keep payloads deterministic (JSON strings) for repeatable runs.
- Use passthrough for advanced CLI options not exposed in wrappers.
