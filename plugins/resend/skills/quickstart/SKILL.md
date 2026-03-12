---
skill_name: resend.quickstart
description: Agent workflow to install, setup, authenticate, and send emails via Resend CLI.
tags: resend,email,api,agents,usage
---

# Resend CLI Quickstart

Use this when you need to send emails or check Resend environment health.

## 1) Install the plugin

```bash
supercli plugins install ./plugins/resend --json
```

## 2) Setup the dependency

The plugin requires the official `resend-cli` installed globally via npm.

```bash
supercli resend cli setup
```

## 3) Authenticate

You can provide the API key in three ways (ordered by priority):

### A. Environment Variable (Recommended for Agents/CI)
```bash
export RESEND_API_KEY=re_xxx
```

### B. Command Flag
```bash
supercli resend emails send --api-key re_xxx ...
```

### C. Persistent Login
```bash
supercli resend login --key re_xxx
```

## 4) Verify health

```bash
supercli resend cli doctor --json
```

## 5) Send an email

```bash
supercli resend emails send \
  --from "you@yourdomain.com" \
  --to "recipient@example.com" \
  --subject "Hello from SuperCLI" \
  --text "Body text here" \
  --json
```

For HTML emails, use `--html "<h1>Hello</h1>"` or `--html-file ./path/to/file.html`.
