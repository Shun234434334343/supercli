# azd and uipath plugins

This feature adds two new bundled plugin harnesses focused on non-interactive automation:

- `azd` for Azure Developer CLI
- `uipath` for UiPath CLI (`uipcli`)

## Why these candidates

- Both tools are active in 2025-2026 and documented for automation and CI/CD usage.
- Both expose command surfaces that map well to supercli process adapters.
- Both are complementary to existing bundled plugins.

## Plugin design

### azd

- Binary check: `azd`
- Curated wrappers:
  - `azd cli version`
  - `azd auth status` (`auth login --check-status --no-prompt`)
  - `azd deploy all` (`deploy --all --no-prompt`)
- Full passthrough: `supercli azd <upstream args...>`

### uipath

- Binary check: `uipcli`
- Curated wrappers:
  - `uipath cli version`
  - `uipath package deploy --path ...` plus common auth flags
- Full passthrough: `supercli uipath <upstream args...>`

## Validation goals

- Wrappers should remain deterministic and suitable for headless execution.
- Passthrough ensures full upstream coverage without waiting for manifest updates.

## Sources

- Azure Developer CLI reference:
  - https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/reference
- UiPath CI/CD release notes (25.10):
  - https://docs.uipath.com/cicd-integrations/standalone/2025.10/release-notes/cliv251003
