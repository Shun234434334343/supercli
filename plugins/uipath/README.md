# uipath Plugin

`uipath` wraps UiPath CLI (`uipcli`) for CI/CD-oriented automation in supercli.

## Install

```bash
supercli plugins install ./plugins/uipath --json
```

Install the upstream CLI (example):

```bash
dotnet tool install --global UiPath.CLI.Linux
uipcli --version
```

## Commands

- `supercli uipath cli version`
- `supercli uipath package deploy --path <artifact-or-project-path> [auth flags]`
- `supercli uipath <any upstream args...>`

## Notes

- The deploy wrapper exposes common external-app auth flags.
- For full CI/CD lifecycle actions, use passthrough commands.
