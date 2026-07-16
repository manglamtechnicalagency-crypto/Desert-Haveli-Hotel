# Security Changes

## `api/_lib/security.mjs`

- Added configurable per-IP/per-account rate limiting with bounded local cleanup.
- Added request ID generation and `Retry-After` responses for `429` failures.
- Added generic API error formatting that avoids provider/configuration leakage.
- Added strict R2 media key, MIME, size, and path/type validation.
- Benefit: reduces abuse, path traversal, oversized/unexpected uploads, and information leakage.
- Compatibility: requires new rate-limit environment variables; defaults are safe for development but are not a distributed production limiter.
- Added strict plain-object and allowlisted-field validation for serverless request bodies, plus normalized email validation.

## `api/_lib/r2.mjs`

- Requires a safe integer upload size and converts missing R2 configuration to a 503-class error.
- Benefit: prevents invalid/unbounded signed upload requests and avoids exposing missing secret names.

## `api/media/presign.mjs`

- Added IP/account upload limits, strict media validation, request IDs, and safe errors.
- Benefit: protects the highest-volume upload signing path.

## `api/media/delete.mjs`

- Added admin rate limits, strict storage-key allowlist, and safe errors.
- Benefit: reduces object deletion abuse and traversal attempts.

## `api/media/cloudinary-sign.mjs`

- Added upload rate limits, generic configuration failure, stricter folder/public-ID validation, and safe errors.
- Benefit: protects signing secrets and limits arbitrary Cloudinary path use.

## `api/media/cloudinary-delete.mjs`

- Added admin rate limits, stricter public-ID validation, provider-error redaction, and request IDs.
- Benefit: reduces deletion abuse and provider information leakage.

## `vercel.json`

- Added baseline browser security headers: nosniff, frame denial, referrer policy, and permissions policy.
- Benefit: reduces clickjacking, MIME confusion, referrer leakage, and unnecessary browser capabilities.
- Compatibility: validate embedded maps/media and any future integrations in staging.

## `.env.example`

- Added documented upload/admin rate-limit variables with non-secret example values.
- Benefit: makes thresholds configurable without source changes.

## `api/_lib/pinRecovery.mjs`, `api/admin/request-pin-reset.mjs`, `api/admin/verify-pin-reset.mjs`, and `src/admin/AdminLoginPage.jsx`

- Changed recovery codes from three digits to six digits and made recovery expiry/attempt limits bounded server-side configuration.
- Added IP and normalized-email rate-limit checks, generic recovery-request results, and strict request-body schemas.
- Benefit: materially reduces brute-force feasibility, account enumeration, and malformed/overposted recovery requests.
- Compatibility: existing users must use six-digit recovery codes after deployment; configure the two new non-secret recovery variables if defaults are unsuitable.
