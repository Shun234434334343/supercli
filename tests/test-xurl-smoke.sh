#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== xurl smoke test =="

if ! command -v xurl >/dev/null 2>&1; then
  echo "xurl not found in PATH."
  echo "Install it first and verify with: xurl version"
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

echo "Installing/refreshing xurl plugin..."
node "${CLI}" plugins install xurl --on-conflict replace --json >/dev/null

echo "Checking indexed skills..."
node "${CLI}" skills list --catalog --provider xurl --json
node "${CLI}" skills get xurl:root.skill >/dev/null

echo "Running safe wrapped commands..."
node "${CLI}" xurl cli version --json
node "${CLI}" xurl auth status --json
node "${CLI}" xurl apps list --json

if [[ "${XURL_LIVE_READONLY:-}" == "1" ]]; then
  echo "Running optional live read-only commands..."
  node "${CLI}" xurl account whoami --json
  node "${CLI}" xurl posts search --query "from:XDevelopers" --max-results 5 --json
else
  echo "Skipping live read-only calls; set XURL_LIVE_READONLY=1 to enable them."
fi

echo "Smoke test completed."
