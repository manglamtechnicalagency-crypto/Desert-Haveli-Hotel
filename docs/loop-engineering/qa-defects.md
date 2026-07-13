# QA Defects

## QA-DEFECT-001

- **Issue ID:** ISSUE-002
- **Severity:** Medium (security)
- **Environment:** Local dev (Vite dev server), Supabase project `hzzcuqioxcjniimtyrwc`
- **Current behaviour:** The 5-failed-attempt / 30-second lockout on the PIN login is held in React component state only.
- **Expected behaviour:** Lockout should survive a page reload, or be enforced server-side, otherwise it provides no real protection against brute force.
- **Reproduction steps:** 1) At `/admin/login`, enter an incorrect PIN 5 times to trigger the lockout message. 2) Reload the page. 3) Lockout is gone; attempts can resume immediately.
- **Test evidence:** Independently verified 2026-07-11 by QA Testing Agent via static code review of `src/admin/AdminLoginPage.jsx` (no browser available this run, so this is code-logic verification, not a click-through repro). Confirmed: `attempts` (line ~18) and `lockedUntil` (line ~19) are declared exclusively via `useState`. Grepped the full file for `localStorage`, `sessionStorage`, and any server-side call in the failure path (`catch` block, lines 87-98) — none found. The only side effects on a failed attempt are `setAttempts`, `setDigits`, and conditionally `setLockedUntil`, all in-memory React state. A page reload re-mounts the component and re-initializes `attempts` to `0` and `lockedUntil` to `null` with no way to recover prior state. Original defect description is accurate and stands as written.
- **Logs:** N/A
- **Likely affected area:** `src/admin/AdminLoginPage.jsx` (`attempts` / `lockedUntil` state)
- **Regression scope:** Isolated to the login screen; no other flow depends on this state.
- **Assigned back to:** Developer, once Supervisor prioritizes it (currently informational — no fix scheduled)
- **Status (updated 2026-07-11, HANDOFF-004 fix independently re-verified by QA Testing Agent):** Fix confirmed genuine, not self-reported. Read `src/admin/AdminLoginPage.jsx` in full: `useState` `attempts`/`lockedUntil` are now documented and used only as a thin UI mirror; a `useEffect` on mount calls `checkLoginLockout(ADMIN_LOGIN_EMAIL)` (server RPC) to seed real state, and `submitPin()` calls `checkLoginLockout` before every sign-in attempt and `recordLoginAttempt` after every attempt (success or failure). Independently tested the underlying DB logic directly via `execute_sql` against project `hzzcuqioxcjniimtyrwc` (not trusting Developer's self-report): ran `record_login_attempt('vinaypalsingh085@gmail.com', false)` 5 times in sequence — `failed_count` incremented 1→2→3→4, then on the 5th call returned `is_locked: true, locked_until: "2026-07-11 16:06:27.765682+00", failed_count: 0`. Immediately ran `check_login_lockout('vinaypalsingh085@gmail.com')` and confirmed it independently reported `is_locked: true` with the same `locked_until` (db `now()` at that point was `16:06:04`, ~23s before the lock expiry, consistent with the ~30s window). Then ran `record_login_attempt(..., true)` (success) and confirmed it reset `is_locked: false, locked_until: null, failed_count: 0` even though the row was still inside its lockout window — success unconditionally clears it, as claimed. Reset the row to clean state afterward per instructions (final state: `failed_count=0, locked_until=null` — confirmed via a follow-up `select`). Also confirmed: `pg_policies` returns zero rows for `admin_login_attempts` (deny-by-default, RLS enabled with no permissive policies) and `information_schema.table_privileges` returns zero rows for `anon`/`authenticated`/`public` on that table (explicit revoke holds). `has_function_privilege` confirms both `anon` and `authenticated` can `EXECUTE` `check_login_lockout` and `record_login_attempt`, as required for a pre-login caller. This closes the original defect — the lockout is now server-enforced and survives a reload. Original defect description (client-only, reload-resettable state) accurately described the pre-fix bug; it no longer applies to the current code.

## QA-DEFECT-002

- **Issue ID:** ISSUE-001
- **Severity:** High (was a full outage of the login path)
- **Environment:** Supabase project `hzzcuqioxcjniimtyrwc`, `auth` service
- **Current behaviour (before fix):** Every login attempt returned HTTP 500 with a body that rendered as the literal string `{}` in the UI, with no way to sign in at all.
- **Expected behaviour:** Successful login returns a session and redirects to `/admin`.
- **Reproduction steps:** Submit any credentials at `/admin/login` prior to the fix in HANDOFF-001.
- **Test evidence:** Supabase auth log entry: `"error":"error finding user: sql: Scan error on column index 3, name \"confirmation_token\": converting NULL to string is unsupported"`.
- **Logs:** See HANDOFF-001 for the full log line.
- **Likely affected area:** `auth.users` row for the super_admin account (manually bootstrapped outside Supabase's normal signup/admin-invite flow).
- **Regression scope:** Any future manually-inserted `auth.users` row is at risk of the same class of bug. No admin-creation UI/flow exists yet to prevent this from happening again (e.g. if a second admin account is added).
- **Assigned back to:** Closed by Developer fix; independently re-verified by QA Testing Agent 2026-07-11.
- **Status:** QA Verified. Ran `select confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token from auth.users where email = 'vinaypalsingh085@gmail.com'` directly against project `hzzcuqioxcjniimtyrwc` — all 8 columns returned empty string, none NULL. Pulled `get_logs(service: "auth")`: the last 24h window contains exactly one `500`/`error_code: unexpected_failure` event at `2026-07-11T15:14:41Z` with the original `converting NULL to string` error (pre-fix, matches HANDOFF-001's evidence), followed ~8 minutes later by a clean `200` on `/token` at `2026-07-11T15:22:37Z` (`grant_type: password`, successful login). No further auth errors appear after the fix. This closes the loop with agent-executed evidence rather than manual-only confirmation, but Supervisor retains sign-off authority on Final Status.

## QA-DEFECT-003

- **Issue ID:** ISSUE-020 (RLS/Storage independent audit, follow-up from HANDOFF-003 scope)
- **Severity:** Medium (information disclosure)
- **Environment:** Supabase project `hzzcuqioxcjniimtyrwc`, `public` schema, RLS policies (inspected via `pg_policies` under the elevated MCP connection, not via an actual anon/authenticated client — noting this per the QA-scope caveat)
- **Current behaviour:** `room_price_overrides_public_select` and `room_availability_public_select` policies are row-level filters only (require the parent room to be published/visible/non-archived/non-deleted, and for availability, `hide_from_website = false`). RLS in Postgres/PostgREST cannot restrict which *columns* come back — it only decides which *rows* are visible. Both `room_price_overrides` (has an `internal_note` text column) and `room_availability` (has `internal_note` and `reason` text columns) allow any `anon` caller hitting `/rest/v1/room_price_overrides?select=*` or `/rest/v1/room_availability?select=*` directly (bypassing the app's curated `roomsApi.js` queries, which currently only select safe columns) to read those internal-only fields for any published room.
- **Expected behaviour:** Internal-only fields (`internal_note`, `reason`) should never be readable by `anon`/unauthenticated `authenticated` non-admin callers, regardless of which columns the app's own client code happens to request.
- **Reproduction steps:** 1) Using the project's anon key, call `GET {SUPABASE_URL}/rest/v1/room_price_overrides?select=*` (or `room_availability?select=*`) with header `apikey: <anon key>`. 2) Observe `internal_note`/`reason` values returned for any row belonging to a published/visible room.
- **Test evidence:** Verified via `select * from pg_policies where schemaname='public'` — confirmed neither policy has a column restriction (Postgres RLS has no column-level grain) and both explicitly select from the full row. Not verified through an actual anon-authenticated HTTP call (no browser/HTTP client available this run) — this is a policy-definition read, not a live client-side reproduction. Recommend UI/browser-capable agent or Developer confirm with a real anon-key curl call.
- **Logs:** N/A
- **Likely affected area:** `room_price_overrides` and `room_availability` RLS SELECT policies (public.room_price_overrides_public_select, public.room_availability_public_select)
- **Regression scope:** Any future admin UI that stores sensitive text in `internal_note`/`reason` assuming it is admin-only is silently exposed. Currently low real-world impact since these tables have 0 rows, but the schema/policy gap persists regardless of current data.
- **Assigned back to:** Developer — recommend either (a) moving `internal_note`/`reason` to an admin-only table joined server-side, (b) exposing a restricted view/RPC for public reads instead of direct table access, or (c) accepting the risk explicitly since the app's own code never requests those columns (defense-in-depth argument, but doesn't protect against direct API calls with the public anon key, which is inherently client-exposed).
- **Status (updated 2026-07-11, HANDOFF-004 fix independently re-verified by QA Testing Agent):** Fix confirmed. Queried `information_schema.column_privileges` directly against project `hzzcuqioxcjniimtyrwc` for `room_price_overrides` and `room_availability`, filtered to `privilege_type='SELECT'`. Result: `anon` has zero SELECT-privilege rows for `room_price_overrides.internal_note`, `room_availability.internal_note`, and `room_availability.reason` — those three column/role combinations are entirely absent from the grant list. `authenticated` (and `postgres`/`service_role`) retain SELECT on every column of both tables, including the three sensitive ones — no access was over-narrowed for legitimate admin/internal use. Confirmed `anon` still has SELECT on all remaining, non-sensitive columns of both tables (`id`, `room_id`, `date`, `price`, `discount_type`, `discount_value`, `minimum_stay`, `pricing_label`, `created_at`, `updated_at` on `room_price_overrides`; `id`, `room_id`, `status`, `start_date`, `end_date`, `public_message`, `prevent_booking`, `hide_from_website`, `created_at`, `updated_at`, `created_by` on `room_availability`). Cross-checked against `src/lib/roomsApi.js`: `fetchPublicRooms()` only ever selects `date, price, discount_type, discount_value, pricing_label` from `room_price_overrides` and does not select from `room_availability` at all in the public path — so the fix did not remove anything the legitimate public read path actually uses; no false-positive risk of having broken the public site. This closes the original information-disclosure gap for direct anon REST calls requesting `select=*`.

## QA-DEFECT-004

- **Issue ID:** ISSUE-020 (security advisor sweep)
- **Severity:** Low-Medium
- **Environment:** Supabase project `hzzcuqioxcjniimtyrwc`, Auth service configuration
- **Current behaviour:** `get_advisors(type: "security")` returns `auth_leaked_password_protection`: HaveIBeenPwned-based leaked password checking is disabled for the project's password-based auth.
- **Expected behaviour:** Leaked password protection should be enabled so compromised passwords (relevant to the email+password admin sign-in used by `signInAdmin` in `roomsApi.js`) are rejected at signup/password-change time.
- **Reproduction steps:** Run `get_advisors(project_id, type: "security")` — warning is present.
- **Test evidence:** Advisor output: `{"name":"auth_leaked_password_protection","level":"WARN","detail":"Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security."}`. This is a dashboard/project-config toggle, not an application code fix — real gap, not a false positive.
- **Logs:** N/A
- **Likely affected area:** Supabase Auth project settings (not application code)
- **Regression scope:** Only affects the underlying email+password credential (currently set to PIN `123456` per HANDOFF-002) — low incremental risk given ISSUE-002/QA-DEFECT-001 already flag the PIN scheme itself as weak, but still worth closing as a cheap, independent hardening step.
- **Assigned back to:** Supervisor to schedule — this is a project-settings change (Supabase dashboard/Auth config), not a code change, so it may not belong to the Developer agent's normal file-edit scope.
- **Status:** Open

## QA-DEFECT-005

- **Issue ID:** ISSUE-020 (performance advisor sweep)
- **Severity:** Low (informational at current scale)
- **Environment:** Supabase project `hzzcuqioxcjniimtyrwc`, `public` schema
- **Current behaviour:** `get_advisors(type: "performance")` returns: (1) 6 unindexed foreign keys (`room_audit_logs.admin_id`, `room_availability.created_by`, `rooms.archived_by`/`created_by`/`deleted_by`/`updated_by`); (2) `auth_rls_initplan` WARN on `admin_profiles_select_self_or_super` — its policy calls `auth.uid()` per-row instead of `(select auth.uid())`; (3) 3 unused indexes (`idx_rooms_display_order`, `idx_room_audit_logs_entity`, `idx_guest_feedback_approved`); (4) `multiple_permissive_policies` WARN on 7 tables (`guest_feedback`, `room_availability`, `room_features`, `room_images`, `room_price_overrides`, `room_pricing_rules`, `rooms`) where an `_admin_select` and a `_public_select` policy both apply to the `authenticated` role for `SELECT`, so Postgres evaluates both per query.
- **Expected behaviour:** No action required immediately — these are all real but non-blocking at current data volume (`rooms` has 4 rows, most child tables have 0). Flagging as a tracked follow-up so it isn't lost.
- **Reproduction steps:** Run `get_advisors(project_id, type: "performance")`.
- **Test evidence:** Full advisor payload captured during this QA pass (2026-07-11); see the four categories above.
- **Logs:** N/A
- **Likely affected area:** Index definitions and RLS policy structure across `public` schema.
- **Regression scope:** None currently (tiny tables). Will matter once `room_audit_logs` and `rooms` grow.
- **Assigned back to:** Developer/Supervisor to schedule as tech debt, not urgent.
- **Status (updated 2026-07-11, HANDOFF-004 fix independently re-verified by QA Testing Agent):** All four categories independently re-checked via a fresh `get_advisors(type: "performance")` call against project `hzzcuqioxcjniimtyrwc`, cross-checked against `pg_indexes` and `pg_policy`/`pg_get_expr` (not just re-reading the Developer's self-report). (1) Unindexed FKs: `pg_indexes` confirms all 6 indexes now exist (`idx_room_audit_logs_admin_id`, `idx_room_availability_created_by`, `idx_rooms_archived_by`, `idx_rooms_created_by`, `idx_rooms_deleted_by`, `idx_rooms_updated_by`) and none of the 6 `unindexed_foreign_keys` warnings remain in the fresh advisor run. (2) `auth_rls_initplan`: pulled the live policy definition for `admin_profiles_select_self_or_super` via `pg_policy`/`pg_get_expr` — now reads `(id = ( SELECT auth.uid() AS uid)) OR (current_admin_role() = 'super_admin'::text)`, i.e. `auth.uid()` is wrapped in a subselect as claimed, and the warning is absent from the fresh advisor run. (3) Unused indexes: fresh advisor run shows 8 `unused_index` INFO entries, not the 9 HANDOFF-004 projected — minor discrepancy worth noting: `idx_rooms_display_order` (one of the original 3) no longer appears on the unused list at all (confirmed via `pg_indexes` that it still exists, was not dropped — it has simply accrued real usage since HANDOFF-004's run, most plausibly from this QA pass's or other interim queries ordering by `display_order`). The other original 2 (`idx_room_audit_logs_entity`, `idx_guest_feedback_approved`) plus all 6 new FK indexes are present and correctly still flagged unused at near-zero traffic. This is a natural, expected drift (indexes becoming "used" over time), not a regression — flagging only so the count in this record matches what a fresh advisor pull actually shows rather than restating HANDOFF-004's now slightly-stale number. (4) `multiple_permissive_policies`: fresh advisor run returns zero entries for this lint. Spot-checked the policy merge logic directly (went further than the minimum 2-table check) by pulling `pg_policy`/`pg_get_expr` for all 7 affected tables: each now has an `_admin_or_public_select` policy scoped to role `{authenticated}` with `using: (is_admin() OR <original row-filter>)` and a `_public_select` policy scoped to role `{anon}` with the same `<original row-filter>` alone. Confirmed the row-filters are byte-for-byte the same predicates described in HANDOFF-004 for every table (e.g. `room_availability`: `hide_from_website = false AND EXISTS(published/visible/non-archived/non-deleted room)`; `rooms`: `status='published' AND is_visible AND NOT is_archived AND NOT is_deleted`; `guest_feedback`: `is_approved = true`). This is mathematically identical effective access to the original two-policy OR — the merge claim holds under direct SQL-level inspection (live anon-HTTP verification still not possible this run, no browser connected).

## QA-DEFECT-006

- **Issue ID:** ISSUE-020 (pricing engine static review)
- **Severity:** Medium (correctness — potential nondeterministic price display)
- **Environment:** `src/lib/pricing.js` (`getNightlyPrice`) + `src/lib/roomsApi.js` (`fetchPublicRooms`, `fetchAdminRoomById`)
- **Current behaviour:** In `getNightlyPrice`, matching `room_pricing_rules` rows are sorted with `.sort((a, b) => (b.priority || 0) - (a.priority || 0))` — a stable sort, but stable only relative to the order the rows *arrived in*. `fetchPublicRooms()` and `fetchAdminRoomById()` in `roomsApi.js` select the nested `room_pricing_rules` embed with **no `.order()` clause** on that relation. PostgREST/Postgres does not guarantee row order for an unordered embedded resource. If two active rules for the same room and matching date share the same `priority` value (a schema-legal state — `priority` has no uniqueness constraint), which one "wins" as `matchingRules[0]` can vary between requests/deploys instead of being deterministic.
- **Expected behaviour:** A deterministic tiebreak (e.g. secondary sort by `id`, `created_at`, or an explicit admin-set precedence) so the same inputs always produce the same displayed price.
- **Reproduction steps (code-logic, not live-data — no two same-priority rules exist in current data, all pricing tables have 0 rows):** 1) Create two `room_pricing_rules` rows for the same room with identical `priority`, overlapping date ranges, both `is_active = true`. 2) Call `fetchPublicRooms()` repeatedly / compare against a fresh Postgres query plan — order of the embedded `room_pricing_rules` array is not contractually guaranteed without `ORDER BY`.
- **Test evidence:** Read `src/lib/pricing.js` lines 70-81 (sort logic) and `src/lib/roomsApi.js` lines 20-34 and 137-147 (queries selecting `room_pricing_rules` embed with no `.order()`). Confirmed via `list_tables` that `room_pricing_rules.priority` (int4, default 0) has no unique or check constraint preventing duplicate priorities per room.
- **Logs:** N/A
- **Likely affected area:** `getNightlyPrice()` in `src/lib/pricing.js`; the two fetch functions in `src/lib/roomsApi.js`.
- **Regression scope:** Only manifests once an admin creates two rules with equal priority for overlapping dates — not currently possible to trigger with live data (0 rows in `room_pricing_rules`), so no current-production impact, but a latent bug once the pricing feature is used.
- **Assigned back to:** Developer — recommend adding a deterministic secondary key to the sort (e.g. `|| a.id.localeCompare(b.id)`) or an `.order("priority", { ascending: false }).order("id")` at the query level.
- **Status (updated 2026-07-11, HANDOFF-004 fix independently re-verified by QA Testing Agent):** Fix confirmed by direct Read of current files (not from Developer's self-report). `src/lib/roomsApi.js`: `fetchPublicRooms()` (lines ~34-36) now chains `.order("display_order", { ascending: true }).order("priority", { referencedTable: "room_pricing_rules", ascending: false }).order("id", { referencedTable: "room_pricing_rules", ascending: true })`, and `fetchAdminRoomById()` (lines ~163-165) has the identical two secondary `.order()` calls on the `room_pricing_rules` embed. `src/admin/RoomPricingPanel.jsx`'s direct query (lines ~29-34) also now has `.order("priority", { ascending: false }).order("id", { ascending: true })` — this file wasn't named in the original defect but is the same class of bug and was caught and fixed. `src/lib/pricing.js`'s `getNightlyPrice()` sort comparator (lines ~72-83) does `priority desc` first, then on a tie falls back to `String(a.id).localeCompare(String(b.id))` ascending. Traced through by hand with two hypothetical same-priority rules (`priority: 5`, ids `"aaa..."` and `"bbb..."`): `byPriority` evaluates to 0 (tie), so the comparator falls to `"aaa...".localeCompare("bbb...")`, which is negative, placing the `"aaa..."` rule before `"bbb..."` — `matchingRules[0]` is deterministically the lower-id rule on every call, regardless of input array order, satisfying the "same inputs always produce the same displayed price" requirement. This is defense-in-depth on top of the query-level ordering, not a substitute for it, exactly as documented. No live two-same-priority-rule reproduction was possible (0 rows in `room_pricing_rules` in the live DB), so this is a code-logic trace, not a live-data repro — consistent with the original defect's own reproduction-steps caveat.

## QA-DEFECT-007

- **Issue ID:** ISSUE-020 (pricing engine static review)
- **Severity:** Low (design gap, not a code bug)
- **Environment:** `src/lib/pricing.js` (`getNightlyPrice`) + `rooms` table schema
- **Current behaviour:** The pricing priority chain's 3rd tier, "promotional price," reads directly from `rooms.promotional_price` (confirmed via `list_tables`: a plain nullable `numeric` column with no paired start/end date columns anywhere in the `rooms` table). Unlike `room_price_overrides` (has an explicit `date`) and `room_pricing_rules` (has `start_date`/`end_date`), there is no schema-level expiry mechanism for `promotional_price`. Once an admin sets it, `getNightlyPrice` will keep using it in preference to `weekend_price`/`base_price` indefinitely, with no code path that ever "expires" it automatically.
- **Expected behaviour:** Either document that `promotional_price` is a manually-managed, non-expiring override (admin must remember to clear it), or migrate scheduled promotions to `room_pricing_rules` with `rule_type = 'promotional'` (which does support `start_date`/`end_date`) and deprecate the flat `rooms.promotional_price` column for anything time-bound.
- **Reproduction steps (code-logic only):** Read `getNightlyPrice()` — the `room.promotional_price != null` branch (line 83-85 of `pricing.js`) has no date comparison at all, unlike the override and rule branches above it.
- **Test evidence:** Read `src/lib/pricing.js` in full; cross-checked `rooms` column list from `list_tables` (verbose) — no `promotional_price_start`/`promotional_price_end` or similar columns exist.
- **Logs:** N/A
- **Likely affected area:** `getNightlyPrice()` in `src/lib/pricing.js`, admin room form wherever `promotional_price` is edited.
- **Regression scope:** Operational risk only (stale promo price shown to guests after a promotion should have ended) — not a code crash, not currently reproducible with live data (no rooms currently have `promotional_price` set, unverified — not queried live per the "don't need to" scope, this is a schema/code-logic finding).
- **Assigned back to:** Developer/Supervisor — decide whether this is worth a schema change (add expiry columns) or just an admin-UI warning/documentation note.
- **Status (updated 2026-07-11, HANDOFF-004 fix independently re-verified by QA Testing Agent):** Fix confirmed via `list_tables(verbose)` against project `hzzcuqioxcjniimtyrwc`: `rooms.promotional_price_start_date` and `rooms.promotional_price_end_date` both exist, `data_type: "date"`, `options: ["nullable","updatable"]` — matches the claimed nullable-date schema change exactly. Read `getNightlyPrice()` in `src/lib/pricing.js` (lines ~94-101): the promotional-price branch now computes `promoStarted = !room.promotional_price_start_date || isoDate >= room.promotional_price_start_date` and `promoNotEnded = !room.promotional_price_end_date || isoDate <= room.promotional_price_end_date`, and only returns the promotional price if `promotional_price != null && promoStarted && promoNotEnded` — null on either bound correctly means "unbounded on that side," so a room with `promotional_price` set but no dates keeps its old always-on behavior (backward compatible), confirmed by inspection. Read `src/admin/AdminRoomFormPage.jsx`: `EMPTY_ROOM` includes both new fields (initialized to `""`), `buildPayload()` maps them to `room.promotional_price_start_date || null` / `room.promotional_price_end_date || null` for submission, and two `type="date"` inputs labeled "Promo starts (optional)" / "Promo ends (optional)" are present in the Pricing fieldset, correctly wired via `value={room.promotional_price_start_date || ""}` / `onChange={(e) => update(...)}`. `fetchPublicRooms()` in `roomsApi.js` also now selects both new columns so the public price calculation actually receives them. All pieces (schema, pricing logic, admin form) are consistently wired end-to-end.

## QA-PASS-001 — Auth health regression (ISSUE-001)

- **Verified:** All 8 `auth.users` token columns (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`) for `vinaypalsingh085@gmail.com` are empty string, not NULL. `get_logs(service:"auth")` shows the pre-fix 500 (`converting NULL to string is unsupported`) at 15:14:41Z and a clean 200 login at 15:22:37Z, no errors after. See QA-DEFECT-002 update above for full detail.

## QA-PASS-002 — RLS enabled on all 9 required tables

- **Verified:** `list_tables` (verbose) confirms `rls_enabled: true` on `rooms`, `room_images`, `room_features`, `room_price_overrides`, `room_pricing_rules`, `room_availability`, `room_audit_logs`, `admin_profiles`, and `guest_feedback` — all 9.

## QA-PASS-003 — No anon/public write access on any table

- **Verified:** Full `pg_policies` dump for `schemaname='public'` reviewed row by row. Every `INSERT`/`UPDATE`/`DELETE` policy across all 9 tables is scoped to role `authenticated` (or `public` for `admin_profiles`, which still gates on `current_admin_role() = 'super_admin'`) and requires `current_admin_role()`/`is_admin()` to return an admin role. The only `anon`-inclusive write policy anywhere is `guest_feedback_public_insert` (`roles: {anon,authenticated}`, `with_check: is_approved = false`) — this is an intentional public guest-feedback submission form that force-sets `is_approved = false`, so it cannot be used to inject pre-approved reviews. No anon write access found anywhere else.

## QA-PASS-004 — `is_admin()`/`current_admin_role()` SECURITY DEFINER pattern is safe

- **Verified:** Pulled full function source via `pg_get_functiondef`. Both functions are `SECURITY DEFINER`, `STABLE`, `SET search_path = 'public'` (prevents search-path hijacking), and their bodies only ever query `admin_profiles where id = auth.uid() and is_active = true` — i.e. they can only ever resolve the *calling* user's own role, no parameter-driven or cross-user lookup is possible. Confirmed via `has_function_privilege`: `anon_can_execute = false`, `authenticated_can_execute = true` for both. The `get_advisors(security)` WARN on these two functions is the expected/acceptable tradeoff for this common Supabase RLS-helper pattern (avoids infinite RLS recursion on `admin_profiles`), not a real vulnerability.

## QA-PASS-005 — Storage bucket `room-images` policy sanity

- **Verified:** `storage.buckets` row for `room-images` has `public: true`. `pg_policies` for `schemaname='storage', tablename='objects'` shows exactly 3 policies, all scoped to `bucket_id = 'room-images'` and role `authenticated`: `room_images_storage_admin_insert`, `_update`, `_delete`, each gated on `current_admin_role() = ANY (super_admin, admin, editor)`. No anon write policy exists. No explicit SELECT policy exists on `storage.objects` for this bucket, which is expected and correct — Supabase serves public-bucket reads via the `/storage/v1/object/public/` URL path, which bypasses table-level RLS by design; a direct PostgREST query against `storage.objects` would be denied (no permissive SELECT policy = implicit deny), which is also correct.

## QA-PASS-006 — Pricing date-range boundaries are inclusive, no off-by-one found

- **Verified:** `ruleMatchesDate()` in `pricing.js`: `if (rule.start_date && isoDate < rule.start_date) return false; if (rule.end_date && isoDate > rule.end_date) return false;` — both boundaries inclusive (`start_date <= isoDate <= end_date`), correct ISO-8601 lexicographic string comparison. `getStayBreakdown()`'s night loop (`while (cursor < end)`) correctly treats `checkIn` inclusive / `checkOut` exclusive, matching the documented "checkout night is never billed" intent. No off-by-one bug found in either path.

## QA-PASS-007 — HANDOFF-003's three null-safe `.replace()` fixes are genuinely present

- **Verified by direct Read of current files (not from Developer's self-report):**
  - `src/App.jsx` line 423: `{room.availability_status === "available" ? "Not currently bookable" : (room.availability_status || "unavailable").replace(/_/g, " ")}` — null-safe guard present.
  - `src/admin/AdminRoomsListPage.jsx` line 190: `{(room.availability_status || "unknown").replace(/_/g, " ")}` — null-safe guard present.
  - `src/admin/RoomAvailabilityPanel.jsx` line 113: `{(b.status || "unknown").replace(/_/g, " ")}` — null-safe guard present.
  - All three match HANDOFF-003's description exactly. No browser available this run to force-trigger a null `availability_status` render live; this is a static-code confirmation that the guards exist and are syntactically correct (short-circuit `||` before `.replace()` cannot throw on null/undefined).

## QA-PASS-008 — `ErrorBoundary` in `main.jsx` is a real, functioning boundary, not cosmetic

- **Verified by direct Read of `src/main.jsx`:** `class ErrorBoundary extends React.Component` implements `static getDerivedStateFromError()` (returns `{hasError: true}`, correctly triggers React's error-boundary render swap) and `componentDidCatch(error, info)` (logs to console). `render()` has a genuine conditional fallback path (returns the "Something went wrong" markup when `this.state.hasError`, otherwise returns `this.props.children`) — this is the complete, correct React error boundary API surface, not a fake wrapper. Confirmed `<ErrorBoundary>` wraps the entire `<Root>` component's `<BrowserRouter><Routes>...</Routes></BrowserRouter>`, which includes both the `/admin/*` route (`AdminApp`) and the `/*` public route (`App`) — so both surfaces are covered by one boundary. Not runtime-verified (no browser this run) but the code is unambiguously a real implementation.

## QA-PASS-009 — HANDOFF-004 build regression check independently reproduced

- **Verified:** Ran `npm run build` myself directly on the bash mount (`/sessions/eager-eloquent-darwin/mnt/jaisalmerdeserthotel`), not trusting HANDOFF-004's self-reported build log. Reproduced the same known `EPERM: operation not permitted, unlink .../dist/assets/demo-hakam-queen-room.jpg` dist-lock quirk documented in HANDOFF-003/004, after all 445 modules transformed successfully. Fell back per standing instructions: `rsync -a --exclude node_modules --exclude dist --exclude .git` into a clean `/tmp/qa-build-check`, `npm install`, `npm run build` there. Result: `✓ 445 modules transformed`, `dist/index.html 1.75 kB`, `dist/assets/index-*.css 27.76 kB (gzip 6.62 kB)`, `dist/assets/index-*.js 645.26 kB (gzip 188.96 kB)`, `✓ built in 1.97s`, 0 errors — output sizes match HANDOFF-004's reported numbers exactly (`645.26 kB`, gzip `188.96 kB`). Only warning is the pre-existing >500kB chunk-size advisory (untouched, no redesign in scope) and benign `framer-motion` "use client" directive-ignored notices (build-tool noise, not errors). This independently confirms HANDOFF-004's build claim is real and reproducible, not just self-reported.

---

*Template for new entries:*

```markdown
## QA-DEFECT-NNN
Issue ID:
Severity:
Environment:
Current behaviour:
Expected behaviour:
Reproduction steps:
Test evidence:
Logs:
Likely affected area:
Regression scope:
Assigned back to:
Status:
```

## QA-EVIDENCE-012 — Room gallery auto-slide source/build gate

- **Issue ID:** ISSUE-029
- **Environment:** Local workspace, Vite production build, and an isolated Playwright fixture using mocked public-room responses; 2026-07-12.
- **Source/build evidence:** `npm run build` passed (445 modules transformed). `RoomGallery` has a 3000 ms timeout only when `imageCount >= 2`; its effect returns `clearTimeout`, and the visibility observer disconnects during cleanup. Zero/single-image galleries do not create the observer or timeout. Manual arrows call `go()`, dots reset the timer and select their index, swipe calls `go()` above the 40px threshold, and left/right keys prevent default scrolling before calling `go()`.
- **API/admin regression evidence:** `git diff --name-only -- src/lib/roomsApi.js src/admin/AdminRoomFormPage.jsx` returned no modified files. The existing public `room_images` ordering, `uploadRoomImage`, `deleteRoomImage`, `setPrimaryImage`, `reorderRoomImages`, and admin form upload/delete/primary call sites remain present and unchanged.
- **Limited runtime evidence:** An isolated mocked-data browser fixture rendered a multi-image and a single-image gallery without page errors or failed requests. It confirmed single-image galleries render no arrows/dots and retain their image; dot, keyboard, and dispatched touch-swipe paths changed the multi-image selection, with keyboard navigation leaving `scrollY` unchanged. The accelerated-timer experiment was inconclusive, and a final real 3-second cadence run was interrupted before completion.
- **Status:** Partially Verified — no defect is established, but QA cannot mark the auto-slide requirement passed until its real cadence/cleanup behavior is observed in a completed runtime run. No visual approval is implied.

## QA-PASS-010 — Floating WhatsApp CTA removal regression check

- **Issue ID:** ISSUE-028
- **Environment:** Local Vite server at `http://localhost:5173/`; headless Chromium/Playwright at 1280 x 720 and 390 x 844; 2026-07-12.
- **Verified:** The rendered desktop and mobile DOM each contain zero `.floating-whatsapp` elements and zero WhatsApp-labelled anchors with computed `position: fixed`. Static source search returned no `floating-whatsapp` or `floatPulse` matches in `src`.
- **Preserved behavior:** Contextual WhatsApp actions remain available in navigation, hero, booking bar, restaurant, services, rooms, contact, and footer. Runtime inspection found their generated targets use `https://wa.me/917568455656?text=...` and `_blank`; the hero booking link was specifically checked.
- **Regression evidence:** `npm run build` passed with 445 modules transformed. Public route rendered meaningful content at both viewports with no framework overlay, page errors, failed network requests, or relevant console errors. React Router emitted only its existing v7 future-flag warnings.
- **Status:** QA Passed — no functional or regression defect found. This does not close the separate UI visual gate or authorize verification.

## QA-DEFECT-008

- **Issue ID:** ISSUE-027
- **Severity:** Medium (accessibility / recovery-path usability)
- **Environment:** Local Vite server at `http://localhost:5173/admin/login`; headless Chromium through Playwright; 1280 x 720 viewport; 2026-07-11.
- **Current behaviour:** Submitting an invalid six-digit PIN correctly renders `Incorrect PIN.`, clears all six fields, and re-enables them, but keyboard focus ends on the document body rather than returning to `#pin-0`.
- **Expected behaviour:** After a failed PIN submission, focus should land on the first PIN field so keyboard users can immediately retry. This is also the intent of `inputsRef.current[0]?.focus()` in `AdminLoginPage.jsx`.
- **Reproduction steps:** 1. Open `/admin/login` signed out. 2. Enter any invalid six-digit PIN. 3. Wait for the `Incorrect PIN.` alert and at least 750 ms. 4. Inspect `document.activeElement.id`; it is empty/body instead of `pin-0`.
- **Test evidence:** Two independent local Playwright runs reproduced the result. The first observed `focus: ""` after the error; the confirmation run waited 750 ms and observed `focusAfterError: "body-or-none"` while `#pin-0` was enabled. The failed authentication request was the expected `400` from Supabase `/auth/v1/token?grant_type=password`; no page exceptions occurred.
- **Logs:** No page errors. React Router emitted two known v7 future-flag warnings. The only failed network request was the intentional invalid-authentication `400`.
- **Likely affected area:** `src/admin/AdminLoginPage.jsx`, the `catch` branch of `submitPin()` and its interaction with the disabled/loading render state.
- **Regression scope:** Invalid-PIN retry flow only; positive login, sign-out, protected-route redirect, disabled-submit state, and PIN auto-advance passed in the same smoke pass.
- **Assigned back to:** Developer Agent via Supervisor.
- **Status (retested 2026-07-11 after HANDOFF-010):** Resolved — QA retest passed. In headless Chromium, an invalid PIN displayed the error, cleared every field, re-enabled `#pin-0`, and left `document.activeElement.id === "pin-0"` after 750 ms. A subsequent keyboard digit was accepted in that first field. Adjacent valid-login, sign-out, and direct protected-route redirect checks also passed. This closes the QA defect only; it does not satisfy the separate visual/UI gate.

## QA-PASS-013 — Safari section responsive regression check

- **Issue ID:** ISSUE-030
- **Environment:** Local Vite server at `http://localhost:5173/`; headless Chromium/Playwright at 1280 x 720 and 390 x 844; 2026-07-12.
- **Verified:** The Safari section rendered all 13 service cards and all 13 `safari-enquiry` links at both viewports. Each retained a `https://wa.me/917568455656?text=...` target and `_blank` behavior.
- **Responsive/runtime evidence:** `document.documentElement.scrollWidth <= window.innerWidth` at desktop and mobile (no horizontal overflow). At 390px, the Safari section measured 362px within a 390px viewport. No page exceptions or failed network requests occurred.
- **Build/console evidence:** `npm run build` passed with 445 modules transformed. Only existing React Router v7 future-flag warnings appeared; no relevant application warning/error was observed.
- **Status:** QA Passed — functional/responsive regression checks pass. This does not replace the separate UI visual gate or authorize final verification.

## QA-PASS-014 — Google Maps preview/embed regression check

- **Issue ID:** ISSUE-031
- **Environment:** Local Vite server at `http://localhost:5173/`; headless Chromium/Playwright at 1280 x 720 and 390 x 844; 2026-07-12.
- **Verified:** Exactly one lazy Google Maps iframe renders at both viewports with `https://www.google.com/maps?q=Desert%20Haveli%20Guest%20House%20Jaisalmer&output=embed`, descriptive title, restrictive referrer policy, and fullscreen support. The existing Google Maps CTA retains the hotel search URL, `_blank`, and `noreferrer`.
- **Responsive/runtime evidence:** The iframe measured about 637 x 337px desktop and 360 x 250px mobile, with no horizontal document overflow. No page exceptions or failed network requests occurred after the lazy iframe entered view.
- **Build/console evidence:** `npm run build` passed with 445 modules transformed. Only existing React Router v7 future-flag warnings appeared; no relevant application error occurred.
- **Status:** QA Passed — no map-path, CTA, frame, or runtime regression found. UI visual approval remains separate.

## QA-PASS-015 — Mobile booking capsule regression check

- **Issue ID:** ISSUE-032
- **Environment:** Local Vite server at `http://localhost:5173/`; headless Chromium/Playwright at 390 x 844 and 1280 x 720; 2026-07-12.
- **Verified:** After crossing the mobile scroll threshold, the compact capsule rendered with `aria-expanded="false"`, received keyboard focus, and expanded with Enter. The expanded state retained four booking fields, a minimize control, and the `booking-expanded` body state. Minimize restored the capsule and cleared the body state.
- **Booking-link evidence:** Filled check-in, check-out, and guest inputs propagated into the quick-booking `wa.me` URL. The existing room booking message and target remained functional.
- **Desktop/runtime evidence:** At desktop, the full booking bar retained four fields and one WhatsApp booking link with no capsule. Neither viewport had horizontal overflow, page exceptions, or failed network requests.
- **Build evidence:** `npm run build` passed with 445 modules transformed. UI visual approval remains separate.
- **Status:** QA Passed — no functional booking-capsule regression found.

## QA-PASS-016 — Public room comparison table removal regression check

- **Issue ID:** ISSUE-033
- **Environment:** Local Vite server at `http://localhost:5173/`; headless Chromium/Playwright at 1280 x 720; 2026-07-12.
- **Verified:** The public `#rooms` DOM has zero `table` or `.table-wrap` elements. It retains four room cards and four `room-booking` CTAs. The hero `href="#rooms"` action reaches the existing Rooms anchor (`http://localhost:5173/#rooms`).
- **Runtime/build evidence:** No horizontal overflow, page exceptions, or failed network requests occurred. `npm run build` passed with 445 modules transformed.
- **Status:** QA Passed — table removal did not regress room cards, room-booking CTAs, anchor behavior, API-backed public rendering, or build health. UI visual approval remains separate.
