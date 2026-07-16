# Production Security Audit

**Date:** 2026-07-16  
**Scope:** Vite/React frontend, Vercel serverless media endpoints, Supabase Auth/Postgres/storage integration, Cloudinary/R2 upload paths, configuration, dependencies, and deployment headers.

## Executive summary

The application is a Vite/React SPA. It has no conventional backend, ORM, or in-repository login API. Admin authentication and most data authorization are delegated to Supabase; Vercel functions provide R2/Cloudinary media operations. Safe fixes were applied to the media API boundary.

**Overall result: Not ready for production security sign-off.** The public build and dependency audit pass, but distributed rate limiting, server-side file content inspection, and the externally provisioned Supabase schema/RLS still require deployment-owner validation.

## Stack and architecture detected

- Frontend: React 19, Vite 6, React Router 6, Framer Motion.
- Backend/API: Vercel functions in `api/media/*.mjs`; no Express/Nest/Django server.
- Authentication: Supabase Auth plus `admin_profiles` lookup and database lockout RPCs.
- Database: Supabase Postgres; base room/auth migrations are not in this repository.
- Storage: Supabase public storage fallback, Cloudflare R2 signed URLs, optional Cloudinary signed uploads.
- Package manager: npm with `package-lock.json`.
- Deployment: `vercel.json` SPA rewrite; no Docker or CI workflow found.

## Route inventory

| Method | Route | Auth | Inputs | Validation/rate category | Risk |
|---|---|---|---|---|---|
| POST | `/api/media/presign` | Active admin bearer | JSON key, content type, size | Strict key/type/size; IP + account upload limit | High |
| POST | `/api/media/delete` | Active admin bearer | JSON storage key | Strict allowlisted key; IP + account admin limit | High |
| POST | `/api/media/cloudinary-sign` | Active admin bearer | JSON public ID, folder, resource type | Regex/path checks; IP + account upload limit | High |
| POST | `/api/media/cloudinary-delete` | Active admin bearer | JSON public ID, resource type | Regex/path checks; IP + account admin limit | High |
| Supabase Auth | Sign-in/lockout RPCs | Supabase-managed | Email/PIN via browser client | Database RPC/client flow; not wrapped by local API limiter | High remaining |
| Supabase reads/writes | Rooms/content/media/admin data | Supabase/RLS | Query/form data | Provider/schema/RLS dependent | High remaining |

## Findings and remediation

### H-001 — Raw media/provider errors were returned to callers

- **Affected files:** `api/media/*.mjs`, `api/_lib/r2.mjs`.
- **Exploit/impact:** callers could receive configuration names, provider messages, or implementation details; errors also lacked stable request correlation.
- **Fix:** centralized `safeErrorResponse` in `api/_lib/security.mjs`; generic status-aware error envelope, request ID, no provider message on 5xx; 401/403 remain distinguishable.
- **Verification:** source inspection and production build passed.
- **Remaining risk:** Supabase browser errors are still surfaced by some admin UI paths and should be mapped at a future shared UI/API boundary.

### H-002 — R2 presign accepted arbitrary content types and sizes

- **Affected files:** `api/media/presign.mjs`, `api/_lib/r2.mjs`, `api/_lib/security.mjs`.
- **Exploit/impact:** an authenticated admin could obtain signed upload URLs for unexpected content types or oversized objects.
- **Fix:** allowlisted image/video MIME types, path-specific maximum sizes, safe integer checks, path/type consistency, and 300-character/path traversal controls.
- **Verification:** code-level inspection; build passed.
- **Remaining risk:** direct object storage upload still cannot be treated as magic-byte verification without an asynchronous scanner/processor.

### H-003 — High-risk media endpoints lacked abuse protection

- **Affected files:** all four media handlers; `api/_lib/security.mjs`; `.env.example`.
- **Exploit/impact:** repeated signing/deletion requests could consume provider/API resources.
- **Fix:** configurable per-IP and per-admin-account limits for upload/admin categories; `429`, `Retry-After`, generic message, and bounded in-memory bucket cleanup.
- **Verification:** static inspection; dedicated automated rate-limit tests are not present.
- **Remaining risk:** in-memory state is not distributed across Vercel instances; production requires an edge/shared store or provider-level rate limiting.

### H-004 — PIN recovery used a low-entropy code and revealed account eligibility

- **Affected files:** `api/_lib/pinRecovery.mjs`, `api/admin/request-pin-reset.mjs`, `api/admin/verify-pin-reset.mjs`, `src/admin/AdminLoginPage.jsx`.
- **Exploit/impact:** a three-digit code offered only 900 possible values and the request endpoint distinguished an ineligible email address, enabling targeted abuse and account discovery.
- **Fix:** recovery codes are now six digits, expiry and attempt thresholds are bounded server configuration, request and verification routes apply both IP and normalized-identifier rate limits, recovery responses are generic, and the UI enforces the six-digit code.
- **Verification:** focused Node security-utility checks passed; production build passed.
- **Remaining risk:** the limiter is still process-local until a shared production store is provisioned.

### M-003 — API bodies did not reject undeclared fields

- **Affected files:** `api/_lib/security.mjs`, all `api/media/*.mjs`, PIN recovery routes.
- **Exploit/impact:** permissive request parsing can enable inconsistent validation and accidental overposting as endpoints evolve.
- **Fix:** reusable plain-object and allowlisted-field validation now rejects malformed bodies and unknown properties before route business logic.
- **Verification:** focused Node checks cover valid, malformed, oversized, unexpected-field, and path-traversal cases.

### M-001 — Baseline response security headers were absent from deployment configuration

- **Affected file:** `vercel.json`.
- **Fix:** added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
- **Remaining risk:** CSP, HSTS, CORS, and cookie policy require deployment-specific validation because external Supabase, Cloudinary, maps, and media origins are in use.

### M-002 — Cloudinary identifiers were more permissive than necessary

- **Affected file:** `api/media/cloudinary-sign.mjs`, `api/media/cloudinary-delete.mjs`.
- **Fix:** reject traversal markers, leading/double separators, backslashes, and unsupported resource types.

## Dependency audit

`npm audit` completed with exit code 0: **0 vulnerabilities**. `npm audit --omit=dev` also reported **0 vulnerabilities**. No dependency upgrade was required for this audit.

## Secrets audit

No literal credentials were found in the inspected source/configuration. `.gitignore` excludes `.env` and `.env.*` while retaining `.env.example`. Public `VITE_` values are limited to Supabase anon URL/key, R2 public base URL, Cloudinary cloud name, and admin login email; service-role, R2 secret, and Cloudinary secret variables are not imported by frontend source.

Git history was not rewritten and no credentials were rotated.

## Verification result

- Build: **Passed** (`npm run build`).
- Dependency audit: **Passed** (`npm audit`, production-only audit).
- Type check: **Not available**; no TypeScript/type-check script exists.
- Lint: **Not available**; no lint script exists.
- Unit/integration/security tests: **Not available**; no test script exists.
- Secret scan: **Passed for repository source/config scan; provider secret rotation cannot be inferred.**
- Authenticated route/upload tests: **Not executed**; require live Supabase/provider credentials and safe test accounts.
