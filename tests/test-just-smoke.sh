#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "== just smoke test (interactive) =="

if ! command -v just >/dev/null 2>&1; then
  echo "just not found in PATH."
  echo "Install it first: https://just.systems"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

cat > "${TMP_DIR}/justfile" <<'EOF'
default:
	@echo smoke-ok
EOF

echo "Installing/refreshing just plugin..."
node "${CLI}" plugins install just --on-conflict replace --json >/dev/null

echo "Checking just CLI availability (just --version)..."
just --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" just cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" just --list --justfile "${TMP_DIR}/justfile"

echo "Smoke test completed."
