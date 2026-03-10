# MySQL Plugin Harness

This plugin integrates the MySQL CLI into dcli with a wrapped version command, a batch-friendly query wrapper, and full namespace passthrough.

## Prerequisites

Ensure `mysql` is available on your machine:

```bash
mysql --version
```

If you plan to connect to a remote server, set the usual connection flags or environment variables such as `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_DATABASE`, and `MYSQL_PWD`.

## Available Commands

### CLI Version (Wrapped)

Returns the MySQL client version via `mysql --version`.

```bash
dcli mysql cli version --json
```

### Query Execute (Wrapped)

Runs `mysql --batch --raw --skip-column-names --execute <sql>` so the output stays automation-friendly.

```bash
dcli mysql query execute --execute "select 1" --host 127.0.0.1 --user root --database mysql --json
```

### Full Passthrough

You can run any MySQL CLI command through the `mysql` namespace.

```bash
# Show help
dcli mysql --help

# Run a one-off query directly
dcli mysql --execute "show databases()"
```

## Notes

- The wrapped query command returns raw text output, not parsed JSON.
- Prefer `MYSQL_PWD` or other secure credential mechanisms instead of putting passwords directly in shell history.
