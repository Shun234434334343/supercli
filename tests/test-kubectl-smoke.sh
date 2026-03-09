#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== kubectl smoke test (interactive) =="

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found in PATH."
  echo "Install it first: https://kubernetes.io/docs/tasks/tools/"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing kubectl plugin..."
node "${CLI}" plugins install kubectl --on-conflict replace --json >/dev/null

echo "Checking Kubernetes context (kubectl config current-context)..."
if ! kubectl config current-context >/dev/null 2>&1; then
  echo "No active kubectl context found. Configure kubeconfig first, then rerun this script."
  echo "Verify with: kubectl config current-context"
  exit 1
fi

echo "Running wrapped command smoke test..."
node "${CLI}" kubectl config current-context --json

echo "Running passthrough smoke test..."
node "${CLI}" kubectl get pods -o json

echo "Smoke test completed."
