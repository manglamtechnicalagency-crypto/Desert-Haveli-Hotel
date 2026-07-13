# Supervisor Decisions

## DECISION-001 — Adopting the four-agent framework with disclosed constraints

The requested Supervisor / Developer / QA Testing / UI Testing structure is adopted for all work going forward. Three constraints are disclosed up front rather than discovered later:

1. There are no literal named "Developer Agent" / "QA Testing Agent" / "UI Testing Agent" tool types in this environment. They are simulated as distinct subagent dispatches (via the Agent tool, `general-purpose` type) with role-scoped prompts and no shared memory except what is written to these ledger files. The Supervisor (this thread) is the only continuity between them, which is exactly the role the spec assigns it.
2. UI Testing as specified (14 viewports × Chromium/WebKit/Firefox, screenshot diffing against a baseline) requires either a live deployed URL or the user's local dev server reachable through a browser-automation tool. Neither exists yet. WebKit/Firefox automation is not available in this environment under any circumstance — only Chromium, and only if the user connects the browser extension.
3. There is no automated test suite in the repository (ISSUE-018). QA Gate evidence until that exists is manual reproduction, direct database/API queries, and log inspection — real evidence, but not regression-proof the way an automated suite would be. This is recorded honestly rather than presented as equivalent.

## DECISION-002 — Retroactive issue ledger built from actual repo state

`agent-assignments.md` was populated by inspecting the real current repository and Supabase project rather than starting blank, per Supervisor responsibility #2/#3 (inspect repository, build issue ledger). Two issues (ISSUE-001, ISSUE-002) are marked from work already completed in this session; their evidence is retroactive (see `agent-handoffs.md`, `qa-defects.md`) and explicitly flagged as not yet independently QA-verified, only developer-reported and user-confirmed — consistent with the rule that the Developer Agent cannot self-approve.

## Open questions requiring the user's decision before further loops run

These are logged here as pending, not assumed:

- ~~**UI Testing target**~~ — Resolved: user chose local dev server (`npm run dev`) + Claude-in-Chrome extension over a Vercel preview.
- ~~**Scope of this run**~~ — Resolved: user chose the full retroactive loop over already-built work rather than forward-only.

## DECISION-003 — Reconciling Stage-1 hardening audit output (Developer + QA passes complete, UI gate blocked)

Both the Developer Agent (HANDOFF-003) and QA Testing Agent (QA-PASS-002 through 008, QA-DEFECT-003 through 007) completed their independent passes over the retroactively-audited codebase and Supabase project. As Supervisor I reviewed both outputs against the actual ledger state and made the following calls:

1. **ID collision correction:** both subagents were briefed using "ISSUE-020" for the Stage-1 hardening audit, but `agent-assignments.md` already had ISSUE-020 assigned to "UI baseline capture" from earlier ledger population. This was my briefing error, not a subagent error. Corrected by opening a new issue, **ISSUE-021**, for the hardening audit, and leaving the original ISSUE-020 (UI baseline capture) untouched. Historical entries in `agent-handoffs.md` and `qa-defects.md` that say "ISSUE-020" are left as-written (append-only/already-written convention) — this note is the authoritative correction. Do not re-litigate; treat every existing "ISSUE-020" reference inside HANDOFF-003 and QA-DEFECT-003/006/007 as meaning ISSUE-021.
2. **ISSUE-001 promoted to Verified.** Developer fix + independent QA log/query evidence both hold up, there is no UI surface for a backend auth-service bug, and no open defect remains against it. All three gates that apply are clear.
3. **ISSUE-002 held at Partially Verified — Accepted Risk.** The PIN login itself works and is QA-confirmed, but QA-DEFECT-001 (lockout resets on reload) remains open. I am accepting this risk explicitly rather than blocking on it, because: current exposure is a single hardcoded admin account, not a multi-tenant or public-facing credential; the underlying weakness (PIN-only auth) was already flagged to the user as a deliberate tradeoff when they requested it. This is not being swept aside — it stays open and tracked, and must be revisited before ISSUE-003 (self-service PIN rotation) ships or before any second admin account is added.
4. **ISSUE-021 (the hardening audit itself) held at Partially Verified.** Development and QA gates are clear. UI Testing gate cannot run yet — no Claude-in-Chrome browser is connected this session (`list_connected_browsers` returned empty). Per the framework's own gate rules, an issue cannot reach full `Verified` while a required gate is outstanding, so this stays Partially Verified until UI Testing runs or the Supervisor explicitly waives that gate (not waived here, since the user specifically chose local-dev-server UI testing rather than skipping it).
5. **Five new issues opened directly from QA findings**, so they don't get lost inside defect-log prose: ISSUE-022 (RLS column-level exposure on internal notes), ISSUE-023 (leaked-password protection — flagged as a **Supabase Dashboard config change, not a code change**; no MCP tool in this environment exposes an Auth-config write path, so this requires the user to act directly in the Supabase dashboard under Authentication → Policies), ISSUE-024 (performance advisories, informational/tech debt), ISSUE-025 (pricing tiebreak non-determinism), ISSUE-026 (promotional price has no expiry mechanism). All logged as `Analysed`/Backlog, none assigned to Developer yet — Supervisor will prioritize these against the still-open ISSUE-005 through ISSUE-018 public-site QA backlog in a future loop.

## Open blocker carried forward

UI Testing Agent work (for ISSUE-002's lockout defect, ISSUE-019's remaining UI portion, and ISSUE-021's UI gate) cannot start until a Claude-in-Chrome browser is connected to this session and the user's local dev server is running. This was communicated to the user directly; no further loops that require real UI evidence can close until then.

## DECISION-004 — Fix loop on all open QA findings (ISSUE-002, 022, 023, 024, 025, 026)

The user said "fix all issues." I dispatched a Developer Agent against every open finding from the Stage-1 audit, then an independent QA Agent to verify the fixes against the live database and current code (not the Developer's self-report). Both passes are recorded in HANDOFF-004 and the corresponding QA-DEFECT/QA-PASS updates. My calls as Supervisor:

1. **ISSUE-002 (PIN lockout):** Upgraded from "Accepted Risk" to a real fix — lockout is now enforced server-side via a deny-by-default table plus two `SECURITY DEFINER` RPCs, independently tested by QA (5 failed attempts → lock → natural expiry → success clears it), with the test row cleaned up afterward. The DECISION-003 accepted-risk note is superseded; the only remaining gap is the UI Testing gate (visual pass on the lockout message/timer), which is procedural, not a known defect. Held at Partially Verified pending that gate.
2. **ISSUE-022 (RLS column exposure):** Promoted to **Verified**. Column-level REVOKE/GRANT confirmed via `information_schema.column_privileges`; no UI surface applies to a backend privilege fix. Closed.
3. **ISSUE-023 (leaked-password protection):** Unchanged — genuinely cannot be fixed by any tool available in this environment. This is a Supabase Dashboard → Authentication → Policies toggle. **This requires the user to act directly**; I am not able to do it for them. Left open, flagged clearly.
4. **ISSUE-024 (performance advisories):** Promoted to **Verified**. All fixable items (FK indexes, RLS initplan, multiple-permissive-policies merge) resolved and QA-confirmed via fresh advisor pull + direct policy-definition comparison. The 3 low-value "unused" indexes were deliberately left alone (dropping them was higher-risk than the lint warning itself) — documented, not a gap. Closed.
5. **ISSUE-025 (pricing tiebreak):** Promoted to **Verified**. Deterministic ordering is a data/query-layer property fully covered by code and query-level verification; it does not depend on visual rendering, so I did not hold this on the UI gate. Closed.
6. **ISSUE-026 (promo price expiry):** Held at Partially Verified. Unlike ISSUE-025, this fix added new admin-facing form fields (two date inputs) — a genuine UI surface that should get a real visual/interaction pass before I call it done. Development and QA (code-level) gates are clear.

Net result of this loop: 3 issues fully closed (022, 024, 025), 2 held pending the UI Testing gate only (002, 026), 1 still requires the user directly (023). No further Developer/QA loops are scheduled until the UI Testing blocker is resolved — see the carried-forward blocker above.

## DECISION-006 — ISSUE-027 evidence review and release decision

The four-agent loop was executed. Developer evidence is HANDOFF-005, HANDOFF-008, and HANDOFF-010; the independent QA agent reproduced and then passed the keyboard-focus repair in QA-DEFECT-008. UI testing found and independently confirmed the reduced-motion repair (UI-DEFECT-001), but its isolated browser backend returned no browser sessions, so it could not capture runtime screenshots or complete the required viewport matrix. The duplicate HANDOFF-009 and HANDOFF-011 labels are a documentation race between independently dispatched testing agents; their contents remain valid and are distinguished by sender and associated defect.

Supervisor decision: ISSUE-027 is **Partially Verified**, not Verified. Development and functional QA gates pass. The runtime UI gate is blocked by external test-environment availability; no visual pass, cross-browser pass, or screenshot-based approval is inferred. The outstanding release condition is a UI Testing Agent runtime retest of the admin login at the required viewport matrix once its browser backend is available.

## DECISION-007 — ISSUE-028 floating WhatsApp CTA removal

The Developer Agent removed only the global floating WhatsApp anchor and CSS exclusive to it. QA independently confirmed at 1280×720 and 390×844 that no floating/fixed WhatsApp anchor remains, contextual `wa.me` booking links remain valid, and the public page has no console or network failures. UI Testing confirmed source-level removal and no document-flow gap, but its browser backend was unavailable for screenshot validation. ISSUE-028 is therefore Partially Verified pending that runtime visual evidence; no functionality or security blocker is known.

## DECISION-005 — ISSUE-027 admin login UI improvement: four-agent controlled loop

The user requested an improved admin-page UI. The scope is constrained to the existing admin login route and shared admin presentation styles: visual hierarchy, responsive layout, PIN-entry affordance, and explanatory copy. Authentication, lockout enforcement, API behaviour, and the existing route contract must remain unchanged. File ownership is `src/admin/**` for the Developer Agent; QA and UI agents are read-only against production code. The Developer handoff is required before QA validation; QA must pass before UI may mark its visual gate complete. Browser coverage is Chromium only in this environment; unavailable Firefox/WebKit coverage must be recorded as an external constraint rather than inferred.
