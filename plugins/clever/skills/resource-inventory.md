# Clever Resource Inventory Skill

Use this skill to inventory Clever Cloud resources through JSON-first wrappers.

## Recommended Sequence

```bash
dcli clever auth whoami
dcli clever apps list
dcli clever addons list
dcli clever tokens list
```

## Why This Sequence

- confirms auth before querying account resources
- collects app and add-on state for deployment planning
- inventories API bridge tokens for integration visibility

## Agent Notes

- Keep responses as structured objects; avoid parsing human-formatted output.
- Treat missing auth as a hard precondition failure.
- Use passthrough only for commands not yet wrapped by the plugin.
