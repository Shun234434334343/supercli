#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"
LOCAL_RAILWAY_BIN="${ROOT_DIR}/node_modules/.bin/railway"

RAILWAY_CMD=()
RAILWAY_CMD_LABEL=""

resolve_railway_cmd() {
  if command -v railway >/dev/null 2>&1; then
    RAILWAY_CMD=("railway")
    RAILWAY_CMD_LABEL="railway"
    return 0
  fi
  if [[ -x "${LOCAL_RAILWAY_BIN}" ]]; then
    RAILWAY_CMD=("${LOCAL_RAILWAY_BIN}")
    RAILWAY_CMD_LABEL="${LOCAL_RAILWAY_BIN}"
    return 0
  fi
  if npx --no-install railway --help >/dev/null 2>&1; then
    RAILWAY_CMD=("npx" "--no-install" "railway")
    RAILWAY_CMD_LABEL="npx --no-install railway"
    return 0
  fi
  return 1
}

run_railway() {
  "${RAILWAY_CMD[@]}" "$@"
}

echo "== Railway smoke test (interactive) =="

if ! resolve_railway_cmd; then
  echo "Railway CLI not found."
  echo "Checked:"
  echo "  - PATH binary: railway"
  echo "  - Local bin: ${LOCAL_RAILWAY_BIN}"
  echo "  - npx --no-install railway"
  echo "Install one of these and rerun:"
  echo "  npm install -g @railway/cli"
  echo "  npm install -D @railway/cli"
  exit 1
fi

echo "Using Railway command: ${RAILWAY_CMD_LABEL}"

if [[ -x "${LOCAL_RAILWAY_BIN}" ]]; then
  export PATH="$(dirname "${LOCAL_RAILWAY_BIN}"):${PATH}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing railway plugin..."
node "${CLI}" plugins install railway --on-conflict replace --json >/dev/null

echo "Checking Railway authentication (whoami --json)..."
if ! run_railway whoami --json >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "Not authenticated and no TTY available. Run 'railway login' manually, then rerun this script."
    exit 1
  fi

  echo "Railway login is required for live smoke tests."
  read -r -p "Run 'railway login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    run_railway login
  else
    echo "Cancelled. Run 'railway login' and retry when ready."
    exit 1
  fi

  if ! run_railway whoami --json >/dev/null 2>&1; then
    echo "Railway authentication check still failed after login."
    echo "Verify with: ${RAILWAY_CMD_LABEL} whoami --json"
    exit 1
  fi
else
  echo "Railway CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" railway account whoami --json

echo "Running passthrough smoke test..."
node "${CLI}" railway list --json

echo "Smoke test completed."
