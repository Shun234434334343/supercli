# OpenHands Quickstart

Use this plugin to run OpenHands in headless automation mode.

## Prerequisites

- Install OpenHands CLI: `pip install openhands-ai`
- Verify CLI: `openhands --version`
- Install plugin: `supercli plugins install openhands`

## Environment Setup

Set these environment variables before running headless tasks:

```bash
export LLM_API_KEY="your-api-key"
export LLM_MODEL="openai/gpt-4o-mini"  # or another model
export LLM_BASE_URL="https://openrouter.ai/api/v1"  # optional
```

## Common Commands

- Version: `supercli openhands self version`
- Headless task: `supercli openhands task run --task "Summarize this repo"`
- Headless task from file: `supercli openhands task file --file ./task.txt`
- JSONL stream mode: `supercli openhands task json --task "Add tests"`

## Smoke Test Example

```bash
# Set environment variables
export LLM_API_KEY="your-openrouter-api-key"
export LLM_MODEL="openai/gpt-4o-mini"
export LLM_BASE_URL="https://openrouter.ai/api/v1"
export PATH="/path/to/venv/bin:$PATH"

# Run a simple task
supercli openhands task run --task "Create a file called test.txt with 'hello world'"
```

## Passthrough

For any unsupported subcommand, use passthrough:

`supercli openhands <raw openhands args>`

## Important

Headless mode is always non-interactive approval. Treat it as high-trust execution.
