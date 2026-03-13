# UiPath CLI Plugin

The UiPath CLI plugin adds common automation lifecycle wrappers and passthrough support for `uipcli`.

## Install

1. Download/extract the UiPath CLI package for your OS.
2. Ensure `uipcli` is on `PATH`, or set `UIPCLI_DLL` and have `dotnet` installed.
3. Install plugin:

```bash
supercli plugins install uipathcli
```

## Commands

- `supercli uipath self version`
- `supercli uipath project pack`
- `supercli uipath project analyze`
- `supercli uipath project deploy`
- `supercli uipath ...` (passthrough)

## Runtime Resolution

The plugin uses this runtime order:

1. `uipcli` from `PATH`
2. `dotnet $UIPCLI_DLL`
