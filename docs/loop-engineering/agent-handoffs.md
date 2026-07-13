# Agent Handoffs

Append-only log. Each handoff is numbered sequentially and never edited after creation — corrections are new entries that reference the original.

## HANDOFF-001

- **From Agent:** Developer
- **To Agent:** Supervisor
- **Issue ID:** ISSUE-001
- **Current status:** Development Complete
- **Files changed:** none (Supabase-hosted `auth.users` row updated directly via SQL: `confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token` set from NULL to empty string)
- **Commands run:** `execute_sql` migration-style UPDATE against project `hzzcuqioxcjniimtyrwc`
- **Tests added:** None automated. Manual retest: user confirmed PIN sign-in reaches `/admin` dashboard.
- **Tests passing:** Manual login retest only
- **Known failures:** None known. Root cause was NULL columns from an earlier manual bootstrap insert (not from application code), so this specific class of bug cannot recur unless another admin account is bootstrapped the same way.
- **Evidence:** Supabase `auth` service logs showing `error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported` before the fix, and a clean 200 on `/token` after.
- **Risks:** No automated regression test exists for this path. If a future admin account is created by directly inserting into `auth.users` again instead of through Supabase's Admin API, the same class of bug can reappear.
- **Required next action:** QA Testing Agent should add this to the authentication test matrix (ISSUE-019) so it has real repeatable coverage instead of one manual confirmation.

## HANDOFF-002

- **From Agent:** Developer
- **To Agent:** Supervisor
- **Issue ID:** ISSUE-002
- **Current status:** Development Complete
- **Files changed:** `src/admin/AdminLoginPage.jsx` (rewritten: 6 discrete digit inputs, auto-advance, paste support, client-side lockout after 5 failed attempts for 30s), `src/admin/admin.css` (`.admin-pin-row` styles), `.env.local` (added `VITE_ADMIN_LOGIN_EMAIL`)
- **Database changes:** `auth.users.encrypted_password` for the super_admin account set to the hash of `123456`
- **Environment changes:** New required env var `VITE_ADMIN_LOGIN_EMAIL` — **not yet added to Vercel**, only in local `.env.local`
- **Commands run:** `npm run build` (in a clean `/tmp` copy, to sidestep local file-lock issues) — 0 errors
- **Tests added:** None automated
- **Tests passing:** Manual login with `123456` confirmed by user
- **Known risks:** PIN-only auth for a single hardcoded email is a real security downgrade vs. email+password (flagged to user directly). No self-service PIN rotation exists (ISSUE-003). No automated brute-force/lockout test exists.
- **Regression areas:** Any future flow that assumes an email input on the login screen (there is none currently).
- **Exact next action:** QA Testing Agent to run the lockout behaviour (5 wrong attempts → 30s lock) and confirm it can't be bypassed by reloading the page (client-side state resets on reload — this is a known weakness, not yet fixed).

## HANDOFF-003

- **From Agent:** Developer
- **To Agent:** Supervisor
- **Issue ID:** ISSUE-020 (Stage-1 retroactive code-quality audit, Final Multi-Agent Hardening Loop, framework spec section 23)
- **Current status:** Development Complete — NOT Verified. Only the Supervisor may mark this Verified.
- **Scope:** Full read of every file built this session: `src/main.jsx`, `src/App.jsx`, `src/lib/supabaseClient.js`, `src/lib/pricing.js`, `src/lib/roomsApi.js`, `src/admin/AdminAuthContext.jsx`, `src/admin/ProtectedRoute.jsx`, `src/admin/AdminLoginPage.jsx`, `src/admin/AdminLayout.jsx`, `src/admin/AdminDashboardPage.jsx`, `src/admin/AdminRoomsListPage.jsx`, `src/admin/AdminRoomFormPage.jsx`, `src/admin/RoomPricingPanel.jsx`, `src/admin/RoomAvailabilityPanel.jsx`, `package.json`, `.env.local`.
- **Findings — secrets/credentials:** No hardcoded PIN, password, or admin email found in any `.jsx`/`.js` file. `VITE_ADMIN_LOGIN_EMAIL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` are all read from `import.meta.env`, sourced from `.env.local`, which is correctly gitignored (`.env.*` pattern in `.gitignore`). The Supabase anon key present in `.env.local` is the publishable/RLS-gated key — intended to be client-exposed, not a leak. Confirmed still **not added to Vercel** (per HANDOFF-002); production admin login and Supabase calls will fail until it is.
- **Findings — dead code / unused imports:** None found. Every import in the 15 audited files is referenced. `slugify` in `roomsApi.js` is defined then re-exported via a separate `export { slugify }` statement (stylistically redundant but not a bug).
- **Findings — real bugs (fixed):**
  1. `src/App.jsx` (public `RoomCard`, guest-facing): when a room's `availability_status` was falsy (null/undefined) and not `"available"`, the code called `.replace(/_/g, " ")` directly on it, which would throw and blank the Rooms section for every guest. Fixed with a null-safe fallback (`(room.availability_status || "unavailable").replace(...)`).
  2. `src/admin/AdminRoomsListPage.jsx`: identical unguarded `.replace()` call on `room.availability_status` in the admin rooms table. Same fix applied (`|| "unknown"`).
  3. `src/admin/RoomAvailabilityPanel.jsx`: identical unguarded `.replace()` call on `b.status` when listing availability blocks. Same fix applied (`|| "unknown"`).
  4. `src/main.jsx`: **no error boundary existed anywhere in the app.** Any uncaught render exception (including the three above, or any future Supabase-shape surprise) would blank the entire page — public site or admin — to a plain white screen with no recovery path. Added a minimal class-based `ErrorBoundary` wrapping `<Root>` (both the public `/*` route and the `/admin/*` route), rendering a plain "Something went wrong, please refresh" message and logging the error to console. This is a pure addition, no existing behavior changed.
- **Findings — race conditions:** The `App()` room-fetch `useEffect` already uses a `cancelled` flag pattern correctly (checks `cancelled` before every `setState` in `.then/.catch/.finally`, cleans up on unmount) — no race condition found there. No other data-fetching `useEffect` in the audited admin pages showed a missing-cleanup pattern that would cause a real bug (they are simple mount-fetch patterns without cross-request races).
- **Findings — schema/migration documentation gap (not fixed, flagged only per task scope):** There are **no `.sql` files, no `/supabase/migrations` directory, and no schema documentation anywhere in this repo.** The entire Postgres schema (tables: `rooms`, `room_images`, `room_features`, `room_price_overrides`, `room_pricing_rules`, `room_availability`, `room_audit_logs`, `admin_profiles`, `guest_feedback`; RLS policies; Storage bucket `room-images` policies) exists only inside the hosted Supabase project `hzzcuqioxcjniimtyrwc` (ap-south-1). **If this repo were cloned fresh with only `.env.local` values, nobody could reconstruct the database** — there is no migration history, no `CREATE TABLE` statements, no RLS policy definitions committed anywhere. Recommend exporting the schema (e.g. `supabase db dump --schema public` or the Supabase dashboard's schema export) into a `supabase/migrations/` or `docs/schema/` directory and committing it, as a follow-up task — this was flagged only, not performed, since it is out of scope for a code-quality pass and risks touching the live database.
- **Files changed:** `src/App.jsx` (1 line, null-safe `availability_status` guard), `src/admin/AdminRoomsListPage.jsx` (1 line, same guard), `src/admin/RoomAvailabilityPanel.jsx` (1 line, same guard on `status`), `src/main.jsx` (added `ErrorBoundary` class + wrapped `<Root>`'s children in it).
- **Commands run:** `cd /sessions/eager-eloquent-darwin/mnt/jaisalmerdeserthotel && npm run build` (failed with `EPERM: operation not permitted, unlink .../dist/assets/demo-hakam-queen-room.jpg` — the known file-lock quirk on this mount). Fallback per task instructions: `rsync -a --exclude node_modules --exclude dist` to `/tmp/build-check-2`, `npm install`, `npm run build` there — succeeded both before and after fixes. Note: the bash-side mount also exhibited the documented stale-cache issue on read-back after `Edit` calls (three edited files were served truncated on first re-read from `/sessions/.../mnt/...`); this was caught by verifying byte counts (`wc -c`) against the Windows-side `Read` tool output as instructed, and resolved by writing the exact verified content directly through the bash mount (heredoc for two files, truncate+append for the truncated tail of `App.jsx`) before the final rebuild.
- **Tests added:** None automated (no test runner is wired up in this repo — confirmed via `package.json`, no `test` script, no Vitest/Jest config found).
- **Tests passing:** `npm run build` — 0 errors, clean output (445 modules transformed), both immediately before and after the fixes. One pre-existing, non-blocking warning: main JS chunk is 643 kB minified (188 kB gzipped), over Vite's 500 kB advisory threshold — not a bug, just a future code-splitting opportunity, left untouched per "no redesign" instruction.
- **Known failures:** None. No RLS policy was touched. No file was deleted.
- **Evidence:** Final build output: `dist/index.html 1.75 kB`, `dist/assets/index-*.css 27.76 kB`, `dist/assets/index-*.js 643.24 kB (gzip 188.54 kB)`, `✓ built in 2.10s`, run from the clean `/tmp/build-check-2` copy after all four fixes were verified byte-for-byte identical between the Windows-side authoritative file and the bash-mount copy actually compiled.
- **Risks:** (1) `.env.local` values are still not present in Vercel's Environment Variables — production admin login and all Supabase-backed room data will fail/fall back to error states until an operator adds them (carried over from HANDOFF-002, re-confirmed here). (2) The missing schema/migration documentation (above) means disaster recovery of the database currently depends entirely on the hosted Supabase project staying intact — there is no way to rebuild it from this repo. (3) The new `ErrorBoundary` is intentionally minimal (no error reporting/telemetry, no retry) — it stops a blank white screen but does not surface actionable detail to the guest or admin.
- **Required next action:** QA Testing Agent and UI Testing Agent should run their independent passes per the Final Hardening Loop framework (section 23). Suggested focus areas for QA: reproduce a room with a null/missing `availability_status` in a test Supabase row and confirm the public Rooms section and admin Rooms list now render "unavailable"/"unknown" instead of crashing; confirm the new ErrorBoundary actually catches a forced render error in both `/` and `/admin` routes. Supervisor should decide whether schema export is scheduled as its own follow-up issue before this is marked Verified.

## HANDOFF-004

- **From Agent:** Developer
- **To Agent:** Supervisor
- **Issue IDs:** ISSUE-002, ISSUE-022, ISSUE-024, ISSUE-025, ISSUE-026 (ISSUE-023 explicitly out of scope — see note at bottom)
- **Current status:** Development Complete — NOT Verified. Only the Supervisor may mark this Verified.
- **Project:** Supabase `hzzcuqioxcjniimtyrwc` ("jaisalmer-desert-haveli", ap-south-1), confirmed `ACTIVE_HEALTHY` via `list_projects` before any change.

### Fix 1 — ISSUE-002 / QA-DEFECT-001: server-side login lockout

- **Root cause:** `src/admin/AdminLoginPage.jsx` tracked `attempts`/`lockedUntil` in React `useState` only; a page reload reset both, so the 5-attempt/30s lockout was purely cosmetic.
- **Migrations applied (`apply_migration`):**
  1. `create_admin_login_attempts_table` — new table `public.admin_login_attempts (email text primary key, failed_count int not null default 0, locked_until timestamptz, last_attempt_at timestamptz not null default now())`. RLS enabled, **no policies created at all** (deny-by-default). `revoke all ... from anon, authenticated, public` as an explicit belt-and-braces on top of the RLS default-deny.
  2. `create_login_lockout_rpc_functions` — two `SECURITY DEFINER`, `SET search_path = 'public'` PL/pgSQL functions:
     - `check_login_lockout(p_email text) returns table(is_locked boolean, locked_until timestamptz, failed_count int)` — pure read, returns zero-row defaults (`false, null, 0`) if no record exists yet.
     - `record_login_attempt(p_email text, p_success boolean) returns table(...)` — upserts the row; on success resets `failed_count`/`locked_until` to 0/null; on failure increments `failed_count`, and at `>= 5` sets `locked_until = now() + interval '30 seconds'` and resets `failed_count` to 0. If an existing `locked_until` has already passed when a new attempt arrives, it's treated as a fresh start (no permanent escalation).
     - `revoke execute ... from public` then `grant execute ... to anon, authenticated` on both — anon must be able to call these pre-login; each function only ever touches the single row keyed by the `p_email` argument, nothing else.
  - Verified via `execute_sql`: ran 5 failed attempts against a throwaway `test@example.com` row — `is_locked` flipped to `true` with a `locked_until` ~30s out on the 5th; a subsequent success reset it to `is_locked=false, failed_count=0`. Row was deleted after the test.
- **Code changed:**
  - `src/lib/roomsApi.js` — added `checkLoginLockout(email)` and `recordLoginAttempt(email, success)`, thin wrappers over `supabase.rpc(...)`.
  - `src/admin/AdminLoginPage.jsx` — on mount (including after a full reload), calls `checkLoginLockout` to seed real lockout state from the server instead of assuming "not locked". `submitPin()` now calls `checkLoginLockout` before attempting sign-in (blocks submission with the existing lockout UI if locked) and calls `recordLoginAttempt` after every attempt (success or failure), using the returned state to drive the UI. The local `attempts`/`lockedUntil` `useState` are kept but are now documented as a thin UI mirror of server state, not the source of truth. PIN-pad UI/UX untouched (same 6 digit inputs, auto-advance, paste support) — this was a backend enforcement fix only.
- **Known risk:** If `record_login_attempt`'s RPC call itself fails (network blip) after a real auth failure, the UI falls back to a generic "Incorrect PIN" without lockout enforcement for that one attempt — the server-side count is still whatever it was before that attempt, so an attacker can't grind past 5 by causing RPC failures (the DB row simply doesn't increment), but the UI won't show a lockout message until the next successful check. Low severity, no bypass of the actual server-side counter.

### Fix 2 — ISSUE-022 / QA-DEFECT-003: column-level exposure of `internal_note`/`reason`

- **Root cause verified:** baseline `information_schema.column_privileges` query confirmed `anon` had table-level `SELECT` (from Supabase's default `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated`) which implicitly covers every column, including `room_price_overrides.internal_note` and `room_availability.internal_note`/`reason`.
- **First attempt failed silently:** ran `revoke select (internal_note) on ... from anon` per the assigned approach — `apply_migration` returned success, but a follow-up `column_privileges` check showed `anon` still had `SELECT` on those columns. Root cause: a column-specific `REVOKE` does not override a broader table-wide `SELECT` grant already held by the role — Postgres column ACLs are additive on top of table ACLs, not restrictive carve-outs from them.
- **Corrected migration (`fix_anon_column_select_internal_fields_v2`):** `revoke select on public.room_price_overrides from anon` (full table-level revoke) followed by `grant select (id, room_id, date, price, discount_type, discount_value, minimum_stay, pricing_label, created_at, updated_at) on public.room_price_overrides to anon` (explicit safe-column allowlist, omitting `internal_note`); same pattern for `room_availability` omitting `internal_note` and `reason`.
- **Verified:** fresh `column_privileges` query confirms `anon` has zero `SELECT` privilege rows for `internal_note` (both tables) or `reason` (`room_availability`), while `authenticated` retains `SELECT` on every column including those two. Table-level `SELECT` was not revoked from `authenticated`, RLS row-filtering is unchanged for either role.

### Fix 3 — ISSUE-024 / QA-DEFECT-005: performance advisories

- **Missing FK indexes (migration `add_missing_fk_indexes`):** added `idx_room_audit_logs_admin_id`, `idx_room_availability_created_by`, `idx_rooms_archived_by`, `idx_rooms_created_by`, `idx_rooms_deleted_by`, `idx_rooms_updated_by`. All 6 `unindexed_foreign_keys` advisories are gone from the post-fix advisor run.
- **`auth_rls_initplan` on `admin_profiles_select_self_or_super` (migration `fix_admin_profiles_rls_initplan`):** read the original policy via `pg_policy`/`pg_get_expr` (`(id = auth.uid()) OR (current_admin_role() = 'super_admin')`), dropped and recreated it with `auth.uid()` wrapped as `(select auth.uid())`, identical logic otherwise. The `auth_rls_initplan` WARN is gone from the post-fix advisor run.
- **Unused indexes — NOT dropped, by design:** `idx_rooms_display_order`, `idx_room_audit_logs_entity`, `idx_guest_feedback_approved` are left in place. At 4 rows total across these tables, "unused" only means no query has hit them yet under near-zero traffic — dropping them is a higher-risk, lower-benefit move than leaving them, per the assigned scope. They still show as `unused_index` INFO (non-blocking) in the post-fix advisor run, alongside the 6 new FK indexes (also INFO, also expected to show as "unused" until real traffic accrues).
- **`multiple_permissive_policies` on 7 tables — merged (migration `merge_multiple_permissive_select_policies`):** read the actual policy definitions for all 7 affected tables via `pg_policy`/`pg_get_expr` first. Confirmed the pattern was uniform across every table: an `_admin_select` policy (`using (is_admin())`, role `authenticated`) and a `_public_select` policy (`using (<row-filter>)`, roles `{anon,authenticated}`) both applied to `SELECT` for the `authenticated` role. Since this app has no non-admin `authenticated` user type (confirmed in the assignment), merging is semantically safe: for each table, split into (a) a `_public_select` policy scoped to role `anon` only with the original row-filter, and (b) a new `_admin_or_public_select` policy scoped to role `authenticated` with `using (is_admin() OR <same row-filter>)` — mathematically identical effective access to the previous two-policy OR, just evaluated once. Applied to `rooms`, `guest_feedback`, `room_availability`, `room_features`, `room_images`, `room_price_overrides`, `room_pricing_rules`. Verified post-migration: `pg_policy` count of `SELECT` policies per table dropped from 2 to... still 2 per table (one for `anon`, one for `authenticated`) — but the advisor check is role+action scoped, so the `multiple_permissive_policies` WARN (which specifically flagged two policies applying to the *same* role `authenticated`) is now gone from the post-fix advisor run for all 7 tables. Row-filter conditions were copied verbatim per table (e.g. `room_availability` kept its `hide_from_website = false` clause, `room_features`/`room_pricing_rules` kept `is_active = true`, `guest_feedback` kept `is_approved = true`) — no access was widened or narrowed.

### Fix 4 — ISSUE-025 / QA-DEFECT-006: pricing tiebreak non-determinism

- **Query-level fix:** `src/lib/roomsApi.js` — `fetchPublicRooms()` now orders the embedded `room_pricing_rules` relation by `.order("priority", { referencedTable: "room_pricing_rules", ascending: false }).order("id", { referencedTable: "room_pricing_rules", ascending: true })` (also added `id`/`created_at` to the selected columns since they weren't previously selected). `fetchAdminRoomById()` (uses `room_pricing_rules ( * )`, so `id` was already selected) gets the same two `.order()` calls. Also fixed `src/admin/RoomPricingPanel.jsx`'s direct `room_pricing_rules` query (not explicitly named in the assignment but found via grep — same class of bug) with a secondary `.order("id", { ascending: true })`.
- **Chosen tiebreak: `id` ascending, not `created_at`.** Reasoning documented in code comments: `id` is guaranteed unique and always present, whereas relying on `created_at` ordering ties correctness to clock precision/inserts happening in the same transaction. "Lower id wins" reads as "first rule created, at this priority, wins" — a reasonable, stable, and simple convention.
- **Defense in depth in `src/lib/pricing.js`:** `getNightlyPrice()`'s sort comparator now does `priority desc, then id ascending (string compare via localeCompare)` directly in the sort function, so correctness doesn't depend solely on the query already being ordered — if this function is ever called with an array built some other way, it is still deterministic.

### Fix 5 — ISSUE-026 / QA-DEFECT-007: promotional price has no expiry

- **Migration (`add_promotional_price_expiry_columns`):** added nullable `rooms.promotional_price_start_date date` and `rooms.promotional_price_end_date date`.
- **`src/lib/pricing.js`:** the promotional-price branch in `getNightlyPrice()` now only applies if `promotional_price` is set AND (`promotional_price_start_date` is null or `<= isoDate`) AND (`promotional_price_end_date` is null or `>= isoDate`). Null on either side means "no bound on that side" — a room with `promotional_price` set but no dates behaves exactly as before (backward compatible).
- **`src/lib/roomsApi.js`:** added the two new columns to `fetchPublicRooms()`'s explicit column list (`fetchAdminRoomById()` already gets them via `select("*")`).
- **`src/admin/AdminRoomFormPage.jsx`:** added `promotional_price_start_date`/`promotional_price_end_date` to `EMPTY_ROOM` and `buildPayload()`, and two new `type="date"` inputs labeled "Promo starts (optional)" / "Promo ends (optional)" directly next to the existing Promotional price field in the Pricing fieldset.

### Build

- `npm run build` directly on the bash mount (`/sessions/eager-eloquent-darwin/mnt/jaisalmerdeserthotel`) transformed all 445 modules successfully but hit the same known `EPERM: operation not permitted, unlink .../dist/assets/demo-hakam-queen-room.jpg` dist-lock quirk documented in HANDOFF-003. Fallback per standing instructions: `rsync -a --exclude node_modules --exclude dist --exclude .git` to a clean `/tmp/build-check-004`, `npm install`, `npm run build` there — succeeded: `dist/index.html 1.75 kB`, `dist/assets/index-*.css 27.76 kB`, `dist/assets/index-*.js 645.26 kB (gzip 188.96 kB)`, `✓ built in 2.05s`, 0 errors. Same pre-existing >500kB chunk-size advisory as HANDOFF-003, untouched (no redesign in scope).
- **Stale-cache mount bug recurred and was caught, per standing instructions:** two files (`AdminLoginPage.jsx`, `AdminRoomFormPage.jsx`) were served truncated mid-file on the bash mount after `Edit` calls (esbuild errored with "Unexpected end of file"), even though the Windows-side `Read` tool showed complete, syntactically valid files. Verified the mismatch (`wc -l`/direct diff against the Windows-side content), then rewrote all five touched files (`AdminLoginPage.jsx`, `AdminRoomFormPage.jsx`, `roomsApi.js`, `pricing.js`, `RoomPricingPanel.jsx`) via heredoc directly on the bash mount using the verified Windows-side content before the build succeeded.

### Advisor delta (before → after, this session)

**Security** — before: `authenticated_security_definer_function_executable` (x2: `current_admin_role`, `is_admin`) + `auth_leaked_password_protection`. After: same two pre-existing `authenticated_security_definer_function_executable` entries + `auth_leaked_password_protection` (untouched, out of scope) **plus new, expected entries from Fix 1:** `rls_enabled_no_policy` on `admin_login_attempts` (INFO — this is the intended deny-by-default design, not a gap), `anon_security_definer_function_executable` x2 (`check_login_lockout`, `record_login_attempt` — expected and accepted, anon must be able to call these pre-login; both are tightly scoped to a single email-keyed row), and `authenticated_security_definer_function_executable` for `record_login_attempt` (same accepted-tradeoff class as the pre-existing `is_admin()`/`current_admin_role()` entries per QA-PASS-004). No new *unexpected* security findings.

**Performance** — before: 6x `unindexed_foreign_keys`, 1x `auth_rls_initplan`, 3x `unused_index`, 7x `multiple_permissive_policies`. After: 0x `unindexed_foreign_keys` (fixed), 0x `auth_rls_initplan` (fixed), 0x `multiple_permissive_policies` (fixed, all 7 tables), 9x `unused_index` (INFO only — the original 3 plus the 6 new FK indexes, all expected to show as unused until real query traffic accrues; deliberately not dropped).

### Known risks

1. The `record_login_attempt` RPC-failure edge case noted under Fix 1 (rare, low severity, no real bypass).
2. The 7-table policy merge (Fix 3) changes policy *structure* but was verified to preserve identical effective access per table — Supervisor/QA should still spot-check one table (e.g. `room_availability`, which has the most complex row-filter with `hide_from_website`) with an actual anon-key HTTP call if a browser/HTTP client becomes available, since all verification this session was via elevated `pg_policy` inspection, not a live anon-authenticated request (consistent with the caveat already noted in QA-DEFECT-003).
3. No automated test suite exists (ISSUE-018 still open) — all verification above is build-success + direct SQL/advisor inspection, not click-through or integration tests.

### ISSUE-023 (leaked password protection) — explicitly not attempted

Confirmed still open. This is a Supabase Dashboard Auth-config toggle (HaveIBeenPwned check) with no SQL/API/migration path available in this environment — `auth_leaked_password_protection` still appears in the security advisor output, unchanged. Requires the user to enable it manually in the Supabase Dashboard (Authentication → Policies / Auth settings). Not attempted, per assignment scope.

### Required next action for QA

Re-run the QA matrix against all 5 fixes: (1) reproduce the ISSUE-002 lockout end-to-end including a page reload mid-lockout to confirm server-side enforcement; (2) attempt a direct anon-key REST call against `room_price_overrides`/`room_availability` requesting `internal_note`/`reason` explicitly and confirm those columns are now omitted/rejected while other columns still return; (3) re-run `get_advisors` independently and cross-check against the delta reported above; (4) if a pricing rule with a duplicate priority is created, confirm the same rule wins consistently across repeated fetches; (5) set a `promotional_price` with start/end dates spanning and excluding today on a test room and confirm the admin form and effective price both respect the window. Supervisor should decide whether the row-filter-preservation claim in Fix 3 needs live anon-HTTP verification before this is marked Verified.

## HANDOFF-006

- **Handoff ID:** HANDOFF-006
- **Issue ID:** ISSUE-027
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independently validate the `/admin` login UI at 320 x 568, 390 x 844, 768 x 1024, and 1280 x 720, with focus/keyboard, horizontal overflow, text wrapping, and reduced-motion checks. No production files were modified.
- **Acceptance criteria:** Runtime screenshots and responsive interaction verification were requested. These could not be completed because there is no connected in-app browser backend. Static source review completed for focus, PIN input layout, responsive breakpoints, and motion behavior.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Browser-runtime bootstrap and browser discovery; static inspection of `src/admin/AdminLoginPage.jsx`, `src/admin/admin.css`, and shared `src/styles.css`.
- **Passing tests:** Static review confirms a six-column PIN grid with `minmax(0, 1fr)`, `min-width: 0`, and mobile gap reduction, which is designed to avoid intrinsic-width overflow at 320 px. It also confirms keyboard focus is programmatically advanced/returned and that PIN focus has a visible gold border plus 4 px halo.
- **Failing tests:** Reduced-motion compliance fails in source: the `/admin` Sign in button inherits the shared animated/translated `.btn:hover` rule without a reduced-motion override (UI-DEFECT-001).
- **Screenshots:** None. Browser evidence is blocked: the in-app browser selection failed and backend discovery returned an empty list.
- **Logs:** “Browser is not available: iab”; `agent.browsers.list()` → `[]`.
- **Known risks:** Actual overflow, wrapping, image rendering, and tab-focus visibility remain unverified at all requested viewports. Firefox/WebKit coverage is also unavailable.
- **Regression areas:** Any shared `.btn` reduced-motion fix affects public-site controls as well as the admin login button; retest both surfaces after a fix.
- **Exact next action:** Developer should add a reduced-motion override for shared button transform/transitions, then UI Testing must rerun the reduced-motion check and capture Chromium screenshots at 320 x 568, 390 x 844, 768 x 1024, and 1280 x 720 once a browser backend is connected. Do not mark ISSUE-027 Verified from this handoff.

## HANDOFF-007

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-027
- **Current status:** Development Complete — not self-approved; requires independent QA and UI review.
- **Root cause:** The initial PIN login page was functionally sound but visually sparse and did not present the admin workspace as a clear, branded, responsive management surface.
- **Implementation summary:** The existing scoped implementation in `src/admin/AdminLoginPage.jsx` and `src/admin/admin.css` provides a split desktop layout with a hotel-image introduction, branded login panel, deliberate PIN-control states, and a single-column mobile layout. This developer pass inspected that implementation, confirmed the referenced `/assets/hotel-exterior-real.jpg` asset exists, and made no further production-code changes because additional visual decisions require independent UI evidence.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None from this UI-only review. Existing server-authoritative PIN lockout handling remains unchanged.
- **Tests added:** None; the repository has no configured automated test script.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, output generated, `✓ built in 4.22s`.
- **Known failures:** None introduced. Build emitted existing non-blocking Framer Motion `"use client"` directive notices and the existing >500 kB chunk-size advisory.
- **Evidence:** `src/admin/AdminLoginPage.jsx` uses the branded split-login structure, and `src/admin/admin.css` contains the responsive breakpoints at 860px and 520px; `public/assets/hotel-exterior-real.jpg` is present. The build command above completed successfully in the project workspace.
- **Risks:** No independent browser, functional login, keyboard, or responsive verification was performed by this developer agent. PIN-only authentication and deployment environment-variable risks remain as documented in HANDOFF-002 and HANDOFF-004.
- **Areas requiring QA:** Verify valid/invalid PIN behavior, lockout persistence, error state, submit disabled/loading state, and authenticated redirect.
- **Areas requiring UI testing:** Verify the `/admin/login` page at desktop, tablet, and mobile widths; confirm no horizontal overflow, readable contrast over the image, usable PIN focus/error states, keyboard flow, and reduced-motion behavior.
- **Required next action:** QA Testing Agent should validate the login flow; UI Testing Agent should independently capture and assess the responsive admin screen. Supervisor must review both evidence before any verification decision.

## HANDOFF-008

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-027 / UI-DEFECT-001
- **Current status:** Development Complete — not self-approved; ready for independent QA and UI retest.
- **Root cause:** The admin login button inherited the shared `.btn:hover { transform: translateY(-2px) }` behavior. The existing reduced-motion rule only disabled the admin spinner, so the button still moved when `prefers-reduced-motion: reduce` was active.
- **Implementation summary:** Added an admin-scoped reduced-motion override in `src/admin/admin.css` for both `.admin-shell .btn` and `.admin-auth-screen .btn`. It disables button transitions and preserves a static hover state with `transform: none`; the login page is covered even though it is outside `.admin-shell`.
- **Files created:** None.
- **Files modified:** `src/admin/admin.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.64s`.
- **Known failures:** No known implementation failures. The build retained existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory.
- **Evidence:** The scoped rule is inside `@media (prefers-reduced-motion: reduce)` in `src/admin/admin.css` and explicitly resets both `transition` and the inherited hover `transform` for the admin application and the standalone login screen.
- **Risks:** This is a static source/build validation only. UI Testing must independently verify the computed styles and keyboard/focus behavior at the required viewports once browser access is available.
- **Areas requiring QA:** Confirm normal PIN login and lockout behavior remain unchanged.
- **Areas requiring UI testing:** Retest UI-DEFECT-001 with reduced motion enabled; also recheck hover, focus, and disabled button states at desktop and mobile widths.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently retest ISSUE-027. Supervisor must review their evidence before any approval.

## HANDOFF-010

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent
- **Issue ID:** ISSUE-027 / QA-DEFECT-008
- **Current status:** Development Complete — not self-approved; ready for independent QA retest.
- **Root cause:** The invalid-PIN handler cleared the controlled inputs and called `focus()` while `loading` was still true. Because every PIN input remained disabled until the `finally` block completed, the browser discarded the focus request and focus fell back to the document body.
- **Implementation summary:** Added `restorePinFocusRef` in `src/admin/AdminLoginPage.jsx`. The error handler now marks focus restoration as pending; a `useEffect` runs after `loading` becomes false and focuses `#pin-0` only after React has rendered it enabled. This leaves successful login, lockout, and normal PIN-entry focus flow unchanged.
- **Files created:** None.
- **Files modified:** `src/admin/AdminLoginPage.jsx`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 6.94s`.
- **Known failures:** No known implementation failures. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** The pending-focus effect is gated by `!loading`, so the first PIN field is enabled before `inputsRef.current[0]?.focus()` executes. This directly addresses QA's reported invalid-PIN recovery path.
- **Risks:** The fix is validated by source inspection and production build only; it requires QA's browser-based reproduction/retest. No UI approval is claimed.
- **Areas requiring QA:** Submit an invalid six-digit PIN; verify all fields clear, `document.activeElement` is `#pin-0`, and typing can resume immediately. Recheck the lockout path and successful redirect for regression.
- **Required next action:** QA Testing Agent should reproduce and close or return QA-DEFECT-008 with evidence. Supervisor must review QA results before further status changes.

## HANDOFF-009

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Issue ID:** ISSUE-027
- **Current status:** QA Failed — functional regression found; not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, `docs/loop-engineering/agent-assignments.md` only. No production code changed.
- **Commands run:** `npm run build`; headless Chromium/Playwright smoke checks against `http://localhost:5173/admin` and `/admin/login`.
- **Tests passing:** Production build passed (445 modules transformed). Signed-out `/admin` and `/admin/rooms` redirect to `/admin/login`; login screen renders meaningful content; six PIN fields render; empty PIN disables Sign in; entering one digit advances focus to `pin-1`; invalid PIN displays `Incorrect PIN.` and clears the fields; valid PIN reaches `/admin` dashboard; sign-out returns to `/admin/login`.
- **Known failures:** QA-DEFECT-008 — after an invalid PIN, focus is not restored to `#pin-0`; it lands on the document body despite the component's focus call. Reproduced after a 750 ms wait.
- **Console/network evidence:** No page exceptions. React Router produced known v7 future-flag warnings. The only 4xx was the expected 400 from the deliberately invalid Supabase password request.
- **Visual evidence:** Not claimed. The in-app browser backend was unavailable (`agent.browsers.list()` returned `[]`), so screenshot-based and responsive visual verification remain the UI Testing Agent's open gate. Playwright was used only for functional DOM and interaction smoke checks.
- **Risks / untested:** The five-attempt lockout persistence path was not rerun in this pass to avoid unnecessarily locking the live admin account; server-authoritative lockout remains separately evidenced under ISSUE-002. No Firefox/WebKit or visual viewport verification was performed.
- **Required next action:** Developer fixes QA-DEFECT-008 without changing auth/lockout behavior; QA retests invalid-PIN focus recovery and adjacent valid-login/protected-route flows. UI Testing remains required after QA passes.

## HANDOFF-009

- **Handoff ID:** HANDOFF-009
- **Issue ID:** ISSUE-027 / UI-DEFECT-001
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent retest of the reduced-motion repair from HANDOFF-008. No production code was modified.
- **Acceptance criteria:** With reduced motion enabled, the admin login Sign in button must not animate or translate on hover; the runtime visual gate must be independently evidenced before approval.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of the reduced-motion block in `src/admin/admin.css`; browser backend discovery.
- **Passing tests:** Static retest passes. The repair sits in `@media (prefers-reduced-motion: reduce)` and covers `.admin-auth-screen .btn` (the login screen) as well as `.admin-shell .btn`; it overrides both inherited `transition` and hover `transform`.
- **Failing tests:** None in source. Runtime checks were not runnable.
- **Screenshots:** None. Browser backend discovery still returns `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** This does not establish computed styles, real hover behavior, focus visibility, or responsive layout in a browser. The general ISSUE-027 runtime UI gate remains blocked, including screenshots at 320 x 568, 390 x 844, 768 x 1024, and 1280 x 720.
- **Regression areas:** The selectors are admin-scoped and do not alter public-site buttons; if the shared `.btn` primitive changes, reduced-motion behavior should be retested.
- **Exact next action:** When a Chromium backend is connected, capture the required viewports with reduced motion enabled and verify the computed hover transform/transition. Supervisor must retain ISSUE-027 as unverified until that runtime evidence exists.

## HANDOFF-011

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-027 / QA-DEFECT-008
- **Current status:** QA Passed — QA-DEFECT-008 resolved; not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; exact invalid-PIN focus-recovery retest plus headless Chromium/Playwright adjacent-flow checks against `http://localhost:5173/admin/login`.
- **Tests passing:** Build passed (445 modules transformed). Invalid PIN shows `Incorrect PIN.`, clears all six fields, re-enables `#pin-0`, restores focus to `#pin-0` after 750 ms, and accepts an immediate retry digit. Valid PIN reaches `/admin` dashboard; Sign out returns to `/admin/login`; a signed-out direct request to `/admin/rooms` returns to `/admin/login`.
- **Console/network evidence:** No page exceptions. The expected deliberately-invalid authentication request returned Supabase HTTP 400. React Router v7 future-flag warnings remain; no relevant application error was observed.
- **Visual evidence:** Not claimed. The in-app browser backend remains absent; Playwright evidence here is functional DOM/interaction coverage only. Required responsive screenshots and UI validation remain with UI Testing.
- **Risks / untested:** The five-attempt lockout persistence path was not repeated to avoid locking the live admin account; it remains separately evidenced under ISSUE-002. Firefox/WebKit, screenshots, and visual viewport checks remain untested.
- **Required next action:** UI Testing Agent completes the outstanding rendered/reduced-motion/responsive gate. Supervisor reviews QA plus UI evidence; only the Supervisor may mark the issue Verified.

## HANDOFF-011

- **Handoff ID:** HANDOFF-011
- **Issue ID:** ISSUE-027
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent source retest after Developer HANDOFF-010, covering invalid-PIN focus restoration and the previous reduced-motion repair. No production code was modified.
- **Acceptance criteria:** On a non-locked invalid PIN attempt, focus should return to the first now-enabled PIN field with a visible focus indicator; reduced-motion login buttons must not transition or translate on hover. Runtime UI evidence remains required for approval.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of `src/admin/AdminLoginPage.jsx` and `src/admin/admin.css`; browser backend discovery.
- **Passing tests:** Static review passes. `restorePinFocusRef` is set while handling an invalid PIN, and the `[loading]` effect focuses the first PIN control only after the enabled render (`!loading`). The PIN focus CSS has a border-and-halo treatment. The reduced-motion override still neutralizes login-button transitions and hover translation.
- **Failing tests:** None in source. Runtime UI verification did not run.
- **Screenshots:** None. Browser discovery remains empty (`[]`).
- **Logs:** No connected browser backend available.
- **Known risks:** This static review cannot prove `document.activeElement`, focus-ring rendering, screen-reader announcement order, or the locked-state focus outcome. Required responsive screenshots and hover checks at 320 x 568, 390 x 844, 768 x 1024, and 1280 x 720 remain absent.
- **Regression areas:** Invalid PIN recovery, server-side lockout state, and the standalone `/admin` login page (outside `.admin-shell`).
- **Exact next action:** QA should retest focus restoration functionally. Once a Chromium backend is connected, UI Testing must verify the visible focus ring and reduced-motion hover behavior at the required viewports. Retain the runtime UI gate as blocked; do not mark ISSUE-027 UI Passed or Verified.

## HANDOFF-012

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-028
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** The public app rendered a global fixed-position `<a className="floating-whatsapp">` after the main content, producing the unwanted green floating WhatsApp button at every viewport.
- **Implementation summary:** Removed only that global floating link from `src/App.jsx`, then deleted its dedicated `.floating-whatsapp` styling, animation, and responsive overrides from `src/styles.css`. All remaining WhatsApp and booking actions, including header, hero, room, service, contact, and enquiry-form actions, remain untouched.
- **Files created:** None.
- **Files modified:** `src/App.jsx`; `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`; `rg -n 'floating-whatsapp|floatPulse' src/App.jsx src/styles.css`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.53s`. The post-change source check confirmed: `No floating WhatsApp markup or styles remain.`
- **Known failures:** None introduced. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** The only removed WhatsApp UI was the fixed global `floating-whatsapp` element and CSS that exclusively served it; other `whatsappUrl(...)` calls are retained.
- **Risks:** No independent browser inspection was performed by this developer agent. UI Testing should confirm the floating control is absent at desktop and mobile widths and that remaining WhatsApp actions are still visible and usable.
- **Areas requiring QA:** Confirm all existing WhatsApp CTA links continue to generate the expected enquiry action.
- **Areas requiring UI testing:** Confirm the floating green button is absent without a layout gap or mobile overlap; inspect the remaining visible booking/contact CTAs.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-028. Supervisor must review their evidence before approval.

## HANDOFF-012

- **Handoff ID:** HANDOFF-012
- **Issue ID:** ISSUE-028
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independently validate removal of the floating WhatsApp CTA and layout safety of the remaining contextual WhatsApp actions. No production code was modified.
- **Acceptance criteria:** The floating CTA is absent; removal creates no blank layout space or mobile overlap; remaining intended WhatsApp CTAs remain visually usable.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of `src/App.jsx`, `src/styles.css`, and all WhatsApp CTA occurrences; browser backend discovery.
- **Passing tests:** Static review confirms contextual WhatsApp links still exist in navigation, hero, room/service sections, booking form, and contact area. Narrow-layout rules make the hero/form/booking actions full width and make contact-card CTAs full width, which is designed to prevent small-screen wrapping.
- **Failing tests:** UI-DEFECT-002. The floating CTA is still rendered and styled as fixed in the workspace; the expected removal is not observable in the current source.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Static source cannot establish actual page gaps, overlay collision, visual wrapping, touch target dimensions, or focus order. The existing fixed CTA may still compete with mobile controls.
- **Regression areas:** Public mobile booking bar, footer proximity, hero navigation CTA, and all contextual WhatsApp links.
- **Exact next action:** Developer/Supervisor should reconcile the claimed ISSUE-028 handoffs with the workspace source; remove the floating `App.jsx` element and its stale styles when appropriate. Then UI Testing must run the required rendered viewport checks once a browser backend is available. Do not mark ISSUE-028 UI Passed or Verified.

## HANDOFF-013

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-028
- **Current status:** QA Passed — not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; static source searches for `floating-whatsapp`, `floatPulse`, WhatsApp URL calls, and CTA attributes; headless Chromium/Playwright DOM/network smoke tests at 1280 x 720 and 390 x 844 against `http://localhost:5173/`.
- **Tests passing:** Build passed (445 modules transformed). `.floating-whatsapp` and all fixed-position WhatsApp anchor counts were zero at both viewports. No stale selector/keyframe remains in `src`. Contextual WhatsApp CTAs remain in the rendered DOM with `wa.me` destinations, including navigation, hero, booking bar, restaurant, services, room/contact, and footer actions.
- **Console/network evidence:** No page exceptions, failed network requests, or relevant app errors. React Router v7 future-flag warnings persisted but are unrelated and pre-existing.
- **Visual evidence:** Not claimed. The in-app browser backend remains unavailable; Playwright was used for functional DOM, computed-style, and network checks only. UI Testing must independently assess layout gaps, overlap, and visual appearance.
- **Required next action:** UI Testing Agent completes the outstanding rendered visual gate. Supervisor reviews the independent QA/UI evidence and retains final verification authority.

## HANDOFF-013

- **Handoff ID:** HANDOFF-013
- **Issue ID:** ISSUE-028 / UI-DEFECT-002
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static retest of floating WhatsApp CTA removal after Developer HANDOFF-012. No production code was modified.
- **Acceptance criteria:** Floating CTA markup and dedicated styling are absent; remaining WhatsApp actions remain in context; runtime visual approval requires browser evidence.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Repository-wide source search for `floating-whatsapp|floatPulse`; static inspection of `src/App.jsx`, `src/styles.css`, responsive CTA rules, and remaining WhatsApp link occurrences; browser backend discovery.
- **Passing tests:** Static retest passes. No `floating-whatsapp`/`floatPulse` source remains; the former global link is absent from the app tree. The removed element was fixed-position, so it had no document-flow footprint. Contextual WhatsApp CTAs remain, and their narrow-layout width rules remain intact.
- **Failing tests:** None in source. Runtime visual tests were not runnable.
- **Screenshots:** None. Browser backend discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Actual visual spacing at the former CTA location, mobile booking-bar relationship, wrapping, visible focus, and touch targets have not been observed in a browser. Firefox/WebKit coverage remains unavailable.
- **Regression areas:** Public footer spacing; mobile booking bar; navigation/hero/contact WhatsApp actions; contextual room and service enquiry links.
- **Exact next action:** With a connected Chromium backend, capture desktop and representative mobile views and verify no blank gap/overlap and usable remaining CTA layout. Keep ISSUE-028's runtime UI gate blocked and do not mark the issue UI Passed or Verified from this static retest.

## HANDOFF-014

- **Handoff ID:** HANDOFF-014
- **Issue ID:** ISSUE-029
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static UI review of the room-card carousel: cadence, layout stability, manual controls, keyboard/focus, swipe, and reduced-motion behavior. No production code was modified.
- **Acceptance criteria:** Auto-slide behavior must exist and respect reduced motion; image frame remains stable; manual controls are usable; keyboard and touch interaction are visually and functionally sound.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static review of `RoomGallery` and carousel CSS; browser backend discovery.
- **Passing tests:** Static review confirms a fixed `4 / 3` gallery frame and matching `object-fit: cover` image sizing, which is designed to prevent image-driven layout shift. Previous/next controls, dots, a focusable group, and a >40 px horizontal swipe path are implemented.
- **Failing tests:** UI-DEFECT-003 — no auto-slide timer/effect exists. UI-DEFECT-004 — dot targets are 8 px and arrow navigation does not cancel browser default scrolling.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** No cadence, animation, layout-shift, focus ring, page-scroll, or mobile-swipe behavior was observed at runtime. No Firefox/WebKit coverage.
- **Regression areas:** Room-card height and grid alignment; reduced-motion preferences; keyboard page scroll; mobile image interactions.
- **Exact next action:** Developer should implement/clarify the intended auto-slide policy and repair manual-control ergonomics. After repair, UI Testing must validate at the required viewports in a connected browser. Do not mark ISSUE-029 UI Passed or Verified.

## HANDOFF-015

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-029 / UI-DEFECT-003 / UI-DEFECT-004
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** `RoomGallery` had manual next/previous, dot, touch, and keyboard controls but no timed cycling lifecycle. Its dot controls also had only 8px pointer targets, and arrow-key handling did not cancel the browser’s default page scroll.
- **Implementation summary:** Added a 3-second timeout-based auto-slide for galleries with two or more images. The timeout is cleaned up and recreated on every relevant state change, preventing timer leaks. It pauses when reduced motion is preferred, when the gallery is outside the viewport (via `IntersectionObserver`), and while it is hovered or focused. Manual next/previous, dot, touch, and keyboard actions reset the timer. Also enlarged dot button targets to 36px while keeping an 8px visual dot, and prevented default page scrolling for left/right carousel keys.
- **Files created:** None.
- **Files modified:** `src/App.jsx`; `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None. Existing `room_images` data, admin image upload, and all API/schema logic are unchanged.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.22s`.
- **Known failures:** No known implementation failures. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** `RoomGallery` now owns an effect guarded by image count, reduced-motion preference, viewport visibility, and interaction pause state; the effect returns `clearTimeout`. The observer effect disconnects on cleanup. Manual controls call `restartAutoSlide()`.
- **Risks:** Browser runtime validation remains necessary for exact 3-second cadence, visibility threshold behavior, touch/keyboard behavior, and mobile gallery layout. No self-approval is claimed.
- **Areas requiring QA:** Verify galleries with 0, 1, 2, and 5–7 images; ensure only multi-image galleries advance, manual actions reset timing, and no timer continues after unmount/navigation.
- **Areas requiring UI testing:** Verify desktop/mobile auto-cycle, no layout shift, hover/focus pause, reduced-motion pause, off-screen pause, 36px dot hit targets, keyboard controls without page scroll, and touch swipe behavior.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-029. Supervisor must review evidence before approval.

## HANDOFF-016

- **Handoff ID:** HANDOFF-016
- **Issue ID:** ISSUE-029 / UI-DEFECT-003 / UI-DEFECT-004
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static retest of carousel cadence, reduced-motion, controls, focus/keyboard behavior, and layout stability after Developer HANDOFF-015. No production code was modified.
- **Acceptance criteria:** Auto-cycle runs only where appropriate, honors reduced motion and interaction pause; manual controls are usable; the stable room-card frame is preserved; runtime UI evidence remains required before approval.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of `RoomGallery` and gallery CSS; browser backend discovery.
- **Passing tests:** Static retest passes. A cleaned-up 3-second timeout exists for galleries with at least two images; reduced-motion, off-screen, hover, and focus guards prevent auto-cycle. Manual actions reset timing. Dot targets are 36 x 36 px; arrow keys cancel default scrolling; the fixed 4 / 3 frame/image sizing remains.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser backend discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Exact slide cadence, visual/image loading shift, observer threshold, visible focus, page-scroll suppression, mobile swipe, and reduced-motion behavior have not been independently observed in a browser. Firefox/WebKit coverage remains unavailable.
- **Regression areas:** Room-card grid height/alignment; keyboard operation; mobile touch interaction; reduced-motion preference changes.
- **Exact next action:** When Chromium is connected, validate carousel behavior and screenshots at the required desktop/mobile widths. Keep ISSUE-029 UI testing blocked—not UI Passed or Verified—from this static retest alone.

## HANDOFF-017

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-029
- **Current status:** Partially Verified — not approved and not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. QA made no production changes.
- **Checks completed:** Independent `npm run build` passed (445 modules transformed). Source inspection confirmed the multi-image-only 3000 ms timeout, `clearTimeout` cleanup, observer disconnect, manual reset paths, and preserved keyboard/swipe behavior. `roomsApi.js` and `AdminRoomFormPage.jsx` are unmodified in the ISSUE-029 diff; existing public image ordering and admin upload/delete/primary/reorder semantics remain intact.
- **Limited runtime evidence:** A mocked-room Playwright fixture verified single-image stability/no controls and exercised dot, keyboard, and touch-swipe selection without page errors or failed requests. The real 3-second auto-slide cadence and post-unmount cleanup run was interrupted before completion; do not interpret the source proof as completed runtime proof.
- **Required next action:** Run one completed real-cadence multi-image fixture check (advance after approximately 3 seconds, no advance for a single image) plus unmount/navigation cleanup before moving the QA gate to Passed. UI Testing must still complete its own visual/responsive gate.

## HANDOFF-018

- **Handoff ID:** HANDOFF-018
- **Issue ID:** ISSUE-030
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static UI review of Safari/Travel Assistance and neighboring responsive sections at the requested phone/desktop breakpoints. No production code was modified.
- **Acceptance criteria:** Verify Safari gutters, text rhythm, card gaps, wrapping, overflow, focus, and reduced-motion behavior across 320 x 568, 360 x 800, 390 x 844, 412 x 915, and desktop.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of `Safari` markup, service-grid/section/mobile CSS, adjacent section rules, focus/reduced-motion rules, and browser backend discovery.
- **Passing tests:** Static review identifies no source-definitive overflow or layout fault. At phone widths the Safari section has safe-area-aware 18 px gutters, 36ch body measure, responsive 16–18 px body size, 14 px service gaps, one-column cards, title wrapping protection, scroll rather than fixed background, and 44 px-minimum CTA links. The desktop/grid breakpoint rules preserve non-narrow cards. Global focus and reduced-motion styles apply.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser backend discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** This cannot prove actual gutters against neighboring sections, typography wrapping/rhythm, contrast, overflow, focus visibility, safe-area behavior, or visual reduced-motion outcome at the target viewports. Firefox/WebKit coverage remains unavailable.
- **Regression areas:** Full-bleed Safari background, shared service-grid breakpoint, mobile section spacing, CTA focus styles, and the nearby Story/Gallery section transition.
- **Exact next action:** When a Chromium backend is connected, capture Safari and adjacent sections at every requested viewport, test keyboard focus and reduced motion, and compare desktop. Keep ISSUE-030 UI validation blocked—not UI Passed or Verified—from this static review alone.

## HANDOFF-018

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-030
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** The Safari section uses a full-width treatment with a four-card compact grid. On narrow devices, inherited title/card margins compounded into an oversized title-to-card gap, while paragraph typography and card padding were not specifically tuned for the available 320–430px content width.
- **Implementation summary:** Added a shared narrow-screen (`max-width: 600px`) Safari layout rule set in `src/styles.css`: safe 18px horizontal gutters, scroll background attachment, reduced title-to-grid spacing, a constrained and more readable lead paragraph, smaller grid gap, consistent mobile card padding/title rhythm, protected long-title wrapping, and 44px minimum CTA height. Desktop styles and JSX remain unchanged.
- **Files created:** None.
- **Files modified:** `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.36s`.
- **Known failures:** None introduced. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** The responsive rules apply to the reusable Safari section hierarchy, rather than targeting a single viewport: `.safari`, `.section-title`, `.service-grid.compact`, and `.service-card` at `max-width: 600px`.
- **Risks:** Browser-based checks are still needed to confirm no horizontal overflow and to review wrapping/rhythm at 320, 360, 390, 412, and 430px. No visual approval is claimed.
- **Areas requiring QA:** Confirm Safari service enquiry CTAs continue to generate the expected WhatsApp action.
- **Areas requiring UI testing:** Test the Safari section at 320–430px and an adjacent tablet/desktop width; inspect gutters, title/paragraph/card spacing, long service-name wrapping, CTA fit, and horizontal overflow.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-030. Supervisor must review evidence before approval.

## HANDOFF-019

- **Handoff ID:** HANDOFF-019
- **Issue ID:** ISSUE-030
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Static responsive retest after Developer HANDOFF-018 for the Safari/Travel Assistance section and neighboring layout transition. No production code was modified.
- **Acceptance criteria:** Assess 320 x 568, 360 x 800, 390 x 844, 412 x 915, and representative desktop gutters, wrapping, card gaps, overflow, focus, and reduced motion.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static responsive-rule/width review and prior fresh browser-backend discovery.
- **Passing tests:** Static source model passes. Phone widths use safe-area-aware 18 px Safari gutters; one-column compact cards; 24 px title/grid spacing; 14 px card gaps; long-title wrap protection; 36ch responsive body copy; and scroll background attachment. The 1280 px desktop content measure aligns to 1180 px, producing approximately 281 px four-column grid cells before padding. No source-definitive overflow defect is present. Global focus-visible and reduced-motion rules remain applicable.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser backend remains unavailable (`[]`).
- **Logs:** No connected browser backend available.
- **Known risks:** No independent runtime confirmation of layout gaps, actual wrapping, browser overflow, contrast, focus outline, or reduced-motion rendering at the required widths; Firefox/WebKit unavailable.
- **Regression areas:** Safari full-bleed background, shared service-grid breakpoints, mobile card height, and adjacent Experiences/Story/Gallery spacing.
- **Exact next action:** Connect a Chromium backend and capture/inspect the named breakpoints before any UI Pass. Retain ISSUE-030 as blocked for runtime UI evidence; do not mark UI Passed or Verified from this static retest.

## HANDOFF-020

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-030
- **Current status:** QA Passed — not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; headless Chromium/Playwright public-route smoke at 1280 x 720 and 390 x 844.
- **Tests passing:** Safari rendered 13 service cards and 13 preserved `safari-enquiry` WhatsApp links at both viewports. Links retain generated `wa.me` destinations and `_blank` targets. Neither viewport had horizontal document overflow; mobile Safari-section width was 362px within a 390px viewport.
- **Console/network evidence:** No page exceptions or failed network requests. Existing React Router v7 future-flag warnings only.
- **Visual evidence:** Not claimed. DOM dimensions verify overflow safety, but adjacent-section spacing/alignment remain UI Testing evidence.
- **Required next action:** UI Testing reviews the final rendered spacing and alignment; Supervisor retains verification authority.

## HANDOFF-021

- **Handoff ID:** HANDOFF-021
- **Issue ID:** ISSUE-031
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent source review of the Contact map preview, its responsive layout, accessibility, and CTA. No production code was modified.
- **Acceptance criteria:** Responsive map preview; accessible iframe/title; no overflow; legible map presentation; correct CTA placement; focus/reduced-motion verification.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection/search of Contact map markup and CSS; browser backend discovery.
- **Passing tests:** Existing placeholder layout has a desktop two-column / <=1060 px single-column arrangement. Its external Google Maps CTA is retained, and mobile contact buttons become full width.
- **Failing tests:** UI-DEFECT-005. Current source has no iframe or equivalent actual map preview; it intentionally renders a map placeholder, so the required embedded-map title/accessibility cannot be present.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** No browser assessment of map provider rendering, desktop/mobile legibility, actual layout spacing, overflow, focus behavior, or reduced-motion presentation. Firefox/WebKit unavailable.
- **Regression areas:** Contact-grid collapse at <=1060 px, 420 px map-card minimum height, contact CTA placement, external Maps destination.
- **Exact next action:** Reconcile the ISSUE-031 developer handoff with the current workspace source and implement the intended accessible map preview if in scope. Afterward, UI Testing must capture desktop/mobile evidence in a connected browser. Do not mark ISSUE-031 UI Passed or Verified.

## HANDOFF-022

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-031
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** The Contact section used a static, image-backed “Google Map Embed” placeholder rather than a map preview. Its Google Maps destination was hard-coded in the JSX rather than maintained with the hotel contact data.
- **Implementation summary:** Added `mapsUrl` and keyless `mapsEmbedUrl` properties to the existing `hotel` data. Replaced the static placeholder with a lazy Google Maps iframe using a descriptive title, a restrictive referrer policy, and `allowFullScreen`. The existing “Open Location in Google Maps” CTA remains, now using `hotel.mapsUrl`. Reworked only the map-card CSS into a responsive iframe-plus-footer layout, including a stacked mobile CTA.
- **Files created:** None.
- **Files modified:** `src/data.js`; `src/App.jsx`; `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** No secrets or API keys were added. The embed uses Google Maps’ public query URL and the existing public location destination.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.15s`.
- **Known failures:** No known implementation failures. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** The iframe has `title`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`, and a responsive CSS frame. The external Google Maps CTA and its new-tab security attributes (`target="_blank"`, `rel="noreferrer"`) are preserved.
- **Risks:** Browser-based validation remains necessary because map-provider rendering, content policy behavior, and exact mobile layout cannot be confirmed by the build alone. No UI approval is claimed.
- **Areas requiring QA:** Confirm the embed URL loads without app errors and the Open Location CTA continues to target the existing hotel location.
- **Areas requiring UI testing:** Check desktop and mobile map sizing, no horizontal overflow, iframe frame visibility, footer CTA fit, keyboard focus, and fallback behavior if the provider cannot load.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-031. Supervisor must review evidence before approval.

## HANDOFF-023

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-031
- **Current status:** QA Passed — not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; headless Chromium/Playwright public-route map checks at 1280 x 720 and 390 x 844.
- **Tests passing:** One lazy Google Maps iframe rendered at both viewports with the expected public query embed URL, descriptive title, referrer policy, and fullscreen support. The existing Maps CTA still points to the hotel search URL with `_blank` and `noreferrer`. Frames measured 637 x 337px desktop and 360 x 250px mobile; no horizontal overflow.
- **Console/network evidence:** No page exceptions or failed network requests after scrolling the lazy iframe into view. Existing React Router v7 future-flag warnings only.
- **Visual evidence:** Not claimed. Runtime dimensions and embed health pass, while UI Testing owns visual fit/appearance review.
- **Required next action:** UI Testing completes the visual/responsive gate; Supervisor retains verification authority.

## HANDOFF-023

- **Handoff ID:** HANDOFF-023
- **Issue ID:** ISSUE-031 / UI-DEFECT-005
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static retest of the Contact iframe map preview, responsive map-card layout, title/accessibility, and CTA placement after Developer HANDOFF-022. No production code was modified.
- **Acceptance criteria:** Accessible map preview/title, responsive mobile/desktop sizing, no overflow, and correctly placed external location CTA.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of Contact map markup/data/CSS; browser backend discovery.
- **Passing tests:** Static retest passes. The iframe has a descriptive title, lazy loading, referrer policy, and fullscreen support. The desktop two-column contact grid collapses at <=1060 px. The map frame has stable desktop and 250 px-minimum mobile sizing; footer content stacks and the CTA becomes full width at <=560 px. No source-definitive overflow or CTA placement fault found.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser backend discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Provider rendering/failure fallback, actual map legibility, focus behavior inside the iframe, visual overflow, CTA placement, and reduced-motion presentation have not been independently observed. Firefox/WebKit unavailable.
- **Regression areas:** Contact-grid breakpoint, map-card min-height, iframe provider policy/loading, and external Google Maps link.
- **Exact next action:** With Chromium connected, capture mobile and desktop Contact section evidence and verify map rendering, no overflow, CTA fit, and focus. Keep ISSUE-031 runtime UI testing blocked—not UI Passed or Verified—from this static retest.

## HANDOFF-024

- **Handoff ID:** HANDOFF-024
- **Issue ID:** ISSUE-032
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent source review of the mobile booking capsule’s responsive hierarchy, accessibility, safe area, and desktop fallback. No production code was modified.
- **Acceptance criteria:** Check 320/360/390/412 px and desktop visual hierarchy, contrast, touch/focus target, safe-area/overlap, clipping, and expanded-state behavior.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static inspection of `BookingBar`, mobile capsule CSS, shared focus/reduced-motion CSS, and browser backend discovery.
- **Passing tests:** Static review confirms below-760 px compact behavior after the defined scroll threshold, a 168 x 58 px capsule with a 56 px control, form-field hiding in compact state, no source-intrinsic clipping at 320 px, and full sticky booking bar behavior on desktop. Shared focus-visible styling and global reduced-motion rules apply.
- **Failing tests:** UI-DEFECT-006. The fixed mobile placement does not account for `env(safe-area-inset-bottom)`.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Actual contrast, clipping, scroll threshold, touch/focus appearance, expanded-form overlap, and device safe-area rendering were not observed. Firefox/WebKit unavailable.
- **Regression areas:** Mobile booking form expansion/minimize, body `booking-expanded` state, bottom viewport controls, and desktop sticky booking bar.
- **Exact next action:** Developer should add safe-area-aware mobile bottom positioning, then UI Testing should run device/runtime checks once Chromium is connected. Do not mark ISSUE-032 UI Passed or Verified.

## HANDOFF-025

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-032
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** The mobile compact booking control was only 168×56px with a minimal centered label hierarchy, generic shadow, and no explicit focus treatment. Its fixed position did not account for mobile safe-area insets.
- **Implementation summary:** Refined only the compact mobile variant: increased its visual/touch footprint to a 64px minimum height, strengthened the golden surface and elevation, established a clearer “Check dates” label / “Book Direct” title hierarchy, added an inset focus-visible outline, and used safe-area-aware left/bottom positioning. Added `aria-expanded` to the expansion trigger. The desktop sticky booking bar and the existing compact/expanded click behavior are unchanged.
- **Files created:** None.
- **Files modified:** `src/App.jsx`; `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 4.16s`.
- **Known failures:** No known implementation failures. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** All capsule-specific changes remain inside the existing mobile booking breakpoint under `.booking-bar.capsule` and `.booking-capsule`; desktop rules are untouched. The trigger still calls `setExpanded(true)` and the existing minimize flow is preserved.
- **Risks:** Browser runtime verification is still needed for actual contrast, safe-area positioning, expanded-form overlap, and focus-ring visibility at mobile widths. No UI approval is claimed.
- **Areas requiring QA:** Confirm the compact trigger still expands the booking form, the minimize action restores it, and booking fields/WhatsApp action retain their behavior.
- **Areas requiring UI testing:** Test at 320–430px with mobile safe-area emulation where possible; inspect visual hierarchy, contrast, touch target, keyboard focus ring, expanded-form coexistence, and no overlap with viewport controls.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-032. Supervisor must review evidence before approval.

## HANDOFF-026

- **Handoff ID:** HANDOFF-026
- **Issue ID:** ISSUE-032 / UI-DEFECT-006
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static retest of the mobile booking-capsule safe-area and sizing repair after Developer HANDOFF-025. No production code was modified.
- **Acceptance criteria:** Safe-area-aware placement; 64 px target; visible sufficient-contrast focus indicator; no clipping; desktop unaffected.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static capsule CSS/markup inspection and browser backend discovery.
- **Passing tests:** UI-DEFECT-006 source repair passes. Capsule left/bottom placement uses safe-area-aware `max()` values; 208 px maximum/viewport-constrained width prevents 320 px overflow; the 66 px frame accommodates the 64 px target; desktop sticky rules remain separate. `aria-expanded` is present on the compact trigger.
- **Failing tests:** UI-DEFECT-007. The new inset white focus outline has approximately 1.5:1–1.9:1 contrast over the specified gold gradient, below the expected 3:1 focus-indicator contrast.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Runtime safe-area layout, capsule contrast, focus ring appearance, scrolling threshold, expanded-form overlap, and desktop regression are unobserved. Firefox/WebKit unavailable.
- **Regression areas:** Booking capsule focus styling, mobile safe areas, booking form expansion/minimize, and desktop sticky booking bar.
- **Exact next action:** Developer should change the focus indicator to a sufficiently contrasting treatment, then UI Testing must recheck in a connected browser at the requested widths. Do not mark ISSUE-032 UI Passed or Verified.

## HANDOFF-027

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-032 / UI-DEFECT-007
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI retest.
- **Root cause:** The capsule’s initial `focus-visible` indicator used a white outline against a golden surface, producing insufficient contrast (reported by UI Testing as approximately 1.5–1.9:1).
- **Implementation summary:** Replaced the white ring with a 3px `var(--brown)` outline and preserved the inset offset, scoped solely to `.booking-capsule:focus-visible` within the mobile booking rules.
- **Files created:** None.
- **Files modified:** `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 3.90s`.
- **Known failures:** No known implementation failures. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** `var(--brown)` is a dark brand color and materially contrasts with the capsule’s golden background; the change does not alter desktop or non-capsule button focus states.
- **Risks:** UI Testing must still confirm actual rendered focus visibility/contrast at mobile widths. No UI approval is claimed.
- **Areas requiring QA:** Confirm compact booking expansion/minimize and direct booking behavior remain unchanged.
- **Areas requiring UI testing:** Retest UI-DEFECT-007 at 320–430px, including keyboard focus and expanded-form transitions.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently retest ISSUE-032. Supervisor must review evidence before approval.

## HANDOFF-028

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-032
- **Current status:** QA Passed — not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; headless Chromium/Playwright mobile capsule and desktop booking-bar interaction checks.
- **Tests passing:** At 390px after the mobile scroll threshold, the capsule started collapsed with `aria-expanded=false`, accepted keyboard Enter, showed the four-field form/minimize control/body state, generated a WhatsApp URL containing entered dates and guest count, then minimized back cleanly. At 1280px, the full four-field booking bar and WhatsApp link remained; no horizontal overflow.
- **Console/network evidence:** No page exceptions or failed network requests during the interaction pass.
- **Visual evidence:** Not claimed. Functional keyboard/state/URL checks pass; UI Testing retains contrast and layout approval.
- **Required next action:** UI Testing completes the outstanding visual gate; Supervisor retains verification authority.

## HANDOFF-028

- **Handoff ID:** HANDOFF-028
- **Issue ID:** ISSUE-032 / UI-DEFECT-007
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static focus-contrast retest after Developer HANDOFF-027, preserving the existing capsule safe-area/size checks. No production code was modified.
- **Acceptance criteria:** Focus outline has sufficient contrast; safe-area-aware capsule placement and 64 px target remain; desktop is unchanged.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static capsule focus/safe-area CSS inspection; browser backend discovery.
- **Passing tests:** Static retest passes. A 3 px `var(--brown)` (`#2a160f`) outline has high contrast over the light-gold capsule gradient; safe-area-aware left/bottom offsets, 208 px max viewport-constrained width, and the 64 px target remain. Desktop rules are untouched.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Focus rendering, device safe-area placement, color appearance, expanded-form overlap, clipping, and desktop interaction were not observed at runtime. Firefox/WebKit unavailable.
- **Regression areas:** Compact booking focus state, mobile safe areas, booking form expansion/minimize, desktop sticky booking bar.
- **Exact next action:** With a connected Chromium backend, test keyboard focus and capsule behavior at 320–412 px plus desktop. Retain ISSUE-032 runtime UI gate as blocked; do not mark UI Passed or Verified from this static retest.

## HANDOFF-029

- **From Agent:** Developer
- **To Agent:** Supervisor, then QA Testing Agent and UI Testing Agent
- **Issue ID:** ISSUE-033
- **Current status:** Development Complete — not self-approved; ready for independent QA/UI review.
- **Root cause:** The public Rooms section rendered a second, horizontally scrollable comparison table after the room-card grid, duplicating room information and booking paths that are already presented in the cards.
- **Implementation summary:** Removed only the public comparison-table JSX from `Rooms()` and its now-unused `.table-wrap` CSS wrapper. The room-card grid, room galleries, prices, availability display, and card-level WhatsApp booking CTAs remain unchanged. No room API, admin, schema, or data behavior was modified.
- **Files created:** None.
- **Files modified:** `src/App.jsx`; `src/styles.css`; `docs/loop-engineering/agent-assignments.md`; `docs/loop-engineering/agent-handoffs.md`.
- **Migration changes:** None.
- **Security impact:** None.
- **Tests added:** None; no automated test script is configured.
- **Commands run:** `npm run build`; `rg -n 'table-wrap|<table' src/App.jsx src/styles.css`.
- **Passing checks:** Vite production build completed successfully: 445 modules transformed, `✓ built in 3.85s`. The post-change source check confirmed: `No public room comparison table markup or wrapper styles remain.`
- **Known failures:** None introduced. Existing non-blocking Framer Motion module-directive notices and the >500 kB chunk-size advisory remain.
- **Evidence:** The `Rooms()` success state now renders only `.rooms-grid`; `RoomCard` remains intact and continues to render its gallery, live price/availability, and booking CTA.
- **Risks:** Browser-based review is still needed to confirm room-card grid rhythm after the table removal across desktop and mobile widths. No UI approval is claimed.
- **Areas requiring QA:** Confirm public rooms still load, cards show their data, and each Book Now/Enquire action remains functional.
- **Areas requiring UI testing:** Confirm the comparison table is absent at desktop/mobile widths and the last room card transitions cleanly to the next section without excess space or overflow.
- **Required next action:** QA Testing Agent and UI Testing Agent should independently validate ISSUE-033. Supervisor must review evidence before approval.

## HANDOFF-030

- **Handoff ID:** HANDOFF-030
- **Issue ID:** ISSUE-033 / UI-DEFECT-008
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent static retest of comparison-table removal and retained Rooms layout after Developer HANDOFF-029. No production code was modified.
- **Acceptance criteria:** Table absent; room-card layout intact; no source-intrinsic blank gap/overflow; Restaurant transition requires runtime confirmation.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Source search/inspection of Rooms markup and CSS breakpoints; browser backend discovery.
- **Passing tests:** Static retest passes. The loaded Rooms state contains only `.rooms-grid`; no comparison table or wrapper is rendered. Existing 3/2/1 grid rules remain. A generic global table selector remains but cannot affect this route without matching markup.
- **Failing tests:** None in source.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Last-room-card/Restaurant visual spacing, overflow, image/card height variation, and focus traversal are unobserved. Firefox/WebKit unavailable.
- **Regression areas:** Room cards/galleries, public room booking CTAs, section background boundary, mobile grid layout.
- **Exact next action:** With Chromium connected, capture mobile and desktop Rooms-to-Restaurant transition and verify no visual gap/overflow. Keep ISSUE-033 runtime UI gate blocked—not UI Passed or Verified—from this static retest.

## HANDOFF-029

- **Handoff ID:** HANDOFF-029
- **Issue ID:** ISSUE-033
- **From Agent:** UI Testing Agent
- **To Agent:** Supervisor Agent / Developer Agent
- **Current branch or checkpoint:** Local workspace at `C:\Users\Vinay Pal\Documents\brain-ai\brain-ai\01 - Clients\jaisalmerdeserthotel\jaisalmerdeserthotel`
- **Task summary:** Independent source review of room-table removal and the Rooms/Restaurant section boundary. No production code was modified.
- **Acceptance criteria:** Table is absent; no blank gap or overflow; room-card spacing remains clean; Restaurant aligns after Rooms.
- **Files created:** None.
- **Files modified:** `docs/loop-engineering/ui-defects.md` only.
- **Database changes:** None.
- **Environment changes:** None.
- **Commands run:** Static search/inspection of Rooms markup, table styles, grid breakpoints, and browser backend discovery.
- **Passing tests:** Room-card grid source retains responsive 3/2/1-column behavior.
- **Failing tests:** UI-DEFECT-008. The table markup and dedicated CSS are still present; the requested removal is not observable in current source.
- **Screenshots:** None. Browser discovery returned `[]`.
- **Logs:** No connected browser backend available.
- **Known risks:** Actual Rooms/Restaurant visual spacing, overflow, and keyboard traversal remain unobserved; the retained table is itself the current implementation mismatch.
- **Regression areas:** Room card grid, room CTA links, mobile table scrolling, Rooms-to-Restaurant section sequence.
- **Exact next action:** Reconcile the reported Developer handoff with current source; remove the rendered comparison-table block and stale CSS if that remains the accepted scope. Then capture mobile/desktop visual evidence with a connected browser. Do not mark ISSUE-033 UI Passed or Verified.

## HANDOFF-030

- **From Agent:** QA Testing Agent
- **To Agent:** Supervisor Agent / UI Testing Agent
- **Issue ID:** ISSUE-033
- **Current status:** QA Passed — not verified.
- **Files changed:** `docs/loop-engineering/qa-defects.md`, `docs/loop-engineering/agent-handoffs.md`, and `docs/loop-engineering/agent-assignments.md` only. No production code changed by QA.
- **Commands run:** `npm run build`; source search; headless Chromium/Playwright public Rooms-route smoke.
- **Tests passing:** `#rooms` contains no public comparison table/table wrapper, while retaining four room cards and four room-booking CTAs. The `#rooms` anchor remains valid and navigable. No horizontal overflow, page errors, or failed network requests were observed.
- **Visual evidence:** Not claimed. UI Testing remains responsible for final spacing/visual review after the table removal.
- **Required next action:** UI Testing completes the visual gate; Supervisor retains verification authority.
