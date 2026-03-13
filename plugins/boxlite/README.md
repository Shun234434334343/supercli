# BoxLite Plugin

This plugin exposes `boxcli` (from `@javimosch/boxlite`) through a Docker runner in supercli.

## Install

```bash
supercli plugins install ./plugins/boxlite
```

## Requirements

- `docker`
- `node`

On first command run, the plugin builds `dcli-boxlite:1.1.0` and reuses it afterward.

## Commands

```bash
supercli boxlite capabilities show --json
supercli boxlite runtime info --json
supercli boxlite image list --json
supercli boxlite image pull alpine:latest --json
supercli boxlite image exists alpine:latest --json
supercli boxlite box list --json
supercli boxlite box get my-box --json
supercli boxlite box create --image alpine:latest --name my-box --json
supercli boxlite box remove my-box --if-exists --json
```

For advanced flows (for example `exec run` with `--` separator), use passthrough:

```bash
supercli boxlite exec run my-box -- sh -lc "echo ok"
```
