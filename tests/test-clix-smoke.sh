#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== clix smoke test =="

if ! command -v clix >/dev/null 2>&1; then
  echo "clix not found in PATH."
  echo "Install it first and verify with: clix auth status --json"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl not found in PATH"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing clix plugin..."
node "${CLI}" plugins install clix --on-conflict replace --json >/dev/null

echo "Checking indexed skills..."
node "${CLI}" skills list --catalog --provider clix --json
node "${CLI}" skills get clix:root.skill >/dev/null

echo "Running safe wrapped commands..."
node "${CLI}" clix auth status --json

if [[ "${CLIX_LIVE_READONLY:-}" == "1" ]]; then
  echo "Running optional live read-only commands..."
  node "${CLI}" clix timeline list --count 10 --json
  node "${CLI}" clix posts search --query "from:openai" --count 10 --json
else
  echo "Skipping live read-only calls; set CLIX_LIVE_READONLY=1 to enable them."
fi

echo "Smoke test completed."
