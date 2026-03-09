#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== nextest smoke test (interactive) =="

if ! command -v cargo-nextest >/dev/null 2>&1; then
  echo "cargo-nextest not found in PATH."
  echo "Install it first: https://nexte.st"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing nextest plugin..."
node "${CLI}" plugins install nextest --on-conflict replace --json >/dev/null

echo "Checking cargo-nextest CLI availability (cargo-nextest --version)..."
cargo-nextest --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" nextest cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" nextest --help

echo "Smoke test completed."
