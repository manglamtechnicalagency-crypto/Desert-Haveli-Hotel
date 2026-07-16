# AI Development Rules

## 1. Purpose

This file is mandatory operating policy for every AI coding agent working in this repository. It prevents fabricated scope, unsafe changes, duplicated abstractions, and undocumented architectural drift.

## 2. Instruction Priority

1. Security and legal requirements
2. `Rules.md`
3. `PRD.md`
4. `Architecture.md`
5. `Design.md`
6. `Phases.md`
7. `Memory.md` when it exists
8. Task-specific instructions

When documents conflict, stop, describe the conflict, and record the needed decision. Do not silently choose.

## 3. Before Coding

- Read all root project documents and `Memory.md` if present. Review `docs/security/` and `docs/optimization/` whenever a task affects authentication, media, deployment, SEO, accessibility, or performance.
- Inspect the relevant source, imports, dependents, data paths, and existing docs.
- Confirm the current phase and define a focused plan.
- Separate verified behavior from assumptions and planned work.
- Preserve working public behavior and local fallback content.
- Define validation commands before implementation.
- Check environment/dependency impact before adding packages.

## 4. Scope Control

Work only on the requested task and phase. Avoid unrelated refactors, public API changes, speculative features, and schema changes without a migration. Record deferred improvements instead of implementing them silently.

## 5. Approved Technologies

Use existing React 19, Vite 6, React Router 6, Framer Motion, Supabase JS, CSS, Vercel functions, Cloudinary/R2 adapters, and Playwright where appropriate. Prefer existing dependencies and project patterns.

## 6. Prohibited Technologies

Do not add duplicate UI systems, state libraries, validation libraries, storage SDKs, deprecated/unmaintained packages, or packages with known security concerns unless a documented ADR approves the need.

## 7. Dependency Rules

Reuse installed dependencies; do not install a package for trivial logic. Verify compatibility, update lockfile, document the reason, and remove unused packages. Never expose package-manager conflicts or commit secrets.

## 8. Coding Standards

Current language is JavaScript/JSX using ES modules. Use clear camelCase functions/variables, PascalCase React components, small focused modules, existing formatting style, and semantic HTML. Keep business/provider logic in `src/lib`, server secrets in `api`, and public fallback content in `src/data.js`. Remove dead code only when usage is verified.

## 9. TypeScript Rules

No TypeScript source is currently verified. If introduced, avoid `any`, validate external data at runtime, separate DB/API/UI types, handle nullable values explicitly, and document the migration boundary.

## 10. Component Rules

Keep components focused; separate presentation from data/business logic; preserve loading, empty, error, and success states; use accessible labels and focus behavior; support reduced motion; avoid premature generic abstractions and excessive prop drilling.

## 11. Backend Rules

Keep business logic out of Vercel route handlers where practical. Validate every external input, authenticate bearer tokens, enforce authorization server-side/RLS, use safe provider errors, and never trust client roles or ownership identifiers.

## 12. Database Rules

Use ordered migrations. Do not assume externally provisioned tables are documented. Add indexes from measured query patterns, define FK behavior, avoid destructive changes, preserve audit history, prevent N+1 queries, paginate large admin lists, and never store plaintext secrets/passwords.

## 13. API Rules

Use stable route names, correct methods/status codes, consistent safe errors, body/query/path validation, rate limiting for sensitive endpoints, and idempotency for retry-sensitive mutations. Recovery flows must consume and verify the provider token/session returned by the verification step; do not treat an OTP match alone as authorization to update credentials. Public reservation APIs require an explicit contract before implementation.

## 14. Authentication Rules

Supabase Auth and server/RLS checks are authoritative. Never implement client-only authorization. Keep login/recovery rate-limited and avoid user enumeration. Do not log passwords, access tokens, cookies, or private profile data.

## 15. Security Rules

Never commit secrets or expose non-public environment variables through `VITE_`. Never disable security protections to fix an error, render unsanitized HTML, trust uploads, build unsafe SQL, or log sensitive values. Validate media type/size/duration and restrict delete operations to authorized records/paths.

## 16. Error-Handling Rules

No empty catches. Do not suppress errors without a documented reason. Show safe user messages, log technical details only where appropriate, distinguish expected/unexpected failures, preserve useful internal context, and provide frontend fallback UI.

## 17. UI and UX Rules

Follow `Design.md`. Reuse existing sand/gold/brown/maroon visual tokens. Maintain responsive layouts, semantic HTML, keyboard access, visible focus, feedback after actions, and confirmation for destructive admin actions. Do not invent new colors/fonts/spacing per page.

## 18. Accessibility Rules

Target WCAG 2.2 AA: keyboard access, focus visibility, label/error association, sufficient contrast, alt text, heading order, semantic landmarks, touch targets, screen-reader names, and reduced-motion support.

## 19. Performance Rules

Keep non-critical media lazy, avoid duplicate queries and unnecessary client JS, optimize image/video size, paginate large results, and measure before adding caching or abstractions. Preserve hero priority and fallback behavior. Maintain the current lazy boundary for `src/admin/AdminApp.jsx`; a public-route change must not reintroduce the admin chunk into the initial bundle without a documented measurement and ADR update.

## 20. Testing Rules

Every completed task needs proportionate validation: build at minimum; targeted unit/integration/browser/accessibility checks when available. Do not change tests to hide failures. If a check cannot run because no script/schema/environment exists, report that exact limitation.

## 21. Git Rules

Make focused changes, review the diff, use clear commit messages, keep lockfiles synchronized, record breaking changes, and never reset, delete user files, force-push, or run production migrations without explicit authorization.

## 22. File-Modification Rules

Read relevant sections and dependents first. Preserve local patterns. Prefer targeted edits. Do not replace or delete a whole file without verifying imports/usages and explaining why.

## 23. Commands and Tool Use

Use PowerShell-compatible, non-destructive commands. Verify command output. Do not claim lint/type/test/build success without running and checking it. Do not use production credentials in local diagnostics.

## 24. Prohibited Actions

Do not fabricate files, tests, API results, implementation status, business facts, prices, reviews, schema, or permissions. Do not mark incomplete work complete, add placeholder production logic, use unlabeled mock data, remove features to pass tests, or change scope without documentation.

## 25. Required Completion Checks

Run `npm run build`. Run lint/type/tests only when scripts exist or after adding them as part of the task. For UI changes, perform responsive and keyboard/accessibility checks; for auth/media/schema changes, review RLS, secret boundaries, provider errors, migration impact, and a controlled end-to-end flow where credentials are available. Review final diff and update relevant docs. Never label local Chromium checks as cross-browser, field-performance, or production-host verification.

## 26. Failure Protocol

When blocked, state the exact blocker and error, list attempted checks, avoid destructive workarounds, record it in `Memory.md` once implementation has begun, and continue safe non-blocked work.

## 27. Documentation Rules

Update PRD for requirement changes, Architecture for technical decisions/schema/API changes, Design for tokens/patterns, Phases for scope/status, and Memory after every meaningful implementation session. Keep facts concise and link to source paths rather than duplicating code.
