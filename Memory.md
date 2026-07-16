# Project Memory

## 1. Memory Instructions

This file records verified implementation progress for handoff between development sessions. Update it after meaningful work; do not record secrets, assumptions as facts, or unverified completion.

## 2. Project Snapshot

| Field | Value |
|---|---|
| Project | Desert Haveli Guest House Jaisalmer |
| Package version | 1.0.0 |
| Current branch | Not verified in this documentation update |
| Environment verified | Local Vite production preview in Chromium |
| Current phases | 3, 4, 5, 9 and 10 are in progress; see `Phases.md` |
| Last updated | 2026-07-16 |
| Updated by | Codex |

## 3. Current Objective

Maintain accurate, implementation-aware documentation while hardening the public site and administration flows. The next development work should resolve documented blockers before a production claim.

## 4. Current Implementation State

- Working locally: Vite build; public SPA routes; direct enquiry links; lazy-loaded admin app; client-side route metadata; keyboard skip link; protected admin route shell; media endpoint request validation; security documentation.
- Partially working: PIN recovery challenge creation/verification. The server returns a Supabase recovery token hash, but the client does not consume it before `supabase.auth.updateUser`; email text also says “three-digit” while generated OTPs are six digits.
- Not verified: deployed Supabase RLS/base schema, recovery email delivery/reset completion, production headers/CORS/CSP/HSTS, field Core Web Vitals, analytics, real device and cross-browser behaviour.
- No online reservation, payment, PMS, OTA, or guest-account workflow is implemented.

## 5. Completed Work

### 2026-07-16 — Security and UI hardening

- Files: `api/_lib/security.mjs`, `api/_lib/pinRecovery.mjs`, `api/admin/*`, `supabase/migrations/20260716000000_create_admin_pin_recovery.sql`, relevant admin UI files, `docs/security/*`.
- Implemented input/body validation, safe errors, per-instance rate limiting, six-digit OTP generation/hashing, bounded OTP configuration, PIN-recovery challenge migration, and laptop UI refinements.
- Validation recorded previously: production build, `npm audit`, Node utility checks, and recovery route schema checks. See `docs/security/` for exact scope and remaining risks.

### 2026-07-16 — Public-site optimization and regression pass

- Files: `src/main.jsx`, `src/admin/AdminApp.jsx`, `src/App.jsx`, `src/styles.css`, `index.html`, `docs/optimization/WEBSITE_OPTIMIZATION_AUDIT.md`.
- Deferred the admin application from public routes, added skip-link access, and added client-rendered title/description/canonical/Open Graph/Twitter metadata.
- Validation: `npm run build` passed. Chromium preview checks at 390x844, 768x1024, 1440x900, and 1920x1080 found no horizontal overflow, console/page errors, or missing image `alt` attributes. Public routes did not load the admin chunk; `/admin/login` did.

### 2026-07-16 — Documentation reconciliation

- Files: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`.
- Reconciled the root documents with verified security, recovery, SEO, accessibility, performance, and known-risk status.

## 6. Current Work in Progress

No code implementation is active at the point of this update. The open work is recorded as phase tasks and blockers below.

## 7. Important Decisions

- Keep the Vite/React SPA with Supabase and Vercel functions; do not introduce microservices without a concrete requirement (`Architecture.md`, ADR-001).
- Keep Cloudinary and R2/Supabase media compatibility until the production provider is selected (ADR-002).
- Lazy-load `src/admin/AdminApp.jsx` for `/admin/*`; public routes must not regain that dependency without measurement (ADR-003).

## 8. Architecture Notes

- `src/main.jsx` is the route entry point; public routes render `App`, admin routes lazy-load `AdminApp`.
- `src/lib/*` contains data/provider logic; server-only helpers are under `api/_lib`.
- Only the site image/section/video/gallery and PIN recovery migrations are versioned in this repository. Base rooms/admin/auth schema and RPCs are externally provisioned.

## 9. Database State

- Versioned migrations: `20260713000000_create_site_images.sql`, `20260713010000_create_site_gallery_images.sql`, `20260716000000_create_admin_pin_recovery.sql`.
- Pending repository gap: base migrations/RLS for rooms, admin profiles, audit, pricing, availability, feedback, and login lockout RPCs.

## 10. API State

- Media routes: R2 presign/delete and Cloudinary sign/delete; protected by server checks and request validation.
- Recovery routes: request and verify PIN-reset challenge. Completion is not verified because the client does not consume the returned recovery token hash.
- No reservation/payment endpoint exists.

## 11. UI State

- Public page and defined public aliases render locally; direct-route scroll alignment was previously hardened.
- Admin app is route-split and has login/dashboard/media/rooms/security paths.
- Verified local accessibility baseline: skip link, no missing image `alt` attributes, no horizontal overflow in four Chromium viewports.

## 12. Dependencies

- Existing dependencies only: React, React DOM, React Router, Vite, Framer Motion, Supabase JS, AWS S3 SDK/presigner, Playwright.
- No dependency was added during the documented optimization pass.

## 13. Environment and Configuration

- Required names are in `.env.example`: public Supabase/R2/Cloudinary values; server R2, Supabase service-role, Cloudinary, Resend, rate-limit, and recovery OTP values.
- Never put secrets in `VITE_` variables or this file.

## 14. Test Status

| Check | Latest verified result |
|---|---|
| Build | `npm run build` passed on 2026-07-16; Vite still warns of a >500 kB public chunk. |
| Lint/type check | No scripts configured. |
| Unit/integration suite | No npm scripts configured; targeted Node/recovery schema checks previously passed. |
| Browser smoke | Chromium local preview passed at four viewport sizes; no Safari/Firefox/real-device pass. |
| Security | Code/docs review complete; production infrastructure controls remain unverified. |

## 15. Known Bugs

| Severity | Defect | Reproduction / impact | Planned resolution |
|---|---|---|---|
| Major | Recovery email says “three-digit” for a six-digit OTP. | Trigger recovery with approved configuration; recipient receives incorrect instructions. | Correct template and test delivery. |
| Major | Recovery token hash is returned but not consumed before password update. | Complete recovery from logged-out admin login; reset may lack an authenticated recovery session. | Exchange/verify token with Supabase before `updateUser`; test end-to-end. |

## 16. Blockers

- Confirm canonical production hostname before changing sitemap/robots/canonical production policy.
- Export the externally provisioned Supabase schema, RLS policies, and login-lockout RPCs.
- Choose production storage/provider and configure CORS/CSP/HSTS/shared rate limiting.
- Provide approved compressed image/video derivatives and a staging/production environment for CWV measurement.

## 17. Deferred Work

- SSR/prerendering for crawl-complete metadata.
- Analytics/consent/monitoring after owner approval.
- Reservation/payment/PMS integrations unless explicitly approved.

## 18. Files Recently Changed

- Root documentation files listed above now reflect the verified 2026-07-16 state.
- See `docs/security/` and `docs/optimization/WEBSITE_OPTIMIZATION_AUDIT.md` for detailed audits.

## 19. Next Recommended Actions

1. Correct and complete the PIN-recovery token/session flow; run an approved end-to-end recovery test.
2. Version/export the missing Supabase schema and RLS policies, then test the role matrix.
3. Confirm production domain and provider decisions; update crawl directives and infrastructure controls together.
4. Replace oversized public media and profile the remaining public bundle; measure Core Web Vitals on staging/production.
5. Add repeatable lint, unit/API, and Playwright scripts to CI.

## 20. Handoff Summary

The public optimization and security hardening are documented and locally verified only. Do not claim production readiness or repair missing infrastructure by assumption. Start by reading this file plus the five root documents, then resolve the recovery-flow defect or the external schema blocker with focused tests.

## 21. Update Log

### 2026-07-16 — Documentation reconciliation

- Objective: align project documents with the current repository and verified implementation work.
- Completed: updated PRD, Architecture, Rules, Phases, Design; created Memory.
- Tests run: repository/config/source review; previous local production build and Chromium checks referenced above.
- Results: documentation now distinguishes verified, partial, and blocked items.
- Blockers: production domain, base Supabase schema/RLS, recovery completion, media optimization, production infrastructure.
- Next action: complete and test PIN recovery or export/test the base schema.
