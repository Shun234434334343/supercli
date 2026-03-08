// MCP Adapter
// Supports HTTP MCP endpoints and local stdio MCP commands.

const { spawn } = require("child_process");

async function callStdioTool(command, args, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args || [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: !Array.isArray(args) || args.length === 0,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(
        Object.assign(
          new Error(`MCP stdio call timed out after ${timeoutMs}ms`),
          {
            code: 105,
            type: "integration_error",
            recoverable: true,
          },
        ),
      );
    }, timeoutMs);

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        Object.assign(
          new Error(`Failed to start MCP stdio command: ${err.message}`),
          {
            code: 105,
            type: "integration_error",
            recoverable: true,
          },
        ),
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          Object.assign(
            new Error(
              `MCP stdio command exited with code ${code}: ${stderr.trim()}`,
            ),
            {
              code: 105,
              type: "integration_error",
              recoverable: true,
            },
          ),
        );
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(
          Object.assign(
            new Error(`MCP stdio response is not valid JSON: ${stdout.trim()}`),
            {
              code: 105,
              type: "integration_error",
              recoverable: true,
            },
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function resolveHttpServerUrl(config, context) {
  if (config.url) return config.url;

  if (context.config && Array.isArray(context.config.mcp_servers)) {
    const local = context.config.mcp_servers.find(
      (s) => s && s.name === config.server,
    );
    if (local) return local.url;
  }

  if (context.server) {
    const r = await fetch(`${context.server}/api/mcp?format=json`);
    if (!r.ok) {
      throw Object.assign(
        new Error(`Failed to fetch MCP servers list: ${r.status}`),
        {
          code: 105,
          type: "integration_error",
          recoverable: true,
        },
      );
    }
    const servers = await r.json();
    const srv = servers.find((s) => s.name === config.server);
    if (srv) return srv.url;
  }

  throw Object.assign(
    new Error(
      `MCP server '${config.server}' not found in local config. Add one with: supercli mcp add ${config.server} --url <mcp_url> or run supercli sync`,
    ),
    {
      code: 85,
      type: "invalid_argument",
      recoverable: false,
    },
  );
}

async function execute(cmd, flags, context) {
  const config = cmd.adapterConfig || {};
  const toolName = config.tool;
  const hasHttpSource = !!(config.server || config.url);
  const hasStdioSource = !!config.command;

  if (!toolName || (!hasHttpSource && !hasStdioSource)) {
    throw new Error(
      "MCP adapter requires 'tool' and one of: 'server', 'url', or 'command' in adapterConfig",
    );
  }

  const input = {};
  for (const [k, v] of Object.entries(flags)) {
    if (!["human", "json", "compact"].includes(k)) {
      input[k] = v;
    }
  }

  if (hasStdioSource) {
    const commandArgs = Array.isArray(config.commandArgs)
      ? config.commandArgs
      : [];
    const timeoutMs =
      Number(config.timeout_ms) > 0 ? Number(config.timeout_ms) : 10000;
    return callStdioTool(
      config.command,
      commandArgs,
      { tool: toolName, input },
      timeoutMs,
    );
  }

  const resolvedUrl = await resolveHttpServerUrl(config, context);
  const toolUrl = resolvedUrl.replace(/\/+$/, "");
  const tr = await fetch(`${toolUrl}/tool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: toolName, input }),
  });

  if (!tr.ok) {
    const text = await tr.text().catch(() => "");
    throw Object.assign(
      new Error(`MCP tool call failed: ${tr.status} ${text}`),
      {
        code: 105,
        type: "integration_error",
        recoverable: true,
      },
    );
  }

  return tr.json();
}

module.exports = { execute };
