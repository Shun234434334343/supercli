#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== Terraform smoke test (interactive) =="

if ! command -v terraform >/dev/null 2>&1; then
  echo "Terraform not found in PATH."
  echo "Install it first: https://developer.hashicorp.com/terraform/install"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing terraform plugin..."
node "${CLI}" plugins install terraform --on-conflict replace --json >/dev/null

echo "Checking Terraform CLI availability (terraform version -json)..."
terraform version -json >/dev/null

echo "Running wrapped command smoke test..."
node "${CLI}" terraform cli version --json

echo "Running passthrough smoke test..."
node "${CLI}" terraform version -json

echo "Smoke test completed."
