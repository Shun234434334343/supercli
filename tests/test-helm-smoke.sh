#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Helm smoke test (interactive) =="

if ! command -v helm >/dev/null 2>&1; then
  echo "Helm not found in PATH."
  echo "Install it first: https://helm.sh/docs/intro/install/"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing helm plugin..."
node "${CLI}" plugins install helm --on-conflict replace --json >/dev/null

echo "Checking Helm CLI availability (helm version --short)..."
helm version --short >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" helm cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" helm version --short

echo "Smoke test completed."
