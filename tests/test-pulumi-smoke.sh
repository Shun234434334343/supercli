#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Pulumi smoke test (interactive) =="

if ! command -v pulumi >/dev/null 2>&1; then
  echo "Pulumi not found in PATH."
  echo "Install it first: https://www.pulumi.com/docs/iac/download-install/"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing pulumi plugin..."
node "${CLI}" plugins install pulumi --on-conflict replace --json >/dev/null

echo "Checking Pulumi CLI availability (pulumi version)..."
pulumi version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" pulumi cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" pulumi version

echo "Smoke test completed."
