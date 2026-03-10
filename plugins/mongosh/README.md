# mongosh Plugin Harness

This plugin integrates the MongoDB shell (`mongosh`) into dcli with wrapped version, ping, and eval commands plus full namespace passthrough.

## Prerequisites

Ensure `mongosh` is available on your machine:

```bash
mongosh --version
```

If you plan to connect to a protected server, provide the usual connection flags or rely on your environment and shell profile.

## Available Commands

### CLI Version (Wrapped)

Returns the mongosh version via `mongosh --version`.

```bash
dcli mongosh cli version --json
```

### Server Ping (Wrapped)

Runs `db.adminCommand({ ping: 1 })` with quiet relaxed JSON output.

```bash
dcli mongosh server ping --host 127.0.0.1 --port 27017 --json
```

### Eval Run (Wrapped)

Runs a JavaScript expression through `mongosh --quiet --json=relaxed --eval`.

```bash
dcli mongosh eval run --javascript "db.runCommand({ buildInfo: 1 })" --json
```

### Full Passthrough

You can run any mongosh command through the `mongosh` namespace.

```bash
# Show help
dcli mongosh --help

# Evaluate directly
dcli mongosh --quiet --json=relaxed --eval "db.adminCommand({ ping: 1 })"
```

## Notes

- This plugin targets `mongosh`, not the legacy `mongo` shell.
- Wrapped commands parse relaxed JSON output when possible; more complex BSON values may still surface as Extended JSON structures.
