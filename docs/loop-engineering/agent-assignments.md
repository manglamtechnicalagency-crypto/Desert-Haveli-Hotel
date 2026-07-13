# Agent Assignments

Owner: Supervisor Agent. Updated every time an issue changes status or owner.

## Issue Ledger

| Issue ID | Task | Assigned Agent | Dependencies | Status | Current Loop |
|---|---|---|---|---|---|
| ISSUE-001 | Bootstrap auth bug: NULL token columns crash Supabase auth on login | Developer | None | Verified | Closed |
| ISSUE-002 | Replace email/password admin login with 6-digit PIN | Developer → QA | ISSUE-001 | QA Passed — server-side lockout fixed (HANDOFF-004), UI Testing pending | UI (blocked, no browser connected) |
| ISSUE-003 | Self-service "change PIN" screen (currently requires manual DB update) | Unassigned | ISSUE-002 | Backlog | — |
| ISSUE-004 | Upload real room photos to Storage (room_images empty for all 4 rooms) | Unassigned | None | Blocked | — |
| ISSUE-005 | Remove floating green WhatsApp capsule button | Unassigned | None | Backlog | — |
| ISSUE-006 | Remove/replace mobile room table below room-card grid | Unassigned | None | Backlog | — |
| ISSUE-007 | Section-spacing corrections (About/Story, Facilities/Experiences, etc.) | Unassigned | None | Backlog | — |
| ISSUE-008 | Mobile navbar redesign (golden pattern, animation, focus mgmt, escape/click-outside) | Unassigned | None | Backlog | — |
| ISSUE-009 | Active navigation state (desktop + mobile) | Unassigned | None | Backlog | — |
| ISSUE-010 | Experience / Guest Services card alignment + bottom-aligned CTAs | Unassigned | None | Backlog | — |
| ISSUE-011 | Architecture watermarks on Experience/Guest Services cards | Unassigned | ISSUE-010 | Backlog | — |
| ISSUE-012 | Desert Safari / Travel Assistant card alignment + image slider | Unassigned | None | Backlog | — |
| ISSUE-013 | Redundant Google Maps text removal + spacing cleanup | Unassigned | None | Backlog | — |
| ISSUE-014 | Guest feedback form (guest_feedback table exists, no UI yet) + "Review us on Google" link | Unassigned | None | Backlog | — |
| ISSUE-015 | Footer simplification | Unassigned | None | Backlog | — |
| ISSUE-016 | Navbar subpages (currently single-page anchors only) | Unassigned | None | Backlog | — |
| ISSUE-017 | RBAC: hide (not just DB-block) actions in Admin UI by role | Unassigned | None | Backlog | — |
| ISSUE-018 | Playwright test suite (installed as devDependency, zero test files exist) | Unassigned | ISSUE-001..017 | Backlog | — |
| ISSUE-019 | End-to-end QA pass on already-built Supabase admin panel (auth, room CRUD, images, pricing, availability) | QA | None | QA in Progress (non-visual matrix done; UI portion blocked, no browser connected) | QA |
| ISSUE-020 | UI baseline capture of current public site + admin panel (no baseline exists yet) | Unassigned | None | Backlog | — |
| ISSUE-021 | Stage-1 retroactive code-quality audit + RLS/Storage/pricing static QA sweep (Final Hardening Loop, framework §23) | Developer → QA | None | QA Passed (Dev + QA gates clear; UI Testing gate pending browser) | QA |
| ISSUE-022 | RLS column-level exposure: `internal_note`/`reason` on `room_price_overrides`/`room_availability` readable by anon via direct REST call (QA-DEFECT-003) | Developer → QA | ISSUE-021 | Verified — column-level REVOKE applied and QA-confirmed (HANDOFF-004) | Closed |
| ISSUE-023 | Enable Supabase Auth leaked-password-protection (dashboard/project-config, not app code) (QA-DEFECT-004) | Unassigned | ISSUE-021 | Analysed — requires Supabase Dashboard access, outside agent tooling scope. **User action required.** | — |
| ISSUE-024 | Performance advisories: unindexed FKs, `auth_rls_initplan` re-eval, unused indexes, multiple-permissive-policies on 7 tables (QA-DEFECT-005) | Developer → QA | ISSUE-021 | Verified — FK indexes added, initplan fixed, policies merged; 3 low-value unused indexes deliberately left (HANDOFF-004) | Closed |
| ISSUE-025 | Pricing engine: non-deterministic tiebreak when two `room_pricing_rules` share priority (no secondary sort) (QA-DEFECT-006) | Developer → QA | ISSUE-021 | Verified — deterministic `priority desc, id asc` ordering added at query + sort level (HANDOFF-004) | Closed |
| ISSUE-026 | Pricing engine: `rooms.promotional_price` has no expiry mechanism in schema (QA-DEFECT-007) | Developer → QA | ISSUE-021 | QA Passed at code level — expiry columns + logic + admin form fields added (HANDOFF-004), UI Testing pending | UI (blocked, no browser connected) |
| ISSUE-027 | Improve admin login UI while preserving PIN authentication and lockout behaviour | Developer → QA Testing → UI Testing | ISSUE-002 | Partially Verified — development and QA passed; runtime UI testing blocked by unavailable independent browser backend | Supervisor Review |
| ISSUE-028 | Remove the floating public-site WhatsApp button while preserving all other contact actions | Developer → QA Testing → UI Testing | None | QA Passed — floating CTA removal and remaining WhatsApp links independently verified (HANDOFF-013); UI visual gate required | Ready for UI Testing |
| ISSUE-029 | Add automatic cycling to public room card galleries | Developer → QA Testing → UI Testing | None | Partially Verified — source/build/manual-control checks pass; completed real-cadence timer/cleanup QA run remains required (HANDOFF-017) | QA in Progress |
| ISSUE-030 | Improve mobile spacing and responsive layout for Desert Safari & Travel Assistance | Developer → QA Testing → UI Testing | None | QA Passed — Safari structure, links, overflow, build, and runtime smoke independently verified (HANDOFF-020); UI visual gate required | Ready for UI Testing |
| ISSUE-031 | Replace contact map placeholder with an accessible Google Maps preview/embed | Developer → QA Testing → UI Testing | None | QA Passed — map preview path, CTA, responsive dimensions, build, and runtime smoke independently verified (HANDOFF-023); UI visual gate required | Ready for UI Testing |
| ISSUE-032 | Improve the mobile booking capsule’s visual hierarchy and touch accessibility | Developer → QA Testing → UI Testing | None | QA Passed — capsule state, keyboard, booking fields/WhatsApp URL, desktop regression, and build independently verified (HANDOFF-028); UI visual gate required | Ready for UI Testing |
| ISSUE-033 | Remove the public room comparison table while preserving room cards and booking actions | Developer → QA Testing → UI Testing | None | QA Passed — table removal, room cards/CTAs, anchor, runtime, and build independently verified (HANDOFF-030); UI visual gate required | Ready for UI Testing |
| ISSUE-034 | Admin panel: mobile responsiveness overhaul (topbar, rooms table → card layout, inline forms) + UX simplification (room form reorganized around name/photos/price/description, advanced fields collapsed, dashboard stat count reduced) | Developer | None | Development Complete — build verified (445 modules, 0 errors); no QA/UI pass run yet (direct edit, not dispatched to subagents) | QA (not yet started) |

Status vocabulary in use: `Backlog`, `Analysed`, `Assigned to Developer`, `Development in Progress`, `Development Complete`, `Ready for QA`, `QA in Progress`, `QA Passed`, `QA Failed`, `Ready for UI Testing`, `UI Testing in Progress`, `UI Passed`, `UI Failed`, `Supervisor Review`, `Verified`, `Blocked`, `Not Reproducible`, `Partially Verified`, `Rejected by Supervisor`, `Returned to Developer`.

## File / Area Ownership

| File or Area | Current Owner | Reason | Release Condition |
|---|---|---|---|
| supabase migrations (hosted, not in repo as files) | Developer Agent | Schema is live in Supabase project `hzzcuqioxcjniimtyrwc` | Advisors clean + QA RLS matrix passes |
| src/admin/** | Developer Agent | Admin panel implementation | QA + UI gates pass per issue |
| ISSUE-027 validation evidence | QA Testing Agent / UI Testing Agent | Independent functional and visual release gates | QA + UI handoffs complete |
| src/App.jsx, src/styles.css | Unowned (no active issue) | — | Reassign when ISSUE-005..016 start |
| docs/loop-engineering/** | Supervisor Agent | Process state | N/A |

Note on tooling reality: there is no CI pipeline, no automated test runner wired up yet (ISSUE-018 is exactly that gap), and no multi-browser automation available in this environment beyond Chromium (via a connected browser extension). See `supervisor-decisions.md` for how this affects gate execution.
