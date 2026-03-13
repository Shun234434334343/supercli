---
description: Agent quickstart for using the squirrelscan Docker plugin in supercli.
tags: squirrelscan,seo,audit,docker,plugin,quickstart
---

# SquirrelScan Quickstart

Use this when you need a fast website audit through `supercli`.

## Install and verify

```bash
supercli plugins install ./plugins/squirrelscan --json
supercli plugins doctor squirrelscan --json
```

## Recommended command

```bash
supercli squirrel audit https://example.com -C quick
```

## Structured equivalent

```bash
supercli squirrel audit run --url https://example.com --coverage quick
```

## Useful follow-ups

```bash
supercli squirrel report list
supercli squirrel report show --format llm
supercli squirrel report show --format json --output report.json
```

## Notes

- First run can be slower because the plugin builds a local Docker image.
- Later runs are faster due to local image and volume reuse.
- If you need full CLI behavior not wrapped by structured commands, use passthrough (`supercli squirrel ...`).
