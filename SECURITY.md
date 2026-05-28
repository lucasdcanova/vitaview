# Security Policy

VitaView AI handles protected health information (PHI) and clinical
documents with legal weight. We take security reports seriously.

## Supported versions

Only the `main` branch and the currently published iOS / Android / web
release are in scope. Older tagged releases are not patched.

| Version | Supported |
|---|---|
| `main` (web + PWA at vitaview.ai) | yes |
| iOS App Store build (`6759616689`) | yes |
| Android Google Play current track | yes |
| Anything older | no |

## Reporting a vulnerability

Do **not** open a public GitHub issue.

Email the author:

- Primary: through the contact form at https://www.lucascanova.com.br
- Subject prefix: `[security] [vitaview]`

Include:

- A description of the vulnerability and the affected surface (URL,
  endpoint, mobile build, file path).
- Reproduction steps. A minimal PoC is welcome; please do **not**
  exfiltrate real patient data to demonstrate.
- Your assessment of impact (information disclosure, privilege
  escalation, account takeover, PHI access, billing manipulation, etc.).
- Whether the issue is already public.

Expected response timeline:

- Acknowledgement: within 3 business days.
- Triage and severity decision: within 7 business days.
- Fix or mitigation plan: communicated within 14 business days for
  critical/high; longer for medium/low with rationale.

## What we will not do

- Pursue legal action against good-faith researchers who follow this
  policy, do not access PHI beyond what is needed to demonstrate the
  issue, and do not disclose publicly before we have shipped a fix.
- Publish reporter identities without consent.

## What we ask in return

- No social engineering of clinic staff, patients, or the author.
- No physical attacks on clinic premises or the operator's devices.
- No automated load tests against production without prior coordination.
- No retention of any PHI you may incidentally access — destroy it and
  confirm in the report.

## Scope

In scope:

- The web application at `vitaview.ai` and its API at the same origin.
- The iOS app (App Store id `6759616689`, bundle
  `br.com.lucascanova.vitaview`).
- The Android app on the current Google Play track.
- The desktop Electron shells under `desktop/` for macOS and Windows.

Out of scope:

- Third-party services we depend on (OpenAI, Stripe, Neon, AWS S3, SMTP
  provider, Apple, Google). Report directly to them.
- Vulnerabilities that require physical access to an unlocked clinic
  device.
- Findings already documented in
  [`docs/SECURITY_REMEDIATION_PLAN.md`](docs/SECURITY_REMEDIATION_PLAN.md)
  (active remediation in progress).
- Best-practice opinions that are not exploitable (missing headers on
  static asset CDNs, etc.) unless you can show concrete impact.

## Hall of fame

We will publicly credit reporters who want recognition, with their
permission, in the release notes of the fixing version.
