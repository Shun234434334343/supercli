#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== watchexec smoke test (interactive) =="

if ! command -v watchexec >/dev/null 2>&1; then
  echo "watchexec not found in PATH."
  echo "Install it first: https://github.com/watchexec/watchexec"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing watchexec plugin..."
node "${CLI}" plugins install watchexec --on-conflict replace --json >/dev/null

echo "Checking watchexec CLI availability (watchexec --version)..."
watchexec --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" watchexec cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" watchexec --help

echo "Smoke test completed."
