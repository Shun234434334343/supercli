---
skill_name: agent-browser.quickstart
description: Agent workflow to install and run agent-browser through supercli with snapshot-ref automation.
tags: agent-browser,browser,automation,playwright,agents
---

# agent-browser Quickstart

Use this when you need deterministic browser automation for agent tasks.

## 1) Install plugin and dependency

```bash
supercli plugins learn agent-browser
supercli plugins install agent-browser --json
supercli agent-browser browser install
```

If the binary is missing, install globally first:

```bash
npm install -g agent-browser
agent-browser install
```

## 2) Validate setup

```bash
supercli agent-browser cli version
```

## 3) Recommended agent workflow

```bash
supercli agent-browser browser open https://example.com
supercli agent-browser browser snapshot
supercli agent-browser click @e1
supercli agent-browser fill @e2 "test@example.com"
supercli agent-browser wait --load networkidle
supercli agent-browser screenshot --annotate
supercli agent-browser browser close
```

## 4) Use passthrough for full command coverage

```bash
supercli agent-browser find role button click --name "Submit"
supercli agent-browser get url
supercli agent-browser diff snapshot
```

## 5) Structured output for tool chains

```bash
supercli agent-browser snapshot --json
supercli agent-browser get text @e1 --json
```
