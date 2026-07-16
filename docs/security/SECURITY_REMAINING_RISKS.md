# Remaining Security Risks

## 1. Distributed rate limiting — High

- **Why it remains:** the repository has no Redis/edge limiter and Vercel instances do not share process memory.
- **Recommended action:** configure Vercel/Cloudflare/Supabase rate limiting or add a managed shared store.
- **Owner:** DevOps/platform owner.
- **Validation:** send repeated requests across multiple instances/regions and confirm one shared threshold.

## 2. Supabase Auth abuse controls — High

- **Why it remains:** login runs through the Supabase browser SDK and there is no application-owned auth endpoint to wrap.
- **Recommended action:** verify Supabase Auth rate limits, CAPTCHA/anti-abuse settings, generic failure behavior, and database lockout RPC policy.
- **Owner:** Supabase project owner/security reviewer.
- **Validation:** controlled test account and provider dashboard/log review.

## 3. File magic-byte and malware inspection — High

- **Why it remains:** R2/Cloudinary direct uploads are signed, but this code does not inspect uploaded bytes server-side or scan malware.
- **Recommended action:** route uploads through an isolated validation/processing job or provider scanning workflow; publish DB rows only after validation.
- **Owner:** Backend/platform owner.
- **Validation:** fake-extension, MIME-mismatch, malformed-media, oversized-dimension, and malware test fixtures.

## 4. Externally provisioned schema/RLS — High

- **Why it remains:** room/admin/auth base migrations are not in the repository; client code references live tables, policies, and RPCs.
- **Recommended action:** export reviewed migrations and policy tests into version control.
- **Owner:** Database owner.
- **Validation:** clean staging project migration replay plus RLS matrix tests.

## 5. Production CSP/HSTS/CORS — Medium

- **Why it remains:** allowed external origins are not fully enumerated, and an overly strict CSP could break maps/media/auth.
- **Recommended action:** derive a tested CSP, enforce HSTS on the HTTPS production domain, and define exact API/storage CORS origins.
- **Owner:** DevOps/frontend owner.
- **Validation:** browser security-header scan and public/admin smoke test.

## 6. Automated security tests — Medium

- **Why it remains:** `package.json` has no lint, type-check, unit, integration, or Playwright scripts.
- **Recommended action:** add focused tests for media validation, rate limiting, safe errors, and protected route behavior.
- **Owner:** Developer/QA.
- **Validation:** CI runs build, audit, secret scan, and security tests on every change.
