# 2026-05-07 v1-present Service Refactor

## Scope

- Changed only `v1-present/mail-server` and `v1-present/ai-agent`.
- Did not modify `insider-automation`, `v1-new`, or root workspace services.

## Why

The local/independent service layer needed clearer production boundaries: centralized config validation, shared domain constants, reusable request validation, safer deletes, safer draft replacement, and AI utility code that can be tested directly.

## Changes

- Split mail-server environment/config checks into `src/config.js`.
- Split task/client/usage domain constants into `src/lib/domain.js`.
- Split request parsing, validation, async route wrapping, and pagination into `src/lib/http.js`.
- Updated mail-server tests to import real utilities instead of duplicated test-only helper copies.
- Made mailbox/email delete paths remove attachment objects after successful database deletion.
- Made draft replacement transactional: create the new draft first, then delete the replaced draft.
- Split AI utility logic into `ai-agent/utils.py` for cost estimation, truncation, prompt-injection detection, and sliding-window rate limiting.
- Updated AI tests to cover the real utility module.
- Removed Cloudflare Tunnel/R2 wording from independent deployment docs and described storage as MinIO/S3-compatible.

## Verification

- `npm test`
- `node --check src/index.js && node --check src/config.js && node --check src/lib/domain.js && node --check src/lib/http.js`
- `python3 -m py_compile main.py utils.py tests/test_utils.py`
- `python3 -m pytest -q`
