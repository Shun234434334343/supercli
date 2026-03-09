# Linear Plugin Harness

This plugin integrates the community Linear CLI (`@schpet/linear-cli`) into dcli with one wrapped core command and full namespace passthrough.

## Prerequisites

Install the community CLI package (global or local):

```bash
# Global install
npm install -g @schpet/linear-cli

# Local install in this repo
npm install -D @schpet/linear-cli
```

Verify the binary:

```bash
linear --version
# if local only:
npx --no-install linear --version
```

Note: `dcli plugins doctor linear` checks for `linear` on `PATH`; local-only installs can still be used in smoke tests through `npx --no-install linear`.

Authenticate before running account or issue operations:

```bash
linear auth login
```

## Available Commands

### Account Whoami (Wrapped)

Returns the currently logged in Linear account user (`linear auth whoami`).

```bash
dcli linear account whoami --json
```

### Full Passthrough

You can run any Linear CLI command through the `linear` namespace.

```bash
# Show CLI help
dcli linear --help

# Show current user via passthrough
dcli linear auth whoami

# List issues (some setups require sort)
dcli linear issue list --sort manual
```

## Output

Wrapped commands and passthrough responses are returned in dcli envelope format when `--json` is used with dcli-level commands.
