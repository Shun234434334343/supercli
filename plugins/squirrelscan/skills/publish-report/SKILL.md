---
description: Authenticate and publish squirrelscan reports from supercli.
tags: squirrelscan,auth,publish,report,visibility
---

# Publish Reports

Use this when you need to publish audit results to SquirrelScan reports.

## Authenticate

```bash
supercli squirrel auth login
supercli squirrel auth status
```

## Publish latest report

```bash
supercli squirrel report publish
```

## Publish with visibility

```bash
supercli squirrel report publish --visibility unlisted
```

## Logout

```bash
supercli squirrel auth logout
```
