# BoxLite Plugin

This plugin exposes `boxcli` (from `@javimosch/boxlite`) through a Docker runner in supercli.

Status: **experimental**.

## Install

```bash
supercli plugins install ./plugins/boxlite
```

## Requirements

- `docker`
- `node`

On first command run, the plugin builds `dcli-boxlite:1.1.0` and reuses it afterward.

## What currently works

- Plugin install and discovery in supercli (`plugins install`, `plugins show`, `plugins doctor`)
- Docker image build and reuse via `scripts/run-boxlite.js`
- Command routing and passthrough wiring (`supercli boxlite ...` and `supercli boxlite exec run ...` command shape)

## Current blockers

- End-to-end VM execution is currently blocked in Docker-backed mode.
- Native Node binding loading fails while starting `@javimosch/boxlite` in this path.
- Most recent concrete failure: native `.node` load chain ends with symbol error (`krun_free_ctx`) and falls back to generic "Cannot find native binding".

## What does not work yet

- Reliable `box create` + `exec run` workflows for actual guest execution
- Verified Python/JS execution inside BoxLite isolation from supercli plugin path
- Human-ready stable behavior for runtime/image/box/exec command set in Docker-backed mode

## Next focus

- Fix native binding/runtime linking in Docker-backed plugin execution path.
- Re-run manual e2e validation (`box create`, shell exec, Python exec, JS exec, isolation checks).
- Keep publish strategy blocked until e2e execution is verified from supercli.

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
