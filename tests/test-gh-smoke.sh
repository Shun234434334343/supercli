#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== GitHub CLI smoke test (interactive) =="

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI not found in PATH (expected binary: gh)."
  echo "Install it first: https://cli.github.com/"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing gh plugin..."
node "${CLI}" plugins install gh --on-conflict replace --json >/dev/null

echo "Checking GitHub authentication (gh auth status)..."
if ! gh auth status >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "Not authenticated and no TTY available. Run 'gh auth login' manually, then rerun this script."
    exit 1
  fi

  echo "GitHub login is required for live smoke tests."
  read -r -p "Run 'gh auth login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    gh auth login
  else
    echo "Cancelled. Run 'gh auth login' and retry when ready."
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub authentication check still failed after login."
    echo "Verify with: gh auth status"
    exit 1
  fi
else
  echo "GitHub CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" gh account status --json

echo "Running passthrough smoke test..."
node "${CLI}" gh repo list --limit 1 --json name,nameWithOwner,url

echo "Smoke test completed."
