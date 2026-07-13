# Release Gates

Gate definitions as specified by the multi-agent orchestration framework. No issue in `agent-assignments.md` has cleared all three gates yet.

## Development Gate
- [ ] Root cause documented
- [ ] Implementation complete
- [ ] No known compilation error
- [ ] No known type error (note: this project has no TypeScript / `tsc` — "type check" is not applicable; treated as N/A rather than skipped)
- [ ] Targeted developer tests pass (note: no automated test runner wired up yet — ISSUE-018)
- [ ] Relevant files documented
- [ ] Handoff complete

## QA Gate
- [ ] Positive scenario passes
- [ ] Negative scenario passes
- [ ] Boundary conditions pass
- [ ] Relevant security tests pass
- [ ] Adjacent regression tests pass
- [ ] Console and network behaviour checked
- [ ] Evidence recorded

## UI Gate
- [ ] Required viewports pass
- [ ] No horizontal overflow
- [ ] Visual identity consistent
- [ ] Spacing and alignment pass
- [ ] Images preserve proportions
- [ ] Mobile behaviour passes
- [ ] Focus and keyboard behaviour pass
- [ ] Reduced-motion behaviour passes
- [ ] Screenshots recorded

## Supervisor Release Gate
- [ ] Development Gate passes
- [ ] QA Gate passes
- [ ] UI Gate passes where applicable
- [ ] Security requirements pass
- [ ] Acceptance criteria mapped to evidence
- [ ] No unresolved associated defect remains

## Known Environment Constraints Affecting These Gates

These are recorded here, not hidden, per the Supervisor's duty to not "treat a passing build as complete verification":

1. **No automated test runner exists in this repo.** `playwright` is a devDependency but zero test files exist (ISSUE-018). Until that's built, "QA Gate" evidence is manual reproduction + log inspection, not automated regression proof.
2. **No multi-browser automation available.** This environment can drive Chromium only, via a browser extension the user must connect. WebKit and Firefox coverage in section 11 of the spec is not executable here — any such requirement will be recorded as `Blocked by External Dependency`, not silently skipped or assumed passing.
3. **No live URL exists yet for UI Testing.** Nothing has been deployed (no git push, no Vercel deploy) and no local dev server is currently exposed to a browser-capable tool. UI Testing Agent work cannot start until one of those exists.
4. **No CI pipeline.** Every gate check in this project is currently run on-demand by whichever agent is active, not automatically on every change.
