#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Google Cloud CLI smoke test (interactive) =="

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud not found in PATH."
  echo "Install it first: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing gcloud plugin..."
node "${CLI}" plugins install gcloud --on-conflict replace --json >/dev/null

echo "Checking Google Cloud authentication (gcloud auth list --format=json)..."
if ! gcloud auth list --format=json >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "No working gcloud auth found and no TTY available. Run 'gcloud auth login' manually, then rerun this script."
    exit 1
  fi

  echo "Google Cloud authentication is required for live smoke tests."
  read -r -p "Run 'gcloud auth login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    gcloud auth login
  else
    echo "Cancelled. Run 'gcloud auth login' and retry when ready."
    exit 1
  fi

  if ! gcloud auth list --format=json >/dev/null 2>&1; then
    echo "Google Cloud authentication check still failed after login."
    echo "Verify with: gcloud auth list --format=json"
    exit 1
  fi
else
  echo "Google Cloud CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" gcloud account list --json

echo "Running passthrough smoke test..."
node "${CLI}" gcloud projects list --format=json

echo "Smoke test completed."
