# Security Checklist

- [x] Media/admin routes use IP and account rate limiting
- [x] Application-owned PIN recovery routes use IP and normalized-account rate limiting
- [ ] Supabase password sign-in route uses application-owned IP and account rate limiting (managed externally; verify Supabase/platform controls)
- [x] Rate-limit values are configurable
- [x] Media request keys use an allowlist and traversal checks
- [x] Serverless request bodies reject unknown fields on audited routes
- [x] Media MIME types and size limits are enforced before R2 presigning
- [ ] Server-side magic-byte/content inspection is implemented
- [x] No service-role, R2 secret, or Cloudinary secret is imported by frontend code
- [x] Environment files are ignored and `.env.example` contains placeholders
- [x] Dependency audit completed with zero reported vulnerabilities
- [x] Media API errors use generic messages and request IDs
- [x] Security response headers are configured in `vercel.json`
- [ ] Distributed/shared-store rate limiting is configured for production
- [ ] Authenticated media routes have live integration tests
- [ ] Supabase base schema and full RLS policy set are reproducible in this repository
- [ ] CSP, HSTS, and CORS are validated for the production domain
- [ ] Malware scanning/async media inspection is integrated or explicitly accepted by owner
