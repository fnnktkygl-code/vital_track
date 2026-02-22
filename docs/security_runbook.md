# Security Runbook

## 1) Release Checklist (Required)

- Ensure no hardcoded API keys exist:
  - CI `Security Scan` workflow must pass.
  - `Deploy Landing Page to GitHub Pages` security gate must pass.
- Verify `.env` is not tracked by Git.
- Verify API key rotation status in Gemini/Google console if any leak occurred.

## 2) Runtime Security Controls

- AI calls require `privacy_consent_accepted=true` in app settings.
- For production, prefer backend proxy:
  - Set `AI_PROXY_BASE_URL` via `--dart-define`.
  - Keep Gemini key only on backend.

## 3) Web Deployment Safety

- CSP is defined in:
  - `web/index.html`
  - `docs/app/index.html`
  - `docs/index.html`
- Do not remove CSP unless replacing with stronger header-based CSP upstream.

## 4) Incident Response (Key Leak)

1. Revoke leaked key immediately.
2. Create a new key with minimum scope/quota.
3. Purge secret from current tree and git history.
4. Force-push rewritten history (if required).
5. Redeploy Pages and verify public JS has no `AIza...`.
6. Document incident and remediation in release notes.

## 5) Recommended Automation

- Keep `gitleaks` in CI on both `push` and `pull_request`.
- Add periodic dependency vulnerability scans.
- Add branch protection requiring passing security workflows.
