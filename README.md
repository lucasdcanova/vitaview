# VitaView AI

> Clinical AI platform: AI-powered EHR, scheduling, exam interpretation and a clinical copilot — built by a practicing surgeon for surgeons, clinicians and clinics.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-in%20production-success.svg)](#status)
[![iOS](https://img.shields.io/badge/iOS-App%20Store-black.svg?logo=apple)](https://apps.apple.com/app/id6759616689)
[![Stack](https://img.shields.io/badge/stack-TypeScript%20%7C%20React%20%7C%20Node%20%7C%20Postgres-3178c6.svg)](#stack)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8.svg)](#mobile--pwa)
[![Security policy](https://img.shields.io/badge/security-policy-red.svg)](SECURITY.md)

## Status

**In production · iOS published on the App Store · Android/desktop builds in active development.**

- **Web app + PWA** — primary surface, served from a unified Express server.
- **iOS** — Capacitor build live on the App Store (`6759616689`, bundle `br.com.lucascanova.vitaview`).
- **Android** — Capacitor build, distribution staged via Google Play track.
- **Desktop** — Electron shells for macOS and Windows under `desktop/`.

## What it is

VitaView is a clinical operating layer that consolidates the day-to-day of a clinic — appointments, triage, longitudinal patient records, clinical documents (prescriptions, certificates, exam requests), exam ingestion + AI interpretation, billing — and embeds AI where it removes friction (transcribing the consultation, structuring anamnesis, scheduling from natural language, interpreting bloodwork, answering clinical questions in context of the active patient).

It is multi-tenant from the schema up: every clinic gets its own team, members, invitations, plans, usage limits and audit trail.

## Why it exists

Brazilian clinicians spend hours a week re-typing what an exam PDF already says, re-asking a patient what was already documented, and stitching together appointments, prescriptions and documents across three or four tools. VitaView treats the patient timeline as the source of truth and uses AI to do the structuring work that doesn't need a human.

Built by [Lucas Dickel Canova, MD](https://www.lucascanova.com.br) — a practicing surgeon and endoscopist (CRM 46.242 · RQE 39.549) running two clinics — every module exists because a real consult needed it.

## Architecture

```
            ┌──────────────────────────────────────────────────────┐
            │           Client (React + Vite + Wouter)             │
            │   PWA · iOS (Capacitor) · Android · Electron shells  │
            └──────────────┬──────────────────────────┬────────────┘
                           │ React Query              │ Service Worker
                           ▼                          ▼
            ┌──────────────────────────────────────────────────────┐
            │     Express server (single process, port 3000)       │
            │  ┌─────────────────────────────────────────────────┐ │
            │  │ Middleware: helmet · WAF · rate-limit · CSP ·   │ │
            │  │ ensureTenant · Passport session · audit log     │ │
            │  └─────────────────────────────────────────────────┘ │
            │  ┌─────────────┬───────────────┬───────────────────┐ │
            │  │ Auth/MFA    │ Clinical API  │ Documents · IA    │ │
            │  │ TOTP+WebAuthn│ Patients,    │ Prescriptions,    │ │
            │  │             │ Agenda, Exams │ Atestados, TUSS   │ │
            │  └─────────────┴───────────────┴───────────────────┘ │
            │  ┌─────────────┬───────────────┬───────────────────┐ │
            │  │ Stripe      │ AI pipeline   │ S3 storage        │ │
            │  │ subs+webhook│ (OpenAI)      │ (multer-s3)       │ │
            │  └─────────────┴───────────────┴───────────────────┘ │
            └──────────────┬──────────────────────────┬────────────┘
                           │ Drizzle ORM              │
                           ▼                          ▼
                  ┌────────────────┐         ┌─────────────────┐
                  │ Postgres (Neon)│         │ OpenAI / Stripe │
                  │  46 tables     │         │ SMTP · AWS S3   │
                  └────────────────┘         └─────────────────┘
```

A snapshot of the live surface (regenerated from a code scan):

| Surface | Count |
|---|---:|
| Frontend routes (`client/src/App.tsx`) | 31 |
| Protected routes (authenticated area) | 23 |
| HTTP handlers (`server/routes/*`, `auth.ts`, `routes.ts`) | 191 |
| Unique `/api` endpoints | 162 |
| Drizzle tables (`shared/schema.ts`) | 46 |
| Vitest unit/integration test files | 6 |

A full module-by-module breakdown lives in [`docs/SYSTEM_INVENTORY.md`](docs/SYSTEM_INVENTORY.md) (PT-BR).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript · Vite 5 · Wouter · TanStack Query · Tailwind · Radix UI / shadcn · Recharts · Framer Motion |
| Backend | Node.js · Express 4 · Passport (local) · `express-session` · `connect-pg-simple` · Helmet · `express-rate-limit` |
| Data | PostgreSQL (Neon serverless) · Drizzle ORM · Drizzle Kit migrations |
| AI | OpenAI (extraction, vision, transcription, chat) with a model router + AI cost log |
| Payments | Stripe (subscriptions, billing portal, raw-body webhook) · Apple StoreKit (in-app purchase server library) |
| Storage | AWS S3 via `multer-s3` and presigned URLs |
| Auth & MFA | Passport local · WebAuthn (biometric) · TOTP (`speakeasy`) · MFA gateway endpoint |
| Security | In-process WAF · CSP + violation reporter · medical-grade encryption helpers · intrusion detection · audit trail |
| Mobile | Capacitor 8 (iOS, Android) — Xcode Cloud + `app-store-connect` CLI for releases |
| Desktop | Electron shells (macOS + Windows) under `desktop/`, packaged via GitHub Actions |
| Tests | Vitest · Testing Library · MSW · jsdom |
| Marketing | Remotion video pipeline under `remotion/`; SSR landing prerender via `scripts/prerender-landing.mjs` |

## Modules at a glance

- **Agenda & triage** — calendar, blocks, waiting room, AI-assisted scheduling from natural language, structured triage records with batch creation.
- **Patient record** — diagnoses (ICD-10), surgeries, evolutions (CFM-compliant finalization), habits, allergies, continuous medications with interaction checks, longitudinal `/health-trends` view.
- **Exam pipeline** — multi-file upload → OpenAI vision extraction → structured persistence → analysis/interpretation → derived health metrics → PDF report.
- **Clinical documents** — prescriptions (acute + continuous + renewal), CFM certificates with templates, exam requests with reusable protocols, TUSS catalog search, PDF generation server-side.
- **Vita Assist** — patient-scoped clinical copilot with persisted conversations and per-conversation context.
- **Voice consult** — audio transcription → structured anamnesis → record enrichment.
- **Multi-tenant clinic** — clinic creation, role-based memberships (admin/member/secretary), email + code invitations, per-plan access rules.
- **Billing** — Stripe subscriptions (solo/clinic/hospital · monthly/semestral/annual), portal, plan-based upload limits, free-tier handling, AI usage and cost dashboards.
- **Security & compliance** — TOTP + WebAuthn MFA, in-process WAF with whitelist/blacklist and toggleable rules, encrypted backups, CSP violation reporter, audit logs, LGPD data export and account deletion.
- **PWA** — installable, `start_url` `/auth`, service worker with stale-while-revalidate for assets and network-first for API.

## Quick start

```bash
git clone https://github.com/lucasdcanova/vitaview.ai.git
cd vitaview.ai
npm install
cp .env.example .env   # fill in real values — see "Environment" below
npm run db:push        # apply Drizzle schema to your Postgres
npm run dev            # unified server on http://localhost:3000
```

> The Express server hosts both the API and the Vite dev frontend on **port 3000**.

### Common scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Express + Vite middleware) |
| `npm run build` | Vite build + landing prerender + esbuild bundle of the server |
| `npm run start` | Run the production bundle from `dist/` |
| `npm run check` | `tsc --noEmit` type check across client + server + shared |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm test` / `test:ui` / `test:coverage` | Vitest |
| `npm run stripe:validate` / `stripe:sync` | Inspect / sync Stripe products and prices |
| `npm run ios:build:app-store` / `ios:publish:app-store` | iOS release pipeline |
| `npm run desktop:dev` / `desktop:dist:mac` / `desktop:dist:win` | Electron shells |

### Verify the build

A reviewer who cloned this repo can convince themselves it is real in
about five minutes, without an OpenAI key or a Stripe account:

```bash
# 1. type check the entire workspace
npm run check                # tsc --noEmit across client/, server/, shared/

# 2. run the unit + integration tests that do not need network
npm test -- --run            # Vitest, ~6 files, MSW for HTTP

# 3. produce the production bundle
npm run build                # Vite + landing prerender + esbuild server bundle
ls -lh dist/                 # client + server output

# 4. start the bundle against a scratch Postgres (DATABASE_URL only)
DATABASE_URL=postgres://… npm run start
```

`npm run check` is the same gate enforced by `CONTRIBUTING.md`. The
server boots without OpenAI, Stripe, S3 or SMTP — those features
disable gracefully when their env vars are absent.

## Environment

Required env vars (no values committed — use `.env`, never push it).

**Core**

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — required by `setupAuth`
- `PORT` (default `3000`), `NODE_ENV`

**OpenAI**

- `OPENAI_API_KEY`
- `OPENAI_GPT5_MODEL`, `OPENAI_ANALYSIS_MODEL`, `OPENAI_FALLBACK_MODEL`
- `OPENAI_ANALYSIS_MAX_OUTPUT_TOKENS`

**Stripe**

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLIC_KEY`
- `APP_URL` (used for portal return URLs)

**Email (invitations + password reset)**

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM`

**Storage (S3, optional)**

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `AWS_S3_BUCKET` (or `AWS_S3_BUCKET_NAME`)

**Security / backup (advanced)**

- `HTTP_PORT`, `HTTPS_PORT`, `SSL_CERT_PATH`, `SSL_KEY_PATH`, `SSL_CHAIN_PATH`, `SSL_DH_PATH`, `DOMAIN`
- `LOG_LEVEL`
- `BACKUP_DIR`, `OFFSITE_BACKUP_DIR`, `BACKUP_MASTER_KEY`
- `MASTER_KEY`, `MASTER_ENCRYPTION_KEY`, `ENCRYPTION_SALT`, `SALT_SEED`

For the operational rationale of each variable, see [`docs/SYSTEM_INVENTORY.md`](docs/SYSTEM_INVENTORY.md).

## Repository layout

| Path | What lives here | Status |
|---|---|---|
| `client/` | React + Vite SPA, PWA manifest, service worker, Capacitor entrypoint | Live |
| `server/` | Express monolith — routes, auth, MFA, WAF, AI pipeline, Stripe webhooks | Live |
| `shared/` | Drizzle schema (46 tables), cross-cutting types, billing math | Live |
| `migrations/` | Drizzle Kit and hand-written SQL migrations | Live |
| `scripts/` | Build, release, seed, validation and ops scripts (TS + Node) | Live |
| `desktop/` | Electron shells (macOS + Windows), packaged via GitHub Actions | Active development |
| `ios/` | Capacitor 8 iOS project — Xcode Cloud target for App Store releases | Live |
| `android/` | Capacitor 8 Android project — Google Play track | Pre-launch, signing key being rotated (see [SECURITY_REMEDIATION_PLAN](docs/SECURITY_REMEDIATION_PLAN.md)) |
| `remotion/` | Marketing video pipeline (React-driven renders) | Used ad-hoc |
| `docs/` | Architecture, compliance (HIPAA/LGPD), S3, App Store, security remediation | Reference |
| `.github/` | PR template, issue templates, desktop release workflows | Reference |
| `secrets/` | **Empty by policy** — anything matching `*.keystore`, `*.p8`, `*.p12` is gitignored. The legacy commit of an Android keystore is being remediated; see [SECURITY_REMEDIATION_PLAN](docs/SECURITY_REMEDIATION_PLAN.md). | Quarantined |

## Mobile & PWA

- iOS build is shipped via Xcode Cloud, packaged with Capacitor 8, distributed through the App Store (`6759616689`).
- Android shell ships through Google Play tracks (see `android/`). The current production keystore was historically committed under `secrets/` (commit `ae615d1`) and is being rotated and purged — full plan in [`docs/SECURITY_REMEDIATION_PLAN.md`](docs/SECURITY_REMEDIATION_PLAN.md). Going forward, `secrets/` is gitignored and the build refuses to sign without `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_PASSWORD` in the environment.
- The web app is installable as a PWA: manifest, dark variant manifest, service worker (`client/public/sw.js`) with stale-while-revalidate for assets and network-first for `/api`.
- A standalone-mode guard in `App.tsx` keeps PWA users out of the marketing landing.

## Security & compliance posture

- Session-based auth with `httpOnly` + `sameSite: strict` cookies and a Postgres-backed session store.
- TOTP and WebAuthn (biometric) as second factors, behind a unified `/api/auth/mfa/authenticate` endpoint.
- In-process WAF with togglable rules, whitelist/blacklist and statistics dashboard.
- CSP + violation reporting endpoint; helmet middleware enabled.
- Encrypted backup routes with separate master key.
- LGPD data export (`/api/user/export`) and account deletion (`/api/user/me`).
- Audit, security incident, storage and data-deletion-request tables in the schema.
- Compliance notes for HIPAA + LGPD live at [`docs/HIPAA_LGPD_COMPLIANCE.md`](docs/HIPAA_LGPD_COMPLIANCE.md).
- Responsible disclosure: [`SECURITY.md`](SECURITY.md).
- Open remediation items (Android signing key rotation, PHI fixtures, history rewrite): [`docs/SECURITY_REMEDIATION_PLAN.md`](docs/SECURITY_REMEDIATION_PLAN.md). The repository is honest about what is still in flight.

## Contributing

This is a single-author working repository. External contributions are not expected, but if you are evaluating the codebase and have a question, open an issue. See [CONTRIBUTING.md](CONTRIBUTING.md) for the lightweight workflow.

## Author

**Lucas Dickel Canova, MD** — surgeon, endoscopist and clinician-builder.
- Portfolio: https://www.lucascanova.com.br/portfolio
- Practice: Three Passes, RS, Brazil (CRM 46.242 · RQE 39.549)
- Also building: [Confirma Plantão](https://confirmaplantao.com) (shift-confirmation SaaS) and Converse com Jesus (consumer app).

## License

MIT — see [LICENSE](LICENSE).
