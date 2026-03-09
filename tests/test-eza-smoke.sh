#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== eza smoke test (interactive) =="

if ! command -v eza >/dev/null 2>&1; then
  echo "eza not found in PATH."
  echo "Install it first: https://eza.rocks"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing eza plugin..."
node "${CLI}" plugins install eza --on-conflict replace --json >/dev/null

echo "Checking eza CLI availability (eza --version)..."
eza --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" eza cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" eza --oneline --color=never

echo "Smoke test completed."
