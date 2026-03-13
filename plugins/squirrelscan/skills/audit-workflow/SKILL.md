---
description: Run crawl/analyze/report workflow with squirrelscan using supercli.
tags: squirrelscan,audit,crawl,analyze,report,workflow
---

# SquirrelScan Audit Workflow

Use this to separate crawling, analysis, and reporting.

## Crawl only

```bash
supercli squirrel crawl run --url https://example.com --max-pages 200
```

## Analyze latest crawl

```bash
supercli squirrel analyze run
```

## View and export report

```bash
supercli squirrel report show --format markdown --output report.md
supercli squirrel report show --severity error
```

## Compare regressions

```bash
supercli squirrel report show --regression-since https://example.com --format llm
```
