#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== pnpm smoke test (interactive) =="

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found in PATH."
  echo "Install it first: https://pnpm.io/installation"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing pnpm plugin..."
node "${CLI}" plugins install pnpm --on-conflict replace --json >/dev/null

echo "Checking pnpm CLI availability (pnpm --version)..."
pnpm --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" pnpm cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" pnpm --help

echo "Smoke test completed."
