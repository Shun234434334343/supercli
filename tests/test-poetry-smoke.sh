#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Poetry smoke test (interactive) =="

if ! command -v poetry >/dev/null 2>&1; then
  echo "Poetry not found in PATH."
  echo "Install it first: https://python-poetry.org/docs/#installation"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing poetry plugin..."
node "${CLI}" plugins install poetry --on-conflict replace --json >/dev/null

echo "Checking Poetry CLI availability (poetry --version)..."
poetry --version >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" poetry cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" poetry --help

echo "Smoke test completed."
