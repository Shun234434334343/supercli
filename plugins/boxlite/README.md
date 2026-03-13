# BoxLite Plugin

This plugin exposes `boxcli` (from `@javimosch/boxlite`) through supercli.

## Install

```bash
supercli plugins install ./plugins/boxlite
```

## Requirements

- `boxcli` binary must be available on `PATH`
- install with npm:

```bash
npm i -g @javimosch/boxlite
```

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
supercli boxlite _ _ exec run my-box -- sh -lc "echo ok"
```
