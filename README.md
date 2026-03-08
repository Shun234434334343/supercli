# dcli: Universal Cross-Harness CLI Router

Route commands across dozens of popular CLIs (GitHub, AWS, Docker, Kubernetes, Google Workspace, and more) through a unified skills discovery and execution layer.

## BIN Aliases

- dcli (Original CLI)
- supercli (Brand)
- scli (Brand smaller)
- superacli (What was available) (Super Agent/ic CLI)

## What is a Cross-Harness Router?

A **harness** is a bridge to an external CLI tool. dcli acts as a unified **router** for commands and skills across:

- **Bundled Harnesses**: beads (task/issue management), gwc (Google Workspace), commiat (commit automation)
- **Built-in Adapters**: OpenAPI specs, raw HTTP, MCP (Model Context Protocol) servers
- **Plugin Harnesses**: Community-contributed and custom CLIs installed as plugins
- **Future Harnesses**: Popular CLIs like gh (GitHub), aws (AWS), docker, kubectl, etc.

Through a single interface, you can:
1. **Discover** skills across all connected harnesses
2. **Route** commands to the appropriate harness
3. **Execute** with unified output formatting
4. **Extend** by adding new harnesses as plugins

Example: Execute commands across different harnesses with consistent routing:
```bash
supercli beads issue list              # Route to beads harness
supercli gwc drive files list          # Route to Google Workspace harness
supercli docker container ps           # Route to Docker harness (when plugin installed)
```

## Architecture

```
        Web UI (EJS + Vue3 + DaisyUI)
                    │
                REST API
                    │
        Cross-Harness Skills Router
                    │
    ┌───────────────┼─────────────┬──────────────┐
    │               │             │              │
 Bundled         Built-in      Plugin       Community
Harnesses       Adapters      Harnesses     Harnesses
(beads, gwc,   (OpenAPI,    (beads, gwc,   (gh, aws,
 commiat)      HTTP, MCP)    commiat)      docker, etc)
```

The router intelligently:
- **Discovers** available skills from all harnesses
- **Routes** commands to appropriate harnesses based on namespace
- **Executes** with unified error handling and output formatting
- **Caches** skills for fast discovery and AI resolution

## Quick Start

```bash
# Quick usage (no install, local-only by default)
npx supercli help                      # List available harnesses
npx supercli skills teach

# Install
npm install

# Configure (copy and edit)
cp .env.example .env

# Start server (defaults to local JSON files, no MongoDB required!)
npm start
# Or alternatively, start via CLI:
# supercli --server

# Open Web UI
open http://localhost:3000

# CLI usage - Multi-harness routing
supercli help                          # List all harnesses
supercli beads                         # List beads skills
supercli gwc                           # List Google Workspace skills
supercli beads issue list              # Execute beads command
supercli gwc drive files list          # Execute Google Workspace command

# Skills discovery across harnesses
supercli skills list                   # All skills from all harnesses
supercli skills search "database"      # Full-text search across harnesses

# AI-driven multi-harness execution
supercli ask "show my tasks and recent commits"

# Manage plugin harnesses
supercli plugins list
supercli plugins explore               # Browse available plugins
supercli plugins install commiat       # Install community plugin
```

## CLI Usage

### Multi-Harness Routing

```bash
# Basic harness routing
supercli <harness>                          # List skills in harness
supercli <harness> <skill-group> <action>   # Execute skill

# Examples across different harnesses
supercli beads issue create --title "Fix bug"
supercli beads issue list --status open
supercli gwc drive files list --limit 10
supercli commiat validate --commit-msg "my message"

# Discovery
supercli help                              # List all harnesses
supercli skills list                       # List all skills from all harnesses
supercli skills search --harness beads     # Search within harness
supercli skills search "database"          # Full-text search across harnesses

# Inspection
supercli inspect beads issue create        # Command details + schema
supercli skills get beads.issue.create     # Get skill metadata

# Execution
supercli beads issue create --title "New task"      # Standard execution
supercli beads issue list --json                    # JSON output
supercli beads issue list --compact                 # Token-optimized output

# Plans (DAG execution)
supercli plan beads issue create --title "Task"     # Dry-run execution plan
supercli execute <plan_id>                         # Execute stored plan

# Natural Language (AI)
export OPENAI_BASE_URL=https://api.openai.com/v1   # Enable AI resolution
supercli ask "list my tasks and summarize them"     # Execute across harnesses

# Config & Server
supercli sync                              # Sync local cache from server
supercli config show                       # Show cache info
supercli --server                          # Start backend server

# Plugin Harness Management
supercli plugins list                      # List installed harnesses
supercli plugins explore                   # Browse plugin registry
supercli plugins explore --tags git,ai     # Search registry by tags
supercli plugins install commiat           # Install from registry
supercli plugins install --git https://github.com/org/repo.git --ref main
supercli plugins show commiat              # Show harness details
supercli plugins doctor commiat            # Check harness health
```

### Built-in Adapters

```bash
# Local MCP registry (no server required)
supercli mcp list
supercli mcp add summarize-local --url http://127.0.0.1:8787
supercli mcp remove summarize-local

# Stdio MCP demo
node examples/mcp-stdio/install-demo.js
supercli ai text summarize --text "Hello world" --json

# Remote MCP SSE/HTTP demo
node examples/mcp-sse/server.js
node examples/mcp-sse/install-demo.js
supercli ai text summarize_remote --text "Hello world" --json

# Agent capability discovery
supercli --help-json                       # Machine-readable capabilities
```

## Output Modes

| Flag        | Output                                    |
|-------------|-------------------------------------------|
| (default)   | JSON if piped, human-readable if TTY      |
| `--json`    | Structured JSON envelope                  |
| `--human`   | Formatted tables and key-value output     |
| `--compact` | Compressed JSON (shortened keys)          |

## Plugins as Harnesses

A **plugin harness** bridges dcli to an external CLI tool. Each plugin:
- Defines a manifest (`plugin.json`) with available commands
- Maps CLI arguments to dcli's command structure
- Supports either command wrapping (selective commands) or passthrough (full CLI)
- Includes dependency checks and installation guidance

### Currently Supported Harnesses

**Bundled with dcli:**
- **beads** (`br`) — Task/issue management via beads_rust
- **gwc** (`gws`) — Google Workspace CLI with full passthrough
- **commiat** — Commit automation with full passthrough

**Built-in Adapters:**
- **OpenAPI** — Generic OpenAPI spec resolution
- **HTTP** — Raw HTTP requests
- **MCP** — Model Context Protocol tools (stdio and SSE/HTTP)

**Popular Community Harnesses** (via plugins):
- GitHub CLI (`gh`)
- AWS CLI (`aws`)
- Google Cloud CLI (`gcloud`)
- Azure CLI (`az`)
- Docker (`docker`)
- Kubernetes (`kubectl`)
- Terraform (`terraform`)
- npm, pip, cargo (package managers)
- git, git-cliff (version control)
- And many more...

See [docs/supported-harnesses.md](docs/supported-harnesses.md) for the complete list.

### Installing Plugin Harnesses

```bash
# From built-in registry
supercli plugins install commiat

# From GitHub repository
supercli plugins install --git https://github.com/org/plugin-harness.git --ref main

# Local directory (development)
supercli plugins install ./path/to/plugin

# Browse registry
supercli plugins explore
supercli plugins explore --tags "github,ai"
```

### Creating Your Own Harness

Turn any CLI into a dcli harness:

1. Create a `plugin.json` manifest defining commands
2. Specify wrapping or passthrough behavior
3. Include dependency checks and help guidance
4. Test with `supercli plugins install ./path`
5. Publish to registry with `supercli plugins publish`

See [docs/plugin-harness-guide.md](docs/plugin-harness-guide.md) for detailed instructions and examples.

### Planned Harnesses

The dcli community is actively developing plugins for popular CLIs:

- **GitHub Ecosystem**: gh (GitHub CLI), GitHub Actions workflows
- **Cloud Platforms**: aws, gcloud, az CLI tools
- **Container & DevOps**: docker, docker-compose, kubectl, helm, terraform
- **Version Control**: git, git-cliff, commitizen
- **Package Managers**: npm, pip, cargo, pnpm, yarn
- **AI/ML Tools**: huggingface, langchain, LLM CLIs
- **Infrastructure**: ansible, pulumi
- **Monitoring**: datadog, prometheus CLIs
- Many others based on community requests

Want to contribute a plugin harness? [See plugin guide](docs/plugin-harness-guide.md) and submit to the registry!

## Output Envelope

Every command returns a deterministic envelope:

```json
{
  "version": "1.0",
  "command": "namespace.resource.action",
  "duration_ms": 42,
  "data": { ... }
}
```

## Exit Codes

| Code    | Type                | Action                     |
|---------|---------------------|----------------------------|
| 0       | success             | Proceed                    |
| 82      | validation_error    | Fix input                  |
| 85      | invalid_argument    | Fix argument               |
| 92      | resource_not_found  | Try different resource     |
| 105     | integration_error   | Retry with backoff         |
| 110     | internal_error      | Report bug                 |

## API Endpoints

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/config`                 | Full CLI config          |
| GET    | `/api/tree`                   | List namespaces          |
| GET    | `/api/tree/:ns`               | List resources           |
| GET    | `/api/tree/:ns/:res`          | List actions             |
| GET    | `/api/command/:ns/:res/:act`  | Full command spec        |
| CRUD   | `/api/commands`               | Manage commands          |
| CRUD   | `/api/specs`                  | Manage OpenAPI specs     |
| CRUD   | `/api/mcp`                    | Manage MCP servers       |
| CRUD   | `/api/plans`                  | Execution plans          |
| GET    | `/api/jobs`                   | Execution history        |
| GET    | `/api/jobs/stats`             | Aggregate stats          |

## Built-in Harnesses & Adapters

The following are built-in to dcli (no plugins required):

- **http** — Raw HTTP requests (method, url, headers)
- **openapi** — Resolves operation from OpenAPI spec
- **mcp** — Calls MCP server tools (supports both HTTP endpoints and local Stdio processes)
- **beads** — Task/issue management (if br is installed)
- **gwc** — Google Workspace (if gws is installed)
- **commiat** — Commit automation (if commiat is installed)

## Tech Stack

- NodeJS + Express
- Pluggable KV Storage (Local JSON files by default, MongoDB optional)
- EJS + Vue3 CDN + Tailwind CDN + DaisyUI CDN
- Zero build tools
- Extensible plugin system for registering new harnesses
- Support for OpenAPI, HTTP, MCP, and custom CLI adapters

## Contributors

Contributions are welcome! If you have ideas for improvements, new adapters, or bug fixes, just send a Pull Request (PR) and I will review it.

## License

MIT
