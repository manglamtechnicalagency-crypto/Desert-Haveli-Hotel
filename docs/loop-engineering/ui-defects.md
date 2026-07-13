# UI Defects

No UI Testing Agent pass has been executed yet. There is no design baseline captured (ISSUE-020), and no live URL exists for a UI Testing Agent to inspect — see `supervisor-decisions.md` for why (nothing has been deployed or exposed to a browser-capable tool yet).

This file will be populated once ISSUE-020 (baseline capture) and a real UI Testing pass run.

*Template for new entries:*

```markdown
## UI-DEFECT-NNN
Issue ID:
Severity:
Route:
Viewport:
Browser:
Baseline screenshot:
Current screenshot:
Expected visual result:
Observed mismatch:
Measurement or visual evidence:
Accessibility impact:
Assigned back to:
Status:
```

## UI-DEFECT-001

Issue ID: ISSUE-027
Severity: Medium
Route: `/admin` (admin login screen)
Viewport: All requested viewports; source review applies to 320 x 568, 390 x 844, 768 x 1024, and 1280 x 720
Browser: Chromium requested; live browser unavailable in this session
Baseline screenshot: Not available — no prior login-page visual baseline exists.
Current screenshot: Not available — the in-app browser service reported no connected browser backends (`agent.browsers.list()` returned `[]`).
Expected visual result: When the operating system requests reduced motion, interactive login controls must not animate or shift on hover.
Observed mismatch: The login submit control uses the shared `.btn` class, which applies `transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease` and `.btn:hover { transform: translateY(-2px); }`. The admin-only reduced-motion rule disables `.admin-spinner` only; it does not neutralize the submit button transition/hover transform.
Measurement or visual evidence: Source evidence in `src/styles.css` lines 183-197 and `src/admin/admin.css` lines 670-672. This affects the `/admin` Sign in button at every viewport.
Accessibility impact: Users who enable reduced motion can still receive hover movement and animated transitions on the principal form action.
Assigned back to: Developer Agent via Supervisor
Status: Development Complete — static UI retest passed; runtime visual retest remains blocked by the unavailable browser backend.

### Retest — after HANDOFF-008

Retest result: The source fix is correctly scoped to the admin application. Inside `@media (prefers-reduced-motion: reduce)`, `src/admin/admin.css` now targets both `.admin-shell .btn` and `.admin-auth-screen .btn`, setting `transition: none`; their `:hover` selectors set `transform: none`. The standalone login screen is explicitly included, so its Sign in button no longer inherits the shared lift/motion behavior while reduced motion is active.

Runtime evidence: Not available. Browser discovery was rechecked during this retest and still returned no connected backend (`[]`), so computed-style, hover, and screenshot confirmation were not executed.

### Retest — after HANDOFF-010

Focus-restoration source review: Static review passes for the ordinary invalid-PIN path. The catch block clears the PIN fields and sets `restorePinFocusRef.current = true`; the `useEffect` waits until `loading` is false before calling `inputsRef.current[0]?.focus()`. Because the inputs are disabled only while `loading || locked`, the non-locked invalid path should restore focus after the enabled render. The existing PIN `:focus` style supplies a gold border and 4 px halo, so restored keyboard focus is intended to be visibly apparent. When a lockout is active, the field remains intentionally disabled; the `role="alert"` error remains the available feedback rather than an actionable focus target.

Reduced-motion source review: Still passes. Both `transition` and inherited hover `transform` remain neutralized for `.admin-auth-screen .btn` in the reduced-motion media query.

Runtime evidence: Still blocked. A fresh browser-backend check returned `[]`; focus restoration, focus-ring visibility, disabled lockout state, hover, and screenshots were not observed in a browser.

## UI-TEST-BLOCKER-001

Issue ID: ISSUE-027
Severity: Blocker (evidence collection)
Route: `/admin`
Viewport: 320 x 568, 390 x 844, 768 x 1024, 1280 x 720
Browser: Chromium requested; Firefox and WebKit are unavailable in this environment.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Independent rendered checks must confirm overflow, wrapping, keyboard focus, and final responsive layout.
Observed mismatch: No browser backend is connected to this task, so the required rendered assertions and screenshot capture could not be executed.
Measurement or visual evidence: Browser bootstrap completed, but selecting the in-app browser returned “Browser is not available: iab”; the required follow-up discovery returned an empty backend list.
Accessibility impact: Keyboard-focus visibility and visual layout cannot be independently verified from runtime output.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

## UI-DEFECT-008

Issue ID: ISSUE-033
Severity: Medium
Route: `/` (Rooms section)
Viewport: All viewports
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: The redundant room comparison table is absent; the room-card grid transitions cleanly into the Restaurant section without blank space or horizontal table overflow.
Observed mismatch: The current `Rooms` component still renders `<Reveal className="table-wrap"><table>…</table></Reveal>` directly after the room-card grid. Its CSS remains in `styles.css`, including an 860 px table minimum width. The expected ISSUE-033 removal is not present in the workspace under test.
Measurement or visual evidence: Source evidence: `src/App.jsx` lines 507 onward and `src/styles.css` `.table-wrap` / `table` rules around lines 554–565. On small viewports, the retained table intentionally scrolls horizontally rather than disappearing.
Accessibility impact: The redundant content adds extra navigation and a horizontally scrollable region on mobile; it also prevents the intended simplified Rooms-to-Restaurant visual flow.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static UI retest passed; runtime visual validation remains blocked.

### Retest — after Developer HANDOFF-029

Retest result: Static removal passes. `Rooms()` now renders only the responsive `.rooms-grid` in its loaded state; no comparison-table markup or `.table-wrap` wrapper remains. The grid’s 3/2/1 desktop/tablet/mobile breakpoints are unchanged. The generic global `table` selector still exists but has no table element in this public route, so it cannot create a Rooms-section gap or overflow.

Runtime evidence: Not available. Browser discovery returned `[]`; the actual last-card-to-Restaurant spacing, responsive visual rhythm, and overflow could not be screenshotted or observed.

## UI-TEST-BLOCKER-007

Issue ID: ISSUE-033
Severity: Blocker (evidence collection)
Route: `/` — Rooms and adjacent Restaurant sections
Viewport: 320 x 568, 390 x 844, and representative desktop
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Verify card-grid bottom spacing, absence of a blank table gap, no overflow, and alignment with Restaurant.
Observed mismatch: Browser backend discovery returned `[]`; no rendered/screenshot assessment could be performed.
Measurement or visual evidence: Static source confirms the Rooms grid uses 3/2/1 columns through desktop/tablet/mobile breakpoints, but the still-rendered table prevents assessment of the requested post-removal flow.
Accessibility impact: Visual spacing and keyboard traversal cannot be independently verified.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

## UI-DEFECT-006

Issue ID: ISSUE-032
Severity: Medium
Route: `/` (mobile compact booking capsule)
Viewport: 320 x 568, 360 x 800, 390 x 844, 412 x 915
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: The fixed booking capsule should sit clear of device safe areas and system gesture/navigation regions across supported mobile devices.
Observed mismatch: The fixed compact bar is positioned with a hard `bottom: 10px`; it does not add `env(safe-area-inset-bottom)`. On notched/gesture-navigation devices this can place the touch target too close to, or partially into, the system safe area.
Measurement or visual evidence: Source evidence: `src/styles.css` mobile `.booking-bar` rule around lines 1063–1072 (`inset: auto 10px 10px 10px`). Unlike the Safari section’s safe-area-aware rules, no bottom safe-area adjustment appears for the booking bar/capsule.
Accessibility impact: The main booking entry point can be harder to reach or conflict with system gestures on mobile devices.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static safe-area retest passed; runtime visual validation remains blocked.

### Retest — after Developer HANDOFF-025

Retest result: The capsule now overrides the fixed bottom placement with `bottom: max(10px, env(safe-area-inset-bottom))` and uses a safe-area-aware left offset. Its width is bounded by `min(208px, calc(100vw - 20px))`, which cannot exceed the 320 px viewport, while the 66 px capped frame has a 64 px control with no source-intrinsic vertical clipping. Desktop still uses the separate sticky booking-bar rule.

Runtime evidence: Not available. Browser discovery remained empty (`[]`), so device inset rendering and actual viewport overlap were not observed.

## UI-DEFECT-007

Issue ID: ISSUE-032
Severity: Medium
Route: `/` (mobile compact booking capsule)
Viewport: 320 x 568, 360 x 800, 390 x 844, 412 x 915
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: Keyboard focus should have a clearly distinguishable focus indicator with sufficient contrast against the capsule surface.
Observed mismatch: The capsule focus treatment is `outline: 3px solid white` drawn inside a light gold gradient. White against the gradient’s `#f4ce77` to `#e4b862` surface has approximately 1.5:1–1.9:1 contrast, below the 3:1 non-text focus-indicator contrast expectation. The negative outline offset also reduces separation from the capsule edge.
Measurement or visual evidence: Source evidence: `src/styles.css` capsule gradient around lines 1083–1084 and `.booking-capsule:focus-visible` around lines 1123–1126. Contrast calculation from the specified hex colors, not a screenshot measurement.
Accessibility impact: Keyboard users may not reliably perceive focus on the primary mobile booking control, particularly in bright viewing conditions.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static focus-contrast retest passed; runtime visual validation remains blocked.

### Retest — after Developer HANDOFF-027

Retest result: Static focus contrast passes. The capsule focus rule now uses a 3 px `var(--brown)` outline. The defined brown token (`#2a160f`) has high contrast against the light-gold capsule gradient (`#f4ce77` to `#e4b862`), comfortably exceeding the 3:1 focus-indicator contrast expectation. The prior safe-area-aware bottom/left position, 64 px target, capped width, and desktop separation remain unchanged.

Runtime evidence: Not available. Browser discovery returned `[]`; actual focus outline visibility, safe-area rendering, clipping, and expanded-form behavior remain unobserved.

## UI-TEST-BLOCKER-006

Issue ID: ISSUE-032
Severity: Blocker (evidence collection)
Route: `/`
Viewport: 320 x 568, 360 x 800, 390 x 844, 412 x 915, and representative desktop
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Confirm capsule hierarchy, color contrast, 56 px touch target, focus treatment, safe-area clearance, expansion/minimize behavior, and no clipping/overlap; confirm desktop retains the expanded sticky booking bar rather than the capsule.
Observed mismatch: Browser backend discovery returned `[]`; no screenshots or interaction checks could run.
Measurement or visual evidence: Static review finds the capsule activates only below 760 px after scrolling 45% of a viewport, has a 168 x 58 px fixed frame with a 56 px interactive control, hides the form controls while compact, and uses the global focus-visible outline. It is left-aligned at 10 px with no intrinsic-width overflow at 320 px. Desktop remains the full sticky booking bar. Actual contrast, body overlap, clipping, and focus appearance require runtime verification.
Accessibility impact: Touch/keyboard behavior and contrast cannot be independently validated; the safe-area defect above remains open.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

## UI-DEFECT-005

Issue ID: ISSUE-031
Severity: Medium
Route: `/` (Contact section)
Viewport: All viewports
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: The contact area presents the requested responsive map preview with an accessible embedded-map title (or an equivalent accessible map preview) and a clearly placed external-map CTA.
Observed mismatch: The current source has no map iframe or map-preview component. It renders a decorative `.map-card` with `aria-label="Google map placeholder"`, placeholder text “Google Map Embed,” a background image, and only an external Google Maps link. There is consequently no iframe title/accessibility implementation to validate and no actual embedded map preview.
Measurement or visual evidence: Source evidence: `src/App.jsx` Contact markup around lines 824–829; `src/styles.css` map-card rules around lines 938–959. A repository search for `iframe`, `map-preview`, and `map-frame` found no matching map implementation.
Accessibility impact: The text clearly labels this as a placeholder rather than misrepresenting it as a functional map, but the requested accessible embedded preview is missing. The external CTA remains keyboard focusable through shared focus styling, subject to runtime verification.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static UI retest passed; runtime visual validation remains blocked.

### Retest — after Developer HANDOFF-022

Retest result: Static implementation passes. The placeholder is replaced with a lazy iframe whose descriptive `title` identifies the hotel, plus a referrer policy and fullscreen permission. The map card is a two-row iframe/footer frame: desktop preserves a 420 px minimum height, while up to 560 px the iframe has a 250 px minimum/58vw responsive track and the footer stacks its CTA at full width. The Contact grid collapses to one column at <=1060 px, avoiding a narrow side-by-side preview. The external location CTA remains immediately below the map and retains its new-tab security attributes. No source-definitive overflow or CTA-placement defect was found.

Runtime evidence: Not available. A fresh browser-backend check returned `[]`; actual Google Maps rendering, provider failure behavior, legibility, focus, and responsive visual layout were not observed.

## UI-TEST-BLOCKER-005

Issue ID: ISSUE-031
Severity: Blocker (evidence collection)
Route: `/` — Contact section
Viewport: 320 x 568, 390 x 844, and representative desktop
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Verify responsive map sizing/legibility, iframe title, CTA placement, no overflow, and focus/reduced-motion presentation.
Observed mismatch: Browser backend discovery returned `[]`; no rendered evidence or screenshots could be collected.
Measurement or visual evidence: Static layout uses a two-column 0.9fr/1.1fr grid at desktop and a single column at <=1060 px. The current placeholder card has a 420 px minimum height and centers CTA content; mobile contact buttons are full-width at <=900 px. This cannot substitute for observing actual map rendering or external provider behavior.
Accessibility impact: Focus rendering, CTA placement, mobile height, and an actual map’s keyboard behavior remain unverified.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

### Retest — after Developer HANDOFF-018

Retest result: Static review passes the expected responsive sizing model. At the requested 320–412 px phone widths, the `max-width: 600px` rule applies: Safari content is inset by 18 px (safe-area aware), its compact grid is already a one-column layout under 900 px, and the card’s 18 px horizontal padding leaves a usable content width rather than a narrow multi-column card. The long service-title rule permits breaking, the body copy has a 36ch limit and responsive 16–18 px size, the title/grid gap is reduced to 24 px, and the card gap is 14 px. On a 1280 px desktop, the full-bleed Safari padding resolves to the same 1180 px content measure as the shared desktop section and the four-column compact grid has approximately 281 px cells before card padding. No source-definitive overflow or spacing defect was found.

Runtime evidence: Still unavailable. The browser backend remains disconnected (`[]`), so actual rendered gutters, line breaks, overflow, contrast, focus, and reduced-motion behavior could not be assessed or screenshotted.

## UI-TEST-BLOCKER-004

Issue ID: ISSUE-030
Severity: Blocker (evidence collection)
Route: `/` — Safari/Travel Assistance and adjacent Experiences / Story / Gallery sections
Viewport: 320 x 568, 360 x 800, 390 x 844, 412 x 915, plus representative desktop
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Stable Safari-section gutters, readable title/body rhythm, evenly spaced service cards, no overflow, visible focus, and reduced-motion-safe behavior across requested sizes.
Observed mismatch: Browser backend discovery returned `[]`, so no rendered comparison or screenshots could be captured.
Measurement or visual evidence: Static review indicates that at up to 600 px, Safari uses safe-area-aware 18 px gutters, a 24 px title-to-grid gap, a body constrained to 36ch with a 16–18 px responsive type scale, 14 px card gaps, and cards with 18 px horizontal / 20 px vertical padding. The compact grid is one column under 900 px and two columns from 900–1060 px, avoiding narrow multi-column cards at all requested phone widths. Desktop content uses the 1180 px-aligned full-bleed section padding. Safari background attachment changes to `scroll` at phone widths. The global reduced-motion block reduces animations/transitions, and its CTA anchors have a 44 px minimum height. These source properties need rendered verification for wrapping, actual rhythm, and focus visibility.
Accessibility impact: Keyboard focus rendering, safe-area behavior, contrast over the background, and touch-target usability cannot be independently verified without runtime evidence.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

## UI-DEFECT-003

Issue ID: ISSUE-029
Severity: Medium
Route: `/` (room cards)
Viewport: All viewports
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: Room-card images should auto-advance at a deliberate cadence, with a reduced-motion-safe behavior.
Observed mismatch: `RoomGallery` has no timer, effect, or auto-advance state. Images change only via arrow keys, pointer controls, dots, or swipe. The requested auto-slide behavior is therefore absent.
Measurement or visual evidence: Source review of `src/App.jsx` `RoomGallery` (lines 330-389): no `setInterval`, `setTimeout`, or related effect is present. Reduced-motion CSS only disables a navigation-button transition; it does not provide an auto-slide policy because no auto-slide exists.
Accessibility impact: The missing automatic behavior does not create motion harm, but it fails the intended carousel interaction. Any future auto-slide implementation must pause/disable under reduced motion and avoid disrupting keyboard/pointer control.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static UI retest passed; runtime evidence remains blocked.

### Retest — after Developer HANDOFF-015

Retest result: Static semantics pass. Multi-image galleries schedule a single 3,000 ms timeout and clean it up on every dependency change. Cycling is disabled when reduced motion is preferred, when the gallery is below the intersection threshold, and while the carousel is hovered or contains focus. Manual next/previous, dot, swipe, and keyboard actions reset the cadence. Zero- and single-image galleries do not schedule a timer.

Runtime evidence: Not available. A fresh browser-backend check returned `[]`, so actual cadence, observer behavior, and visual image changes were not observed.

## UI-DEFECT-004

Issue ID: ISSUE-029
Severity: Medium
Route: `/` (room cards)
Viewport: All viewports, particularly touch devices
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: Manual image-selection controls should have a usable visible target, clear keyboard focus, and not make arrow-key use scroll the page unexpectedly.
Observed mismatch: Each gallery dot is styled as an 8 x 8 px button (20 px width only for the active state), well below a practical touch target. The gallery-level `ArrowLeft`/`ArrowRight` handler changes images but does not call `preventDefault()`, so browser scrolling can occur alongside carousel navigation.
Measurement or visual evidence: `src/styles.css` lines 525-540 sets dot size to 8 px; `src/App.jsx` lines 349-354 handles arrows without cancelling their default. Global `:focus-visible` styling exists, but visible focus and actual scroll behavior require browser observation.
Accessibility impact: Tiny dots are difficult to tap and focus precisely; arrow-key users may receive unexpected page movement while attempting to browse images.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static UI retest passed; runtime evidence remains blocked.

### Retest — after Developer HANDOFF-015

Retest result: Static interaction/accessibility repair passes. Dot controls now provide 36 x 36 px hit targets while retaining compact 8 px visual indicators. Gallery arrow-key handlers call `preventDefault()` before cycling, so the implementation no longer requests page scrolling as part of carousel navigation. The existing global `:focus-visible` rule supplies the focus outline; gallery focus pauses auto-cycling, including when a nested control receives focus. The fixed `4 / 3` gallery frame and image sizing remain unchanged, preserving the intended no-layout-shift design.

Runtime evidence: Not available. A fresh browser-backend check returned `[]`, so actual hit-target spacing, visible focus, page-scroll suppression, and touch swipe behavior were not observed.

## UI-TEST-BLOCKER-003

Issue ID: ISSUE-029
Severity: Blocker (evidence collection)
Route: `/`
Viewport: 320 x 568, 390 x 844, 768 x 1024, 1280 x 720
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Verify auto-slide cadence, image stability/aspect ratio, control visibility, keyboard focus and arrow behavior, swipe operation, and reduced-motion behavior.
Observed mismatch: Browser backend discovery returned `[]`; no independent rendered or screenshot evidence could be captured.
Measurement or visual evidence: Static implementation has a stable `4 / 3` `.room-gallery` frame and a `4 / 3` `object-fit: cover` image, intended to prevent layout shift. It includes previous/next buttons, dots, a focusable carousel group, and a horizontal-swipe threshold of 40 px. These claims need runtime validation.
Accessibility impact: Visible focus, touch behavior, and actual layout shift cannot be independently verified.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency

## UI-DEFECT-002

Issue ID: ISSUE-028
Severity: Medium
Route: `/` (public website)
Viewport: All viewports; source evidence specifically includes the mobile fixed-position rules.
Browser: Chromium requested; no in-app browser backend is connected.
Baseline screenshot: Not available.
Current screenshot: Not available.
Expected visual result: The redundant floating WhatsApp CTA must be absent. Contextual WhatsApp CTAs should remain in their sections without fixed-position overlap or a reserved blank area.
Observed mismatch: The floating CTA has not been removed in the current source. `App.jsx` still renders `<a className="floating-whatsapp" …>WhatsApp</a>` immediately before the footer, and `styles.css` still defines it as `position: fixed` with `z-index: 60` and the mobile placement rules. This means the reported ISSUE-028 implementation is not present in the workspace under test.
Measurement or visual evidence: Source evidence: `src/App.jsx` line 886; `src/styles.css` lines 970-990 and 1110-1111. A fixed element does not create document-flow space, so its removal would not leave a layout gap; however, it remains capable of visually overlapping content because it is still rendered and fixed above the page.
Accessibility impact: The redundant fixed action remains in keyboard order and can obscure content or compete with the mobile booking control. Runtime overlap and hit-target behavior cannot be measured without a browser.
Assigned back to: Supervisor Agent / Developer Agent
Status: Development Complete — static UI retest passed; runtime visual validation remains blocked.

### Retest — after Developer HANDOFF-012

Retest result: Static removal check passes. A repository-wide search for `floating-whatsapp` and `floatPulse` under `src/` returned no matches. The public app now moves directly from `</main>` to `<Footer />`; there is no remaining floating-CTA markup. Its dedicated fixed-position, animation, and responsive rules are also absent.

Layout implication: Because the removed control was `position: fixed`, it did not occupy document-flow space; its removal cannot introduce a document-flow gap. Contextual WhatsApp CTAs remain in the navigation, hero, room/service sections, booking form, and contact area. The existing narrow-layout rules continue to make hero/form/booking CTAs full width and contact-card CTAs full width.

Runtime evidence: Not available. A fresh browser-backend check returned `[]`, so screenshot, actual wrapping, footer spacing, focus order, and touch/overlap validation remain unexecuted.

## UI-TEST-BLOCKER-002

Issue ID: ISSUE-028
Severity: Blocker (evidence collection)
Route: `/`
Viewport: 320 x 568, 390 x 844, 768 x 1024, 1280 x 720
Browser: Chromium requested; Firefox and WebKit unavailable.
Baseline screenshot: Not available
Current screenshot: Not available
Expected visual result: Confirm the removed CTA creates no gap or overlap, and remaining contextual WhatsApp actions fit and remain discoverable.
Observed mismatch: Browser backend discovery returned `[]`; no rendered-page or screenshot check could run.
Measurement or visual evidence: Static review confirms contextual WhatsApp actions remain in the navbar, hero, room/service cards, booking form, and contact card. The responsive CSS makes hero/form/booking CTAs full width at narrow breakpoints and contact-card CTAs full width in the mobile layout, but actual wrapping and overlap remain unverified.
Accessibility impact: Focus order, visible focus, touch-target sizing, and mobile overlap cannot be independently verified.
Assigned back to: Supervisor Agent
Status: Blocked by External Dependency
