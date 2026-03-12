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

echo "[1/4] Add local stdio MCP server with server-side args/env..."
node "${CLI}" mcp add mock-bridge \
  --command python3 \
  --args-json '["-c","import json, os, sys; payload=json.load(sys.stdin); tool=payload.get(\"tool\"); out={\"tools\":[{\"name\":\"probe\",\"description\":\"Probe tool\"}]} if tool in (\"tools/list\",\"list_tools\",\"tools\") else {\"argv\":sys.argv[1:],\"env\":{\"BROWSER_USE_API_KEY\":os.environ.get(\"BROWSER_USE_API_KEY\"),\"SERVER_ONLY\":os.environ.get(\"SERVER_ONLY\"),\"CMD_ONLY\":os.environ.get(\"CMD_ONLY\")},\"payload\":payload}; print(json.dumps(out))","--server-arg"]' \
  --env-json '{"BROWSER_USE_API_KEY":"server-key","SERVER_ONLY":"1"}' \
  --headers-json '{"X-Server":"1"}' \
  --json >/dev/null

echo "[2/4] Discover tools from configured MCP server..."
TOOLS_JSON="$(node "${CLI}" mcp tools --mcp-server mock-bridge --json)"
python3 - "${TOOLS_JSON}" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
tools = payload.get("tools") or []
assert any(isinstance(t, dict) and t.get("name") == "probe" for t in tools), "probe tool missing"
print("Tool discovery checks passed.")
PY

echo "[3/4] Call tool directly and verify merged args/env reached process..."
RESULT="$(node "${CLI}" mcp call --mcp-server mock-bridge --tool probe --input-json '{"cmd":"1"}' --cmd-arg yes --json)"
python3 - "${RESULT}" <<'PY'
import json
import sys

envelope = json.loads(sys.argv[1])
data = envelope.get("result") or {}
argv = data.get("argv") or []
env = data.get("env") or {}
payload = data.get("payload") or {}

assert "--server-arg" in argv, "missing server-side arg"
assert env.get("SERVER_ONLY") == "1", "missing server env"
assert env.get("BROWSER_USE_API_KEY") == "server-key", "server env mismatch"
assert payload.get("tool") == "probe", "tool mismatch"
assert payload.get("input", {}).get("cmd") == "1", "input-json missing"
print("Direct call checks passed.")
PY

echo "[4/4] Bind tool to command and execute bound alias..."
node "${CLI}" mcp bind --mcp-server mock-bridge --tool probe --as ai.browser.probe --description "Smoke bind" --json >/dev/null
BOUND_RESULT="$(node "${CLI}" ai browser probe --cmd-arg yes --json)"
python3 - "${BOUND_RESULT}" <<'PY'
import json
import sys

envelope = json.loads(sys.argv[1])
data = envelope.get("data") or {}
assert data.get("payload", {}).get("tool") == "probe", "bound tool mismatch"
print("Bind + command execution checks passed.")
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
