# Delivery Phases

## Roadmap Overview

- Current stage: documentation and local implementation hardening; no deployed production validation is recorded.
- MVP target: accurate public hotel information and direct enquiries, with protected staff administration; this is not an online reservation or payment system.
- Release strategy: validate each phase locally/staging, obtain owner decisions for external services and facts, then perform a controlled production release.

### Status Legend

- **Not Started** — no verified work in this phase.
- **In Progress** — active work with incomplete exit criteria.
- **In Review** — implementation/documentation exists and awaits verification or stakeholder decision.
- **Completed** — all stated exit criteria are verified.
- **Blocked** — cannot proceed without an external decision, credential, or environment change.
- **Deferred** — intentionally postponed.

| Phase | Name | Goal | Dependencies | Status |
|---|---|---|---|---|
| 0 | Repository audit and requirements validation | Verified documentation baseline | Repository access | In Review |
| 1 | Foundation and reproducibility | Repeatable local/staging setup | Phase 0 decisions | Not Started |
| 2 | Domain model and data integrity | Versioned schema and RLS evidence | Phase 1 | Blocked by external schema export |
| 3 | Authentication and authorization hardening | Explicit, testable staff access | Phase 2 | In Progress |
| 4 | Core guest experience | Reliable public discovery/enquiry | Phase 0 | In Progress |
| 5 | Admin content and inventory operations | Safe operator workflows | Phases 2–3 | In Progress |
| 6 | Primary business features | Reservation decision/workflow | Stakeholder decision | Not Started |
| 7 | Integrations and automation | Formalized external services | Provider decisions | Not Started |
| 8 | Reporting and analytics | Privacy-aware measurement | Analytics/consent decision | Not Started |
| 9 | Testing, security, accessibility | Release gates | Phases 1–5 | In Progress |
| 10 | Performance optimization | Measured performance improvements | Approved media/domain | In Progress |
| 11 | Deployment and production validation | Safe production release | Prior phase gates | Not Started |
| 12 | Post-launch improvements | Evidence-led iteration | Production telemetry | Not Started |

## Phase 0 — Repository audit and requirements validation

- Status: **In Review / documentation baseline reconciled 2026-07-16**
- Goal: establish verified scope, risks, design baseline, and reproducible development rules.
- Tasks: [x] inspect source/config/docs; [x] classify implemented/partial/missing; [x] create/update root docs; [x] create `Memory.md` after implementation began; [ ] confirm hotel facts and external schema with stakeholders.
- Deliverables: `PRD.md`, `Architecture.md`, `Rules.md`, `Design.md`, `Phases.md`, stakeholder decision log.
- Acceptance: every documented current feature maps to a repository path; unknown schema/provider choices are marked open.
- Test plan: run `npm run lint` and `npm run build`; do not claim type-check or automated-test coverage while those scripts are absent.
- Risks: documentation may inherit unverified business copy; mitigate with stakeholder review.
- Exit criteria: stakeholder confirms facts, scope, and next phase; external schema owner identified.

## Phase 1 — Foundation and reproducibility

- Status: Not Started
- Goal: make local/staging setup reproducible.
- Tasks: [ ] document Node/npm versions; [ ] add/verify schema migrations for referenced tables and RPCs; [ ] define CI build check; [ ] define storage bucket/CORS setup; [ ] validate Vercel env mapping.
- Acceptance: a clean environment can install, migrate/seed, build, and run documented smoke checks without undocumented manual database state.

## Phase 2 — Domain model and data integrity

- Status: Blocked by external schema export
- Goal: verify rooms, pricing, availability, media, feedback, audit, and admin relationships.
- Tasks: [ ] export base schema; [ ] add constraints/indexes; [ ] test RLS matrix; [ ] test pricing precedence and date boundaries; [ ] document retention/backup.
- Acceptance: schema migrations apply in order; public queries exclude hidden/archive/deleted data; equal-priority pricing is deterministic.

## Phase 3 — Authentication and authorization hardening

- Status: In Progress
- Goal: make staff access and destructive operations explicit and testable.
- Tasks: [ ] confirm role matrix; [ ] test login lockout RPCs; [ ] audit every mutation; [x] add recovery challenge migration/endpoints; [ ] correct recovery email wording; [ ] consume Supabase recovery token/session before password update; [ ] run controlled recovery delivery/reset test; [ ] verify media endpoint auth across deployed infrastructure.
- Acceptance: inactive/non-admin users are rejected; role permissions are enforced by RLS/server; secrets are not client-visible.

## Phase 4 — Core guest experience

- Status: In Progress
- Goal: stabilize public content, room discovery, enquiry conversion, and responsive behavior.
- Tasks: [ ] stakeholder-verify copy/media/rates; [x] validate representative public routes locally; [ ] test booking form/date states; [ ] confirm live vs fallback data behavior; [x] Chromium keyboard/mobile/tablet/desktop QA; [ ] Safari/Firefox and real-device QA.
- Acceptance: guest can reach any intended public section, inspect rooms, and produce a correct WhatsApp enquiry at mobile/tablet/desktop widths.

## Phase 5 — Admin content and inventory operations

- Status: In Progress
- Goal: make operator workflows safe and complete.
- Tasks: [ ] test dashboard/room CRUD; [ ] test archive/restore/delete permissions; [ ] test content draft/publish; [ ] test gallery/image/video validation; [ ] verify audit visibility/retention.
- Acceptance: operator can update approved content and room state without exposing drafts or unsafe media publicly.

## Phase 6 — Primary business features

- Status: Not Started
- Goal: decide and, if approved, implement authoritative reservation/availability workflow.
- Tasks: [ ] decide enquiry-only vs reservation system; [ ] define booking contract; [ ] design server-side availability/price calculation; [ ] add idempotency and payment boundary only if approved.
- Acceptance: no booking is represented as confirmed until the new workflow has server-side state and explicit confirmation semantics.

## Phase 7 — Integrations and automation

- Status: Not Started
- Goal: formalize storage, analytics, notifications, maps, and optional hotel systems.
- Tasks: [ ] choose production media provider; [ ] add monitoring; [ ] add approved analytics; [ ] define notification retries/privacy; [ ] document external rate limits.
- Acceptance: each integration has credentials, failure behavior, smoke test, and owner.

## Phase 8 — Reporting and analytics

- Status: Not Started
- Goal: measure enquiry conversion and operational health without over-collecting personal data.
- Tasks: [ ] instrument CTA events; [ ] define KPIs; [ ] add dashboard/reporting only if approved; [ ] document retention/consent.
- Acceptance: business can distinguish page engagement from enquiry conversion with privacy-compliant events.

## Phase 9 — Testing, security, accessibility

- Status: In Progress
- Goal: establish release-grade automated and manual quality gates.
- Tasks: [x] add lint script; [ ] add type-check and test scripts; [ ] pricing/API tests; [ ] commit Playwright smoke suite; [x] local Chromium responsive/keyboard/accessibility smoke checks; [x] security code review and endpoint validation checks; [ ] deployed header/RLS/provider review; [ ] regression snapshots in CI.
- Acceptance: critical public/admin flows pass automated checks and no known critical security/accessibility defect remains.

## Phase 10 — Performance optimization

- Status: In Progress
- Goal: optimize measured bottlenecks.
- Tasks: [ ] measure Core Web Vitals; [ ] optimize images/video; [x] defer admin code from public routes; [ ] profile/split remaining public bundle; [ ] paginate admin queries; [ ] remove duplicate requests; [ ] confirm canonical production domain before crawl-directive changes.
- Acceptance: agreed performance budgets pass on representative mobile and desktop runs.

## Phase 11 — Deployment and production validation

- Status: Not Started
- Goal: release safely with rollback and monitoring.
- Tasks: [ ] staging deploy; [ ] migration rehearsal; [ ] env/secrets audit; [ ] domain/SSL check; [ ] smoke/rollback drill; [ ] owner sign-off.
- Acceptance: production build, routes, auth, media, public content, direct enquiry, monitoring, and rollback are verified.

## Phase 12 — Post-launch improvements

- Status: Not Started
- Goal: prioritize improvements from real usage and support data.
- Tasks: [ ] review KPIs/defects; [ ] prioritize enhancements; [ ] update PRD/Architecture/Design/Memory; [ ] schedule small releases.
- Acceptance: each enhancement has evidence, scope, owner, and measurable success condition.

## Phase governance

Do not start a dependent phase until its prerequisites and documented decisions are satisfied. Independent remediation workstreams may be marked `In Progress`, but their status does not waive a blocked dependency. A phase cannot exit on code generation alone: relevant tests, build, documentation, and stakeholder decisions must be recorded. Update `Memory.md` after each meaningful implementation session.
