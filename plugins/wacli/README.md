# wacli Plugin Harness

This plugin integrates `wacli` into dcli with safe read-only wrappers for local WhatsApp state and diagnostics.

## Why This Scope

`wacli` manages a personal WhatsApp session and store. The wrapped commands in this plugin are intentionally limited to read-only inspection and diagnostics.

- no auth QR flow wrapper
- no sync loop wrapper
- no send or group mutation wrappers
- no wildcard passthrough in v1

## Prerequisites

Ensure `wacli` is available on your machine:

```bash
wacli --version
```

If you use a non-default store, pass `--store /path/to/store`. The upstream default is `~/.wacli`.

## Available Commands

```bash
# Version and diagnostics
dcli wacli cli version --json
dcli wacli doctor run --json
dcli wacli auth status --json

# Chats and messages
dcli wacli chats list --json
dcli wacli chats show --jid 1234567890@s.whatsapp.net --json
dcli wacli messages list --chat 1234567890@s.whatsapp.net --limit 20 --json
dcli wacli messages search --query meeting --limit 20 --json
dcli wacli messages show --chat 1234567890@s.whatsapp.net --id MSG123 --json
dcli wacli messages context --chat 1234567890@s.whatsapp.net --id MSG123 --before 3 --after 3 --json

# Contacts and groups
dcli wacli contacts search --query alice --json
dcli wacli contacts show --jid 1234567890@s.whatsapp.net --json
dcli wacli groups list --json
dcli wacli groups info --jid 123456789@g.us --json
```

## Notes

- Wrapped commands always request upstream `--json` output and return parsed data in the dcli envelope.
- `wacli` stores session keys and message history under `~/.wacli` by default; treat that directory as sensitive.
- Upstream store locking means read commands can fail if another `wacli` process already holds the same store.
- Use upstream `wacli` directly for interactive auth, sync, send, media download, and group mutation flows.
