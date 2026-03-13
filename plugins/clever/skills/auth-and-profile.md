# Clever Auth And Profile Skill

Use this skill when an agent needs to verify Clever Cloud authentication state before performing resource operations.

## Core Checks

Run these first:

```bash
dcli clever cli doctor
dcli clever auth whoami
```

## Non-Interactive Auth Pattern

Prefer environment variables in automation contexts:

```bash
export CLEVER_TOKEN=...
export CLEVER_SECRET=...
```

If tokens are invalid or expired, wrapped commands should fail with a clear rejection message.

## Interpretation Guide

- `doctor` reports runtime and auth state metadata.
- `whoami` confirms account identity and can be used as a preflight gate.
- If auth is invalid, stop and request token refresh rather than retrying blindly.
