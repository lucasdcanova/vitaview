# Contributing

VitaView is primarily a single-author working repository. The notes below
exist so that an evaluator, a future collaborator, or a future version of
the author can land changes safely.

## Before you commit

- Run `npm run check` — TypeScript across `client`, `server` and `shared` must pass.
- Run `npm test` for the areas you touched.
- Never commit:
  - real patient data, exam PDFs, audio recordings, screenshots with names/CPFs;
  - `.env`, `*.p8`, `*.pem`, `*.keystore`, `keystore.properties`, `GoogleService-Info.plist`, `google-services.json`;
  - cookies dumps, session dumps, OAuth tokens;
  - macOS Finder duplicates (`foo 2.ts`, `foo 3.ts`).

The `.gitignore` covers the obvious cases — when in doubt, run
`git diff --cached` and read the diff before pushing.

## Branching

- Working branches: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `docs/<short-name>`.
- Open PRs against `main`. Direct pushes to `main` are reserved for trivial doc fixes.

## Commits

Conventional Commits, English. Examples:

```
feat(exam-pipeline): add retry with exponential backoff to OpenAI extraction
fix(agenda): preserve clinic context when secretary switches doctor
chore(deps): bump drizzle-orm to 0.39.1
docs(architecture): describe MFA gateway endpoint
```

Co-Authored-By trailers are welcome for AI-assisted commits.

## Database changes

- Drizzle schema lives in `shared/schema.ts`.
- Every breaking change ships with a SQL migration under `migrations/`.
- Include a rollback note in the PR description.
- Verify against a fresh `npm run db:push` on a scratch database before merging.

## Touching clinical surfaces

Modules that issue CFM-regulated documents (prescriptions, certificates,
exam requests) are sensitive — they have legal weight. When changing them:

- Preserve the audit trail (`audit_logs`, `evolutions` on finalize).
- Do not silently change PDF layout — pin a screenshot in the PR.
- Coordinate with the operator running the live clinic before deploying.

## Reporting a security issue

Do not open a public issue. Email the author through
[lucascanova.com.br](https://www.lucascanova.com.br) with the details and
expect an acknowledgement within a few days.
