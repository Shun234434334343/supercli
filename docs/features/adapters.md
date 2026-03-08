# Adapters Integration

DCLI acts as a universal frontend proxy that translates semantic commands (e.g., `aws instances list`) into specific backend protocol requests via adapters.

## Key Features

- **HTTP Adapter**: Directly invokes external REST APIs with configured methods, headers, and interpolated path/query parameters.
- **OpenAPI Adapter**: Given a registered OpenAPI spec URL, maps a DCLI command dynamically to an OpenAPI operation, handling auth and schema resolution on the fly.
- **MCP Adapter (Model Context Protocol)**: Connects to local or remote MCP servers to trigger their exposed tools. Supports both standard HTTP/SSE connections and spinning up local `stdio` child process execution (like `node server.js`).
- **Local MCP Registry**: Decouples MCP tool integration from the backend server by maintaining a local `.dcli_cache.json` registry for fast integration.

## Usage

```bash
# The adapter is chosen when commands are bound. For example MCP management:

# List offline/local MCP servers registered in the config
dcli mcp list

# Add an offline local MCP stdio server
dcli mcp add summarize-local --url http://127.0.0.1:8787

# Execute an MCP tool via the bound alias
dcli ai text summarize --text "Hello world"
```
