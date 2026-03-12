#!/bin/bash
set -e

# Smoke test for resend plugin
# Usage: ./tests/test-resend-smoke.sh

echo "Running resend smoke test..."

# Setup isolated home
export SUPERCLI_HOME=$(mktemp -d)
trap "rm -rf $SUPERCLI_HOME" EXIT

# 1. Install plugin
node cli/supercli.js plugins install ./plugins/resend --on-conflict replace --json

# 2. Check doctor
node cli/supercli.js plugins doctor resend --json | grep -q '"ok":true'

# 3. Check skills
node cli/supercli.js skills list --catalog --provider resend --json | grep -q "resend:root.readme"

# 4. Check doctor (expect dependency error but valid JSON)
# We expect exit 1 because dep is missing
set +e
OUT=$(node cli/supercli.js resend cli doctor --json 2>&1)
EXIT_CODE=$?
set -e

echo "$OUT" | grep -q "Missing dependency 'resend'"
echo "$OUT" | grep -q "Please run 'dcli resend cli setup'"

echo "Resend smoke test passed!"
