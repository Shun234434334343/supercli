#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Vercel smoke test (interactive) =="

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it first: https://vercel.com/docs/cli"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing vercel plugin..."
node "${CLI}" plugins install vercel --on-conflict replace --json >/dev/null

echo "Checking Vercel authentication (vercel whoami)..."
if ! vercel whoami >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "Not authenticated and no TTY available. Run 'vercel login' manually, then rerun this script."
    exit 1
  fi

  echo "Vercel login is required for live smoke tests."
  read -r -p "Run 'vercel login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    vercel login
  else
    echo "Cancelled. Run 'vercel login' and retry when ready."
    exit 1
  fi

  if ! vercel whoami >/dev/null 2>&1; then
    echo "Vercel authentication check still failed after login."
    echo "Verify with: vercel whoami"
    exit 1
  fi
else
  echo "Vercel CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" vercel account whoami --json

echo "Running passthrough smoke test..."
node "${CLI}" vercel --version

echo "Smoke test completed."
