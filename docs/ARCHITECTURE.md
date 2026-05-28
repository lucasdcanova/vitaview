# Architecture

This is a working architecture note — what is actually in the repo today,
not what we wish were there.

## Shape

VitaView is a single Node.js process that serves an Express API and the
built React SPA, with PostgreSQL as the only persistent store and OpenAI
as the only AI provider. Mobile and desktop are wrappers around the same
client.

```
React/Vite SPA  ──HTTP──▶  Express (port 3000)  ──Drizzle──▶  Postgres (Neon)
       │                            │
       │                            ├──▶ OpenAI (vision, chat, transcription)
       │                            ├──▶ Stripe (subscriptions, webhook)
       │                            ├──▶ AWS S3 (uploads via multer-s3)
       │                            └──▶ SMTP (nodemailer)
       │
   Service Worker (sw.js) — installable PWA, offline fallbacks
```

There is no separate API gateway, no message queue, no microservices.
The "monolith" choice is deliberate: a clinic-grade app benefits more from
one consistent transactional boundary (Postgres) and one deploy unit than
from premature decomposition.

## Server entry (`server/index.ts`)

Order matters; this is the order in `index.ts`:

1. `dotenv/config`
2. WAF middleware (`server/security/waf.ts`) — first line of defense.
3. CSP-report parser on `/api/csp-violation-report` (must come before generic JSON parser).
4. `setupSecurity(app)` — Helmet, dynamic CSP, advanced security headers.
5. `morgan` request log piped into Winston (`server/logger.ts`).
6. Permissive CORS for development (tightened in production behind reverse proxy).
7. JSON / urlencoded body parsers with raised limits for uploads.
8. `setupAuth(app)` — Passport local strategy, session store backed by `connect-pg-simple`, MFA endpoints.
9. `registerRoutes(app)` — mounts the main API surface and modular route files (`routes/documents.ts`, `routes/patient.routes.ts`, `routes/security.routes.ts`, `routes/marketing.routes.ts`, `routes/upload.routes.ts`).
10. Static file serving in production, or Vite middleware in dev (`server/vite.ts`).
11. Background workers: `notificationScheduler` and `consultationAudioRetentionService`.

The Stripe webhook (`/api/webhook`) is mounted with `express.raw()` *before*
the generic JSON parser to preserve the signature payload.

## Client entry (`client/src/main.tsx` → `App.tsx`)

- Top-level providers: `QueryClientProvider`, `AuthProvider`, `ActiveProfileProvider`, `UploadManagerProvider`, `SidebarProvider`, `ThemeProvider`.
- `wouter` for routing — 31 routes, of which 23 are inside `ProtectedRoute`.
- Heavy pages (`PatientView`, `ExamReport`, `ReportsPage`, `VitaAssist`, `Agenda`, etc.) are lazy-loaded with a custom `lazyWithRetry` that re-imports on chunk load failure (post-deploy chunk hash mismatches).
- `CommandPalette` and `OnboardingTour` are mounted globally inside the authenticated area.
- PWA detection in `App.tsx` short-circuits the marketing landing so installed users go straight to `/auth`.

## Persistence (`shared/schema.ts`, ~1.7k lines)

46 Drizzle tables grouped by domain:

- **Identity & tenancy** — `users`, `profiles`, `clinics`, `clinic_memberships`, `clinic_invitations`, `team_members`, `user_consents`.
- **Clinical record** — `diagnoses`, `medications`, `allergies`, `surgeries`, `evolutions`, `habits`, `triage_records`, `doctors`.
- **Exams & metrics** — `exams`, `exam_results`, `health_metrics`, `notifications`.
- **Documents** — `prescriptions`, `certificates`, `certificate_templates`, `exam_requests`, `exam_protocols`, `tuss_procedures`, `custom_medications`, `custom_exams`, `specialty_templates`.
- **Billing** — `subscription_plans`, `subscriptions`.
- **AI ops** — `ai_conversations`, `ai_messages`, `ai_usage`, `ai_cache`, `ai_cost_logs`.
- **Support** — `support_articles`, `support_tickets`, `support_messages`.
- **Compliance & security** — `audit_logs`, `storage_logs`, `data_deletion_requests`, `data_processing_records`, `security_incidents`, `deleted_users`.

`server/storage.ts` exposes an `IStorage` interface — every route goes
through it instead of touching Drizzle directly. This is the seam that
makes the routes file (~thousands of lines, on purpose) testable.

## AI pipeline (`server/services/`)

Two phases, both backed by OpenAI:

1. **Extraction** — `analyze-pipeline.ts` accepts a PDF or image, calls the
   vision model (configurable via `OPENAI_GPT5_MODEL` / `OPENAI_ANALYSIS_MODEL`),
   normalizes the result with `shared/exam-normalizer.ts`, persists to
   `exams` + `exam_results` + `health_metrics`.
2. **Interpretation** — a second call against the analysis model produces
   clinical insights and recommendations attached to the exam.

Adjacent flows reuse the same OpenAI client:

- `consultation-audio-retention.ts` — transcription pipeline with retention rules.
- `patient-record.ts` — analyze/enhance free-text anamnesis.
- `vita-assist/*` — clinical copilot, conversations persisted in `ai_conversations` / `ai_messages`.
- `model-router.ts` — selects model and bills against `ai_usage` + `ai_cost_logs`.
- `ai-cache.ts` — request-level cache to control cost.

The fair-use middleware (`server/middleware/fair-use.ts`) enforces
plan-level quotas using `ai_usage`.

## Security model

- **AuthN** — Passport local, bcrypt (`bcryptjs`) password hashing, sessions with
  `httpOnly`, `sameSite: strict`, persisted in Postgres via `connect-pg-simple`.
- **MFA** — TOTP (`speakeasy`) and WebAuthn biometric flows, gated through a
  single `/api/auth/mfa/authenticate` endpoint.
- **AuthZ** — RBAC per clinic role (admin / member / secretary), per-route
  guards, plan-level access via `ensure-premium.ts`.
- **WAF** — `server/security/waf.ts` runs first, with toggleable rules,
  whitelist/blacklist and a stats endpoint.
- **CSP** — dynamic CSP (`server/middleware/dynamic-csp.ts`) and a violation
  reporter endpoint that persists offenses for review.
- **Encryption** — `server/security/medical-encryption.ts` wraps sensitive
  payloads with a master key managed off-box (`MASTER_ENCRYPTION_KEY`).
- **Audit** — every privileged action lands in `audit_logs`; storage and
  data-deletion requests have their own append-only tables.
- **Rate limiting** — `server/middleware/enhanced-rate-limit.ts` and
  `server/middleware/prescription-limit.ts` apply targeted limits.
- **Compliance posture** — HIPAA/LGPD notes live in
  `docs/HIPAA_LGPD_COMPLIANCE.md`; LGPD data export and account deletion
  endpoints are exposed at `/api/user/export` and `/api/user/me`.

## Mobile and desktop

- **Capacitor 8** wraps the same SPA into iOS and Android shells. The iOS
  shell is the App Store build (`6759616689`, bundle `br.com.lucascanova.vitaview`).
- **App Store / IAP** — billing collapses into Stripe for web, Apple StoreKit
  for iOS. `shared/billing.ts` and `shared/app-store.ts` centralize the
  cross-platform logic; iOS prices are marked up by `IOS_APP_STORE_PRICE_MARKUP_PERCENT`
  to absorb Apple's commission.
- **Electron desktop** — `desktop/` contains macOS and Windows shells with
  their own build chain, exposed via the `desktop:*` scripts in `package.json`.
- **PWA** — manifest with `start_url: /auth`, separate dark manifest,
  service worker with stale-while-revalidate for assets and network-first
  with offline JSON fallback for the API.

## Deployment topology

- **Server** — Render (Node.js web service), single process.
- **Database** — Neon serverless Postgres.
- **iOS** — Xcode Cloud, released via the `app-store-connect` CLI.
- **Android** — Google Play tracks, signed locally (keystore must live
  outside the repo — see `.gitignore`).
- **Desktop** — GitHub Actions workflows in `.github/workflows/` produce
  signed macOS and Windows artifacts.

## What is intentionally not in the repo

- No Kubernetes / Helm / Terraform. Render + Neon cover the surface today.
- No message queue. AI calls are synchronous behind a per-user rate limit.
- No separate auth service. Sessions live in Postgres alongside everything else.
- No microservices. The routes file is large by design; the storage interface
  is the only abstraction that needs to hold.
- No bespoke ML training. All inference is OpenAI hosted; cost is tracked
  per request.

## Known sharp edges (to be honest)

- Several one-off scripts live at the repository root (`check-db.cjs`,
  `dump-profiles.cjs`, `fix-dropdown.js`, etc.). They were operational
  one-shots; they should move under `scripts/` over time.
- macOS Finder duplicates (`foo 2.ts`, `foo 3.ts`) are tracked in a handful
  of places — the new `.gitignore` patterns prevent future drift; the
  existing copies need a manual sweep.
- `routes.ts` is large; the modular `routes/` folder is the gradual
  destination.
- A keystore placeholder exists under `secrets/`; it is the next thing to
  remove from the working tree and from history (BFG / `git filter-repo`).
