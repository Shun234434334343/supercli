# OpenHands Quickstart

Use this plugin to run OpenHands in headless automation mode.

## Prerequisites

- Install OpenHands CLI: `pip install openhands-ai`
- Verify CLI: `openhands --version`
- Install plugin: `supercli plugins install openhands`

## Common Commands

- Version: `supercli openhands self version`
- Headless task: `supercli openhands task run --task "Summarize this repo"`
- Headless task from file: `supercli openhands task file --file ./task.txt`
- JSONL stream mode: `supercli openhands task json --task "Add tests"`

## Passthrough

For any unsupported subcommand, use passthrough:

`supercli openhands <raw openhands args>`

## Important

Headless mode is always non-interactive approval. Treat it as high-trust execution.
