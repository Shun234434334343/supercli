#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"
LOCAL_SUPABASE_BIN="${ROOT_DIR}/node_modules/.bin/supabase"

SUPABASE_CMD=()
SUPABASE_CMD_LABEL=""

resolve_supabase_cmd() {
  if command -v supabase >/dev/null 2>&1; then
    SUPABASE_CMD=("supabase")
    SUPABASE_CMD_LABEL="supabase"
    return 0
  fi
  if [[ -x "${LOCAL_SUPABASE_BIN}" ]]; then
    SUPABASE_CMD=("${LOCAL_SUPABASE_BIN}")
    SUPABASE_CMD_LABEL="${LOCAL_SUPABASE_BIN}"
    return 0
  fi
  if npx --no-install supabase --help >/dev/null 2>&1; then
    SUPABASE_CMD=("npx" "--no-install" "supabase")
    SUPABASE_CMD_LABEL="npx --no-install supabase"
    return 0
  fi
  return 1
}

run_supabase() {
  "${SUPABASE_CMD[@]}" "$@"
}

echo "== Supabase smoke test (interactive) =="

if ! resolve_supabase_cmd; then
  echo "Supabase CLI not found."
  echo "Checked:"
  echo "  - PATH binary: supabase"
  echo "  - Local bin: ${LOCAL_SUPABASE_BIN}"
  echo "  - npx --no-install supabase"
  echo "Install one of these and rerun:"
  echo "  npm install -g supabase"
  echo "  npm install -D supabase"
  exit 1
fi

echo "Using Supabase command: ${SUPABASE_CMD_LABEL}"

if [[ -x "${LOCAL_SUPABASE_BIN}" ]]; then
  export PATH="$(dirname "${LOCAL_SUPABASE_BIN}"):${PATH}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing supabase plugin..."
node "${CLI}" plugins install supabase --on-conflict replace --json >/dev/null

echo "Checking Supabase authentication (projects list)..."
if ! run_supabase projects list --output json >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "Not authenticated and no TTY available. Run 'supabase login' manually, then rerun this script."
    exit 1
  fi

  echo "Supabase login is required for live smoke tests."
  read -r -p "Run 'supabase login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    run_supabase login
  else
    echo "Cancelled. Run 'supabase login' and retry when ready."
    exit 1
  fi

  if ! run_supabase projects list --output json >/dev/null 2>&1; then
    echo "Supabase authentication check still failed after login."
    echo "Verify with: ${SUPABASE_CMD_LABEL} projects list --output json"
    exit 1
  fi
else
  echo "Supabase CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" supabase projects list --json

echo "Running passthrough smoke test..."
node "${CLI}" supabase --help

echo "Smoke test completed."
