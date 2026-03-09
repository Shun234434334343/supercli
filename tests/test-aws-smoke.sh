#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${ROOT_DIR}/cli/supercli.js"

echo "== AWS CLI smoke test (interactive) =="

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found in PATH."
  echo "Install it first: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found in PATH"
  exit 1
fi

echo "Installing/refreshing aws plugin..."
node "${CLI}" plugins install aws --on-conflict replace --json >/dev/null

echo "Checking AWS authentication (aws sts get-caller-identity)..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  if [[ ! -t 0 ]]; then
    echo "No working AWS credentials found and no TTY available. Run 'aws configure' manually, then rerun this script."
    exit 1
  fi

  echo "AWS credentials are required for live smoke tests."
  read -r -p "Run 'aws configure' now? [Y/n] " ANSWER
  ANSWER="${ANSWER:-Y}"
  if [[ "${ANSWER}" =~ ^[Yy]$ ]]; then
    aws configure
  else
    echo "Cancelled. Run 'aws configure' and retry when ready."
    exit 1
  fi

  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "AWS authentication check still failed after configure."
    echo "Verify with: aws sts get-caller-identity"
    exit 1
  fi
else
  echo "AWS CLI is already authenticated. Skipping configuration."
fi

echo "Running wrapped command smoke test..."
node "${CLI}" aws account identity --json

echo "Running passthrough smoke test..."
node "${CLI}" aws s3api list-buckets

echo "Smoke test completed."
