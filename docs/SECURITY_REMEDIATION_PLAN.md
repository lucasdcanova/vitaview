# Security Remediation Plan

> Action checklist for the repository owner. Generated as part of the
> portfolio-polish review (Round 2). Nothing here was auto-fixed because
> each item requires a destructive history rewrite, a credential rotation,
> or a human judgement call that should not happen inside a tooling pass.

The Round 2 commits already landed the *non-destructive* fixes:
the gradle file no longer contains a literal keystore password fallback,
the server boot log no longer prints a partial `DATABASE_URL`, and
`.gitignore` was tightened. Everything below still requires you.

---

## Severity 0 — Android signing key compromise

**State.** `secrets/vitaview-release.keystore` (2 764 bytes, PKCS#12) was
committed on `ae615d1` (2026-04-04, "feat: add Android platform for
Google Play distribution"). It is the **production signing key** for the
Android app under bundle id `br.com.lucascanova.vitaview`. The Round 1
diff added it to `.gitignore` but did not delete it (the inviolable rules
of that round forbade deletions).

The same commit also baked the keystore + key password
(`VitaView2026Release`) into `android/app/build.gradle` as a fallback
literal. Round 2 removed that fallback, but the literal still exists in
the history starting at `ae615d1`.

**Why this is severity 0.** Anyone with read access to the repository
(public, since the remote is `github.com/lucasdcanova/VitaView.ai`) can:

1. clone the repo,
2. read the keystore at the committed path,
3. read the password from `android/app/build.gradle` at any commit between
   `ae615d1` and the Round 2 commit,
4. sign an arbitrary APK as VitaView and distribute it as the same
   "publisher" Google Play recognises.

**What you must do, in this order.**

1. **Generate a new keystore offline.** Keep it on encrypted disk, back
   it up to `~/.vault/` and to an offline medium. Document the
   credential in the vault — never in this repo.
2. **Upload App Signing key in Play Console** (if not already enrolled
   in Play App Signing): enrol the app and let Google manage the upload
   signing. If already enrolled, follow Google's
   ["upload key reset"](https://support.google.com/googleplay/android-developer/answer/9842756)
   flow with the new keystore. You will need to:
   - generate `upload_certificate.pem` from the new keystore,
   - open a Play Console support ticket,
   - prove ownership,
   - wait for Google to swap the upload key.
3. **Rotate the keystore password and key password.** The strings
   `VitaView2026Release` (and any variant) are burned. Pick a new
   password (>= 24 chars, random) and store it only in the vault and in
   the GitHub Actions / Xcode Cloud / local CI environment as
   `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_PASSWORD`.
4. **Purge the keystore from git history.**
   ```bash
   # use git-filter-repo (preferred) — install with: brew install git-filter-repo
   git filter-repo \
     --invert-paths \
     --path secrets/vitaview-release.keystore \
     --path-glob '**/*.keystore'
   ```
   This rewrites every commit and changes every commit hash. You will
   have to force-push to the public remote and re-create any open PRs.
5. **Purge the password literal from git history.** Same tool:
   ```bash
   echo 'VitaView2026Release' > /tmp/secrets-to-purge.txt
   git filter-repo --replace-text /tmp/secrets-to-purge.txt
   ```
6. **Rotate any CI secret** named `ANDROID_KEYSTORE_PASSWORD`,
   `ANDROID_KEY_PASSWORD`, or anything else that ever used the burned
   value, on GitHub Actions, Xcode Cloud, Render, Replit and any local
   developer machine.
7. **Audit Play Console** for unknown internal/closed test uploads
   between 2026-04-04 and the day the upload key gets reset.
8. **Notify Google Play** if any unauthorised release got through —
   their app-integrity team can roll a release back.

Do not delete the file from the working tree before doing steps 1-3:
you need the file to extract the existing certificate (`keytool -export`)
in case Play Console asks for proof during the upload-key reset.

---

## Severity 0 — PHI (patient health information) in repository

**State.** Four files in the repo contain real, named patient data:

| File | Patient name | Content |
|---|---|---|
| `20251003_1_26899_2169_218.pdf` (root) | LUIZ EUGENIO CANOVA, 69 | Full blood count, biochemistry, requesting physician Dr. LUCAS D. CANOVA, dated 03/10/2025 |
| `attached_assets/laudo (1).pdf` | ANDERSON SZAMBELAM KAUTZMANN, 33 | Full blood count, requesting physician MARCELO KONRAD, UNIMED, 09/04/2025 |
| `attached_assets/Resultado0022119-20241219161215.pdf` | RAFAEL JOSE BOYASKI, 42 | Multi-page lab report, 19/12/2024 |
| `attached_assets/IMG_8481.jpeg` | (image — needs visual review) | 571x1007 JPEG, EXIF date suggests phone capture |

Introduced across `01b48cc` (initial commit, 2025-04-30),
`10e21a3` (2025-05-05, "Add medical exam report to the system to diagnose the error"),
and `a585a6c` (2025-05-07, "Add sample medical documents for comprehensive system testing and validation").

**Legal frame.** LGPD Art. 11 (dado pessoal sensível de saúde) and
HIPAA §164.502. A public Git mirror that contains identified patient
records is a reportable data breach under both regimes, regardless of
the original treatment relationship.

**What you must do.**

1. **Notify each patient** (or their guardian / next of kin) of the
   exposure, the duration, and the remediation actions. Log the
   notification in a `data_processing_records` row per LGPD Art. 37.
2. **Notify the ANPD** (Autoridade Nacional de Proteção de Dados) within
   the regulatory window if the exposure is judged to carry "risk or
   relevant damage" — coordinate with your DPO. The vault note
   `03_Areas/Compliance LGPD.md` should track this.
3. **Purge from git history** the same way as the keystore:
   ```bash
   git filter-repo \
     --invert-paths \
     --path '20251003_1_26899_2169_218.pdf' \
     --path 'attached_assets/laudo (1).pdf' \
     --path 'attached_assets/Resultado0022119-20241219161215.pdf' \
     --path 'attached_assets/IMG_8481.jpeg'
   ```
4. **Force-push the rewritten history** and ask GitHub Support to
   garbage-collect the orphan blobs from their cache (open a ticket; they
   will need the SHAs of the bad blobs, which `git rev-list --objects --all`
   will give you after the rewrite).
5. **Delete forks** if any exist (`gh api repos/lucasdcanova/VitaView.ai/forks`).
6. **Search clones.** Any developer machine that ever cloned the repo
   still has the PHI in its `.git` object store. Run `git gc --prune=now`
   on those machines after pulling the rewritten history.
7. **Decide on a fixture policy going forward.** If you need realistic
   exam PDFs to drive the AI extraction pipeline in tests, generate
   synthetic patients with `scripts/seed-fake-exams.ts` and commit those
   instead. Real lab reports must never enter the repo, even temporarily.

---

## Severity 1 — Stripe live publishable key in dev scratch file

**State.** `client/test-stripe.html` (a one-off debug page) hardcodes
`pk_live_51RAOnM…002np3ZUCz`. This is a *publishable* key — by design it
is safe to expose in browser code — but in this file:

- It is a `pk_live_*` key, which identifies the production Stripe
  account. Combined with any leaked `sk_live_*` secret key, an attacker
  has both halves.
- The file looks like a leftover debugging artefact, not something the
  app actually serves. It pollutes the surface area.

**What you must do.**

1. Decide whether `client/test-stripe.html` is still needed. If not,
   delete it (working tree only is fine — purging history is overkill
   for a publishable key).
2. If kept, replace the literal with `VITE_STRIPE_PUBLIC_KEY` read at
   build time.
3. Confirm in the Stripe dashboard that the matching `sk_live_*` and
   `whsec_*` have not been exposed elsewhere (a full repo + history
   sweep in Round 2 found no `sk_live_` or `whsec_` literals, only
   `process.env.STRIPE_SECRET_KEY` references — good).

---

## Severity 2 — Local cookie dumps

`cookies.txt` and `test-cookies.txt` are committed but currently empty
(only the libcurl header). The patterns `cookies.txt` and `test-cookies.txt`
are now in `.gitignore` (Round 1), but the tracked files were not
removed.

**Action.** `git rm cookies.txt test-cookies.txt` in a working-tree
commit. They are not in history with sensitive data so no history rewrite
is needed.

---

## Severity 2 — Default seed passwords in scripts

- `create-admin.ts:17` — hardcoded `password = "adminpassword"`.
- `scripts/seed-appstore-showcase.{cjs,ts}` — `DEFAULT_SECRETARY_PASSWORD = "Vitaview@123"`.

These are seeding scripts intended for fresh demo databases, not runtime
secrets. They are not production credentials, but they are weak
demo defaults that survive into Play Console / App Review demo accounts.

**Action.** Change both to read from env (`DEMO_ADMIN_PASSWORD`,
`DEMO_SECRETARY_PASSWORD`) and fail loudly if missing. Update the App
Review notes (`docs/app-review-notes-ios.md`) to point to the new env
vars instead of the literals.

---

## Severity 3 — `.claude/settings.local.json` tracked

The Claude Code local settings file is committed (it grants Bash command
patterns to that machine). It is not a secret, but it leaks the author's
local workflow and adds noise to PRs.

**Action.** `.claude/` is now in `.gitignore` (Round 2) but the existing
tracked copy must be removed with `git rm --cached .claude/settings.local.json`
in a follow-up commit.

---

## Severity 3 — macOS Finder duplicates still tracked

16 files match the `* 2.*` / `* 3.*` pattern:

```
check-db 2.cjs
check_invites 2.ts
client/public/apple-touch-icon 2.png
client/public/apple-touch-icon-dark 2.png
client/public/icon-192x192-dark 2.png
client/public/icon-512x512-dark 2.png
client/public/manifest-dark 2.json
client/src/components/landing-page/motion-tokens 2.ts
client/src/components/layout/theme-toggle-button 2.tsx
client/src/lib/lazy-with-retry 2.ts
dump-profiles 2.cjs
scripts/diag-clinic 2.ts
scripts/validate-stripe 2.ts
scripts/validate-stripe 3.ts
server/db/migrations/add_clinic_memberships_table 2.sql
server/trigger 2.js
```

The `.gitignore` now blocks new ones (Round 1). These existing copies
need a manual sweep — diff each against its canonical name with
`diff -q "foo 2.ts" foo.ts` and `git rm` the duplicate when identical.

---

## Severity 3 — Loose ops scripts at repo root

Eight to ten Python / JS one-off scripts live at the repo root
(`fix_health_trends.py`, `patch_allergy.py`, `dump-profiles.cjs`, etc.).
They were one-shots, kept "just in case". They make the repo look
unfinished from the GitHub front page.

**Action.** Move under `scripts/legacy/` in a follow-up `chore:` commit.
No history rewrite needed — they were never secret, just messy.

---

## Severity 3 — Server boot log redaction (already fixed in Round 2)

`server/index.ts:2-3` printed the first 15 characters of `DATABASE_URL`
on startup. Round 2 removed it. No history rewrite needed (this leak
was post-deploy log noise, not a permanent secret in the source).

---

## Verification commands

Run after every history rewrite to confirm cleanliness:

```bash
# 1. no keystores anywhere in history
git log --all --diff-filter=A --name-only --pretty=format: \
  | grep -iE '\.(keystore|jks|p12|pfx|p8|pem)$' \
  && echo 'STILL DIRTY' || echo 'clean'

# 2. no patient PDF/JPEG fixtures
git log --all --diff-filter=A --name-only --pretty=format: \
  | grep -iE '(laudo|resultado|IMG_).*\.(pdf|jpe?g)$' \
  && echo 'STILL DIRTY' || echo 'clean'

# 3. no committed passwords
git log --all -p | grep -iE '(VitaView2026|Vitaview@123|adminpassword)' \
  && echo 'STILL DIRTY' || echo 'clean'

# 4. no obvious literal API keys
git log --all -p | grep -iE 'sk_live_|sk_test_[a-zA-Z0-9]{30,}|whsec_[a-zA-Z0-9]{30,}|AKIA[0-9A-Z]{16}' \
  && echo 'STILL DIRTY' || echo 'clean'
```

---

## Order of operations (recommended)

1. Generate new keystore, enrol Play App Signing, rotate keystore
   passwords in CI **before** rewriting history. The old artefacts on
   disk are still needed for the upload-key reset.
2. Patient notifications (PHI). Legal clock is running from the moment
   you know.
3. History rewrite (keystore + passwords + PHI in one filter-repo run).
4. Force-push, contact GitHub Support to GC orphan blobs.
5. Rotate every CI secret that ever touched the burned values.
6. Working-tree cleanup: `git rm` cookies, `git rm` `.claude/settings.local.json`,
   Finder duplicates sweep, scripts move.
7. Re-run the verification commands above.
8. Update `~/Documents/Obsidian/LucasOS/04_Processos/Decisao e Registro.md`
   with the incident timeline and the remediation steps taken.
