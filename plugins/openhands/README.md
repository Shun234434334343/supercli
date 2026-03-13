# OpenHands Plugin

The OpenHands plugin adds headless automation commands and passthrough support for the OpenHands CLI.

## Install

1. Install OpenHands CLI (`pip install openhands-ai`).
2. Verify installation (`openhands --version`).
3. Install this plugin:

```bash
supercli plugins install openhands
```

## Commands

- `supercli openhands self version`
- `supercli openhands task run --task "..."`
- `supercli openhands task file --file ./task.txt`
- `supercli openhands task json --task "..."`
- `supercli openhands ...` (passthrough)

## Safety Note

OpenHands headless mode runs with always-approve behavior. Use it only in trusted repositories and controlled CI environments.
