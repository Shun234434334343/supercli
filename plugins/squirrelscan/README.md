# SquirrelScan Plugin

Docker-backed SquirrelScan integration for `supercli`.

This plugin builds a pinned image on first use and then reuses it for faster repeat scans.

## Install

```bash
supercli plugins install ./plugins/squirrelscan --json
```

## What You Get

- Native passthrough: `supercli squirrel ...`
- Structured wrappers for major command groups:
  - `audit`, `crawl`, `analyze`, `report`
  - `auth`, `config`, `init`, `feedback`
  - `self`, `settings`, `skills`
- Auto-registered skill docs provider (`squirrelscan`) in the local skills catalog

## First Run vs Later Runs

- First command run builds image `dcli-squirrelscan:0.0.38`.
- Later runs reuse the local image and named volumes:
  - `dcli-squirrelscan-home` (CLI state)
  - `dcli-squirrelscan-cache` (cache)

## Quick Examples

```bash
# passthrough syntax
supercli squirrel audit https://example.com -C quick

# structured syntax
supercli squirrel audit run --url https://example.com --coverage quick
supercli squirrel report list
supercli squirrel report show --format llm
```

## Validate Install

```bash
supercli plugins doctor squirrelscan --json
supercli help squirrel --json
supercli skills list --catalog --provider squirrelscan --json
```
