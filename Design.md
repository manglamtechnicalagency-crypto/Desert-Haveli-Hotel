# Design System

## 1. Design Overview

The verified direction is premium, warm, heritage hospitality: sandstone, gold, deep brown, maroon, ivory, editorial serif headings, spacious photography, and direct human contact. The design should feel calm and authentic rather than like a generic booking marketplace. Preserve the existing identity unless stakeholders approve a change.

## 2. Existing Design Assessment

`src/styles.css` already defines public tokens and responsive components; `src/admin/admin.css` intentionally reuses the public brand. Existing strengths are strong hero imagery, responsive navigation/booking behavior, visible focus outline, keyboard skip link, semantic labels, alt text, and reduced-motion handling in room galleries. Local Chromium checks at 390x844, 768x1024, 1440x900, and 1920x1080 found no horizontal overflow or missing image `alt` attributes. Risks are a large public bundle, mixed real/demo asset naming, 2.5 MB+ source images, a 7.5 MB hero video, no verified centralized component storybook, and incomplete automated accessibility coverage.

## 3. Brand Identity

Use the `DH` mark and “The Desert Haveli / Guest House Jaisalmer” lockup as implemented. Maintain clear space equal to the mark border thickness around the mark. Do not stretch, recolor into neon tones, place on low-contrast photography without overlay, or use the mark as a substitute for approved legal identity. Prefer authentic hotel/fort imagery; label demo/reference imagery before publication.

## 4. Color System

| Token | Hex | Usage |
|---|---|---|
| `--sand` | `#c99745` | secondary accent, borders, warm controls |
| `--gold` | `#e4b862` | primary accent, focus/nav highlights |
| `--brown` | `#2a160f` | dark surfaces, header, primary text on light |
| `--brown-2` | `#4a2a1b` | secondary dark surface |
| `--maroon` | `#7a1f20` | CTA/emphasis |
| `--ivory` | `#fff8ea` | page/surface background |
| `--beige` | `#f1dfbf` | warm panel background |
| `--muted` | `#7b684f` | supporting text; verify contrast per context |
| `--ink` | `#1d130d` | body text |
| `--line` | `rgba(78,42,24,.16)` | borders/dividers |
| success | `#2f6b45` | confirmed/available state; add token before use |
| warning | `#9a6519` | pending/on-request state; add token before use |
| error | `#a3262b` | validation/destructive state; add token before use |

Do not use the muted token for small text unless contrast is checked. Dark text on ivory/beige and gold on dark surfaces are the primary contrast combinations.

## 5. Theme

The verified theme is light/warm with dark brown navigation and overlays. A dark theme is not required. Gradients and texture are allowed only as existing atmospheric backgrounds; preserve text readability and avoid decorative texture behind form controls. Theme switching is not implemented.

## 6. Typography

Headings use the declared `"Cormorant Garamond", Georgia, serif` stack; body uses `"Inter", system-ui, -apple-system, sans-serif`. Hero `h1` is `clamp(54px, 9vw, 116px)`; body/hero text uses responsive clamp values already present. Keep headings compact/editorial, body line-height around 1.6, and uppercase labels letter-spaced. Do not add external font loading without measuring performance and licensing.

## 7. Spacing System

Use a 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Existing `clamp()` values may interpolate between these anchors. Section padding should remain generous on desktop and reduce consistently on mobile; do not solve layout issues with arbitrary one-off negative margins.

## 8. Layout System

Public content uses a centered max-width approximately 1180px with `calc(100% - 36px)` gutters in the hero. Use 12-column desktop grids where a new grid is needed, 2-column tablet where readable, and single-column mobile. Navbar minimum height is 78px transparent / 68px solid. Admin layouts use the existing admin shell and must not overflow narrow screens.

## 9. Responsive Breakpoints

Use existing CSS media-query conventions; standardize new work to: mobile `<480px`, large mobile `480–759px`, tablet `760–1023px`, laptop `1024–1279px`, desktop `1280–1535px`, large desktop `≥1536px`. On mobile, collapse nav, use booking capsule/modal, stack cards/forms, and keep touch targets at least 44px. On tablet, preserve readable two-column compositions. On desktop, use multi-column grids and full hero composition.

## 10. Border Radius

Base `--radius: 8px`; use 6–8px for controls/cards, 12–16px only for prominent panels/modals when consistent with nearby components, pills for status/offer badges, and 50% for circular controls. Avoid mixing sharp, pill, and highly rounded styles without semantic reason.

## 11. Shadows and Elevation

Base `--shadow: 0 24px 60px rgba(42,22,15,.18)`. Use low elevation for cards, medium for sticky booking/admin panels, and high for modal/drawer overlays. Shadows must not be the only state indicator and must not reduce contrast.

## 12. Iconography

Current public icons are lightweight text/inline elements; no icon library is verified. Prefer one consistent outline icon style if icons are added. Icon-only controls require accessible names and visible focus. Do not add a second icon library for a handful of symbols.

## 13. Buttons

Primary: maroon/dark warm fill, ivory text, gold/brightness hover. Secondary: transparent or beige surface with brown border. Tertiary/link: text with underline/hover affordance. Destructive: explicit red token with confirmation. Icon-only: 44px target and `aria-label`. All variants require visible focus, disabled contrast, and loading prevention for async mutations. WhatsApp buttons must retain clear “enquire/book on WhatsApp” language and must not imply reservation confirmation.

## 14. Form Controls

Every field has a visible label or accessible name. Use native date/number/select controls where current code does. Placeholder is supporting example, not the label. Error copy is adjacent and specific (“End date cannot be before start date.”). Disabled fields explain why when non-obvious. Admin forms must preserve entered values on recoverable errors and confirm destructive operations.

## 15. Cards

Use image-led room/gallery cards, content cards for facilities/experiences, and compact data cards for admin dashboard stats. Keep card hierarchy: image/title, short supporting text, metadata, action. Do not overload a card with full business logic; use page/panel for editing.

## 16. Navigation

Public header is fixed, transparent over hero and solid after scroll; mobile uses toggle, scrim, and active section state. Admin uses a dedicated shell and noindex meta behavior. New public pages must remain reachable from an appropriate nav/footer link and preserve the 404 fallback.

## 17. Feedback Components

Use inline errors for forms, banners for page-level service failures, toasts only for short-lived confirmations, skeleton/loading state for awaited lists, and explicit empty states (“No availability blocks.”). Never silently replace a failed mutation with success language. Public optional content may use local fallback, but diagnostics should remain available to developers.

## 18. Overlay Components

Booking modal is a dialog with `aria-modal`, labelled heading, Escape close, backdrop close, and body scroll lock. Apply the same focus-management standard to future modals/drawers. Tooltips must not be the only place for essential information.

## 19. Tables and Data Display

Admin lists should preserve readable columns, search/filter state, explicit archive view, row actions, and mobile overflow/stack behavior. Large lists require pagination before scale-up. Status must be text plus color/shape, not color alone.

## 20. Page Templates

- Landing/public: fixed nav, hero, editorial sections, conversion CTA, contact/footer.
- Room detail: image gallery, price context, features, availability/enquiry CTA.
- Admin dashboard: top bar, role/status, summary cards, recent rooms, navigation.
- Admin form: grouped tabs/panels for core data, photos, amenities, pricing, availability.
- Error/404: short explanation, recovery link, no broken layout.

## 21. Animation and Motion

Existing reveal transitions use roughly 0.65–0.8s ease-out and room galleries pause/disable auto-motion for reduced-motion users. Keep transitions 150–300ms for controls and 400–800ms for editorial reveals. Motion must communicate state or hierarchy; no autoplay decorative motion that cannot be paused.

## 22. Accessibility

Maintain visible `:focus-visible`, the public “Skip to main content” control, semantic headings, alt text, labels, keyboard navigation, at least 44px touch targets, error association, dialog semantics, reduced-motion behavior, and contrast checks. Test public and admin at keyboard-only and narrow viewport sizes. The recorded four-viewport Chromium pass is a regression baseline, not cross-browser certification.

## 23. Content Style

Use warm, specific, honest language. Say “enquire” or “ask the hotel to confirm” for non-authoritative availability/pricing. Avoid invented ratings, guarantees, or service claims. Use sentence case for body/buttons, title case sparingly for display headings, ISO dates in data/admin, and `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` for prices.

## 24. Design Tokens

```css
:root {
  --color-sand: #c99745;
  --color-gold: #e4b862;
  --color-brown: #2a160f;
  --color-brown-2: #4a2a1b;
  --color-maroon: #7a1f20;
  --color-ivory: #fff8ea;
  --color-beige: #f1dfbf;
  --color-ink: #1d130d;
  --color-muted: #7b684f;
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px; --space-9: 96px;
  --radius-control: 8px;
  --shadow-card: 0 24px 60px rgba(42,22,15,.18);
}
```

Existing aliases in `src/styles.css` remain the source of truth until tokens are migrated deliberately.

## 25. Component State Matrix

| Component | Required states |
|---|---|
| Button | default, hover, active, focus, disabled, loading |
| Input | empty, filled, focus, invalid, disabled |
| Room card | loading, populated, unavailable/error, enquiry action |
| Gallery | loading, image, empty, paused, reduced motion |
| Admin list | loading, populated, filtered empty, error, archived |
| Modal | closed, open, Escape/backdrop close, focus trap, submitting |

## 26. Design QA Checklist

- Brand tokens and typography are consistent.
- No text overlays lose contrast over imagery.
- Mobile/tablet/desktop layouts have no horizontal overflow.
- Keyboard focus is visible and order is logical.
- Forms have labels, specific errors, and disabled/loading behavior.
- Images have meaningful alt text or intentional decorative handling.
- Modal focus/scroll behavior works.
- Reduced-motion preference is respected.
- Admin destructive actions are explicit and confirmed.
- Cross-browser/build smoke check is recorded.
