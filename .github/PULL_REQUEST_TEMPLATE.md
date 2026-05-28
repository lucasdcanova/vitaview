# Summary

<!--
What does this change do, in one or two sentences?

PR title MUST follow Conventional Commits, English:
  feat(scope): …    fix(scope): …    chore(scope): …    docs(scope): …
  refactor(scope): …  test(scope): …  perf(scope): …  ci(scope): …
Common scopes: agenda, exam-pipeline, prescriptions, certificates,
auth, mfa, billing, vita-assist, security, schema, ios, android, desktop.
-->

## Why

<!-- The clinical, product or operational reason this exists. -->

## How

<!-- Key implementation notes — files touched, design choices, alternatives considered. -->

## Touch surface

- [ ] Frontend (`client/`)
- [ ] Backend (`server/`)
- [ ] Shared schema / contracts (`shared/`)
- [ ] Database migrations (`migrations/`)
- [ ] Mobile (`ios/`, `android/`, `capacitor.config.ts`)
- [ ] Desktop (`desktop/`)
- [ ] Build / CI (`scripts/`, `.github/workflows/`)
- [ ] Docs only

## Checks

- [ ] `npm run check` passes
- [ ] `npm test` passes (or N/A — explain)
- [ ] No new env vars **or** `.env.example` and README updated
- [ ] No secrets, PHI, exam PDFs, cookies or keystores in the diff
- [ ] DB changes ship with a migration and a manual rollback note
- [ ] Backwards-compatible for users already on a paid plan, **or** migration plan in the description

## Screens / videos

<!-- Drop screenshots or short clips for UI changes. -->

## Risks and rollback

<!-- What breaks if this is wrong? How do we revert? -->

## Security

<!--
Anything sensitive in this change? New env var? New external call? New
file under `secrets/` (do not!)? If you touched authn/authz, MFA, WAF,
audit logs, CSP, encryption helpers, or anything that handles patient
data — call it out. Disclosure policy: SECURITY.md.
-->
