#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

API_KEY=""
if [[ "${1:-}" == "--api-key" ]]; then
  API_KEY="${2:-}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found in PATH"
  exit 1
fi

TMP_HOME="$(mktemp -d)"
cleanup() {
  rm -rf "${TMP_HOME}"
}
trap cleanup EXIT

echo "== MCP browser-use smoke test =="
echo "Using isolated HOME: ${TMP_HOME}"

export HOME="${TMP_HOME}"

echo "[1/3] Add local stdio MCP server with server-side args/env..."
node "${CLI}" mcp add mock-bridge \
  --command python3 \
  --args-json '["-c","import json, os, sys; payload=json.load(sys.stdin); out={\"argv\": sys.argv[1:], \"env\": {\"BROWSER_USE_API_KEY\": os.environ.get(\"BROWSER_USE_API_KEY\"), \"SERVER_ONLY\": os.environ.get(\"SERVER_ONLY\"), \"CMD_ONLY\": os.environ.get(\"CMD_ONLY\")}, \"payload\": payload}; print(json.dumps(out))","--server-arg"]' \
  --env-json '{"BROWSER_USE_API_KEY":"server-key","SERVER_ONLY":"1"}' \
  --headers-json '{"X-Server":"1"}' \
  --json >/dev/null

echo "[2/3] Inject command using named MCP server + client-side args/env..."
python3 - "${HOME}/.supercli/config.json" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

cmd = {
    "_id": "command:ai.browser.probe",
    "namespace": "ai",
    "resource": "browser",
    "action": "probe",
    "description": "Smoke: MCP merge wiring",
    "adapter": "mcp",
    "adapterConfig": {
        "server": "mock-bridge",
        "tool": "probe",
        "args": ["--cmd-arg"],
        "env": {
            "BROWSER_USE_API_KEY": "cmd-key",
            "CMD_ONLY": "1"
        },
        "headers": {
            "X-Cmd": "1"
        }
    },
    "args": []
}

commands = cfg.get("commands") or []
found = False
for i, existing in enumerate(commands):
    if (
        isinstance(existing, dict)
        and existing.get("namespace") == "ai"
        and existing.get("resource") == "browser"
        and existing.get("action") == "probe"
    ):
        commands[i] = cmd
        found = True
        break

if not found:
    commands.append(cmd)

cfg["commands"] = commands
with open(path, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent=2)
PY

echo "[3/3] Execute command and assert merged args/env reached process..."
RESULT="$(node "${CLI}" ai browser probe --json)"
python3 - "${RESULT}" <<'PY'
import json
import sys

envelope = json.loads(sys.argv[1])
data = envelope.get("data") or {}
argv = data.get("argv") or []
env = data.get("env") or {}
payload = data.get("payload") or {}

assert "--server-arg" in argv, "missing server-side arg"
assert "--cmd-arg" in argv, "missing client-side arg"
assert env.get("SERVER_ONLY") == "1", "missing server env"
assert env.get("CMD_ONLY") == "1", "missing client env"
assert env.get("BROWSER_USE_API_KEY") == "cmd-key", "client env should override server env"
assert payload.get("tool") == "probe", "tool mismatch"
print("Merged stdio args/env execution checks passed.")
PY

if [[ -n "${API_KEY}" ]]; then
  echo "Optional browser-use config check with provided API key..."
  node "${CLI}" mcp add browser-use \
    --command npx \
    --args-json "[\"mcp-remote\",\"https://api.browser-use.com/mcp\",\"--header\",\"X-Browser-Use-API-Key: ${API_KEY}\"]" \
    --env-json "{\"BROWSER_USE_API_KEY\":\"${API_KEY}\"}" \
    --json >/dev/null

  LIST_JSON="$(node "${CLI}" mcp list --json)"
  python3 - "${LIST_JSON}" <<'PY'
import json
import sys

rows = (json.loads(sys.argv[1]) or {}).get("mcp_servers") or []
browser = next((r for r in rows if isinstance(r, dict) and r.get("name") == "browser-use"), None)
assert browser is not None, "browser-use server not found"
assert browser.get("command") == "npx", "browser-use command mismatch"
args = browser.get("args") or []
assert len(args) >= 2 and args[0] == "mcp-remote", "browser-use args missing mcp-remote"
assert args[1] == "https://api.browser-use.com/mcp", "browser-use URL mismatch"
print("browser-use registration checks passed.")
PY
else
  echo "Skipping browser-use API-key registration check (pass --api-key <key> to enable)."
fi

echo "Smoke test completed."
