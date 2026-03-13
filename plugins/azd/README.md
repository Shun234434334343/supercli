# azd Plugin

`azd` wraps Azure Developer CLI for deterministic automation workflows in supercli.

## Install

```bash
supercli plugins install ./plugins/azd --json
```

Install the upstream CLI:

```bash
brew tap azure/azd && brew install azd
# or follow: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd
```

## Commands

- `supercli azd cli version`
- `supercli azd auth status`
- `supercli azd deploy all --environment <name>`
- `supercli azd <any upstream args...>`

## Notes

- Wrapper commands favor non-interactive behavior via `--no-prompt`.
- Use passthrough for advanced operations not covered by wrappers.
