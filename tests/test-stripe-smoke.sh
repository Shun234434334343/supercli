#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Stripe smoke test (interactive) =="

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI not found. Install it first: https://docs.stripe.com/stripe-cli"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing stripe plugin..."
node "${CLI}" plugins install stripe --on-conflict replace --json >/dev/null

echo "Checking Stripe authentication (stripe customers list --limit 1)..."
if ! stripe customers list --limit 1 >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "Not authenticated and no TTY available. Run 'stripe login' manually, then rerun this script."
    exit 1
  fi

  echo "Stripe login is required for live smoke tests."
  read -r -p "Run 'stripe login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    stripe login
  else
    echo "Cancelled. Run 'stripe login' and retry when ready."
    exit 1
  fi

  if ! stripe customers list --limit 1 >/dev/null 2>&1; then
    echo "Stripe authentication check still failed after login."
    echo "Verify with: stripe customers list --limit 1"
    exit 1
  fi
else
  echo "Stripe CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" stripe customers list --limit 1 --json

echo "Running passthrough smoke test..."
node "${CLI}" stripe version

echo "Smoke test completed."
