#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Azure CLI smoke test (interactive) =="

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI not found in PATH."
  echo "Install it first: https://learn.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing az plugin..."
node "${CLI}" plugins install az --on-conflict replace --json >/dev/null

echo "Checking Azure authentication (az account show)..."
if ! az account show >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "No working Azure login found and no TTY available. Run 'az login' manually, then rerun this script."
    exit 1
  fi

  echo "Azure authentication is required for live smoke tests."
  read -r -p "Run 'az login' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    az login
  else
    echo "Cancelled. Run 'az login' and retry when ready."
    exit 1
  fi

  if ! az account show >/dev/null 2>&1; then
    echo "Azure authentication check still failed after login."
    echo "Verify with: az account show"
    exit 1
  fi
else
  echo "Azure CLI is already authenticated. Skipping login."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" az account show --json

echo "Running passthrough smoke test..."
node "${CLI}" az group list

echo "Smoke test completed."
