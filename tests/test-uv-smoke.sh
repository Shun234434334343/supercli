#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== uv smoke test (interactive) =="

if ! command -v uv >/dev/null 2>&1; then
  echo "uv not found in PATH."
  echo "Install it first: https://docs.astral.sh/uv/getting-started/installation/"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing uv plugin..."
node "${CLI}" plugins install uv --on-conflict replace --json >/dev/null

echo "Checking uv CLI availability (uv --version)..."
uv --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" uv cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" uv --help

echo "Smoke test completed."
