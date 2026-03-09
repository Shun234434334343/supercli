# Railway Plugin Harness

This plugin integrates the Railway CLI into dcli with one wrapped core command and full namespace passthrough.

## Prerequisites

Install Railway CLI globally or locally:

```bash
# Global install
npm install -g @railway/cli

# Local install in this repo
npm install -D @railway/cli
```

Verify the binary:

```bash
railway --version
# if local only:
npx --no-install railway --version
```

Authenticate before running account or project operations:

```bash
railway login
```

## Available Commands

### Account Whoami (Wrapped)

Returns the currently logged in Railway user via `railway whoami --json`.

```bash
dcli railway account whoami --json
```

### Full Passthrough

You can run any Railway CLI command through the `railway` namespace.

```bash
# List projects
dcli railway list --json

# Show current project status
dcli railway status --json

# Show CLI help
dcli railway --help
```

## Output

Wrapped commands and passthrough responses are returned in dcli envelope format when `--json` is used with dcli-level commands.
