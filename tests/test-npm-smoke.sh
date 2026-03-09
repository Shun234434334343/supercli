#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== npm smoke test (interactive) =="

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found in PATH."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing npm plugin..."
node "${CLI}" plugins install npm --on-conflict replace --json >/dev/null

echo "Checking npm CLI availability (npm --version)..."
npm --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" npm cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" npm --help

echo "Smoke test completed."
