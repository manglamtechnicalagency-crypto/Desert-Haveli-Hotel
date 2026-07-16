# Website Optimization Audit

Date: 16 July 2026  
Scope: public React/Vite website and its local production preview. Browser verification used Chromium only.

## Baseline and verified result

| Measure | Baseline | Verified result | Notes |
| --- | ---: | ---: | --- |
| Initial public JavaScript | 692,404 bytes | 632,580 bytes | 59,824 bytes (8.6%) removed from the public entry bundle by deferring the admin app. |
| Deferred admin JavaScript | bundled into public entry | 65,070 bytes | Requested only on `/admin/*`; public-route requests did not load it. |
| Deferred admin CSS | bundled into public CSS | 31,040 bytes | Requested only on `/admin/*`. |
| Local initial transfer | 3,698,944 bytes | Not re-measured after the metadata-only change | Baseline includes images and fonts; not a field/Core Web Vitals metric. |
| Local DOMContentLoaded | about 245 ms | Not re-measured after the metadata-only change | Local machine result only; it is not representative of visitor conditions. |

The local production build succeeds. The principal public JavaScript bundle remains 632.58 kB minified (186.86 kB gzip), above Vite's 500 kB warning threshold. No Lighthouse or real-user Core Web Vitals data was available, so no performance score, LCP, INP, CLS, traffic, or conversion claim is made here.

## Implemented improvements

| ID | Change | Outcome | Verification |
| --- | --- | --- | --- |
| PERF-001 | Split the administrative application into a lazy-loaded `AdminApp` module. | Visitors to public pages no longer download the admin JS/CSS. | Public `/`, `/rooms`, and `/privacy-policy` requests did not load `AdminApp`; `/admin/login` did. |
| A11Y-001 | Added a keyboard-visible skip link and a focusable main-content target. | Keyboard users can bypass repeated navigation. | Tab focused “Skip to main content”; Enter moved focus to `#main-content`. |
| SEO-001 | Added page-specific title, description, canonical, Open Graph, and Twitter title/description updates for the defined public routes. | Routes such as Rooms and Privacy no longer expose the homepage title after the client app renders. | Verified `/`, `/rooms`, and `/privacy-policy` in Chromium. |
| QA-001 | Rechecked four public viewport sizes: 390x844, 768x1024, 1440x900, and 1920x1080. | No horizontal overflow, console/page errors, or missing `alt` attributes were observed. | Local production preview only. |

Captured previews: `C:/Users/Vinay Pal/.codex/visualizations/2026/07/16/019f6b48-a040-72e3-8264-f370fd3902fa/optimization-mobile.png`, `optimization-tablet.png`, `optimization-desktop.png`, and `optimization-wide.png`.

## Outstanding items requiring production decisions or source assets

| ID | Finding | Why it matters | Required next action |
| --- | --- | --- | --- |
| PERF-002 | Several supplied JPG files are about 2.5–2.6 MB each; `hero-desert-haveli-video.mp4` is 7.5 MB. | These assets dominate transfer size and can delay LCP on mobile connections. | Provide approved compressed AVIF/WebP images and a mobile-appropriate video/poster strategy; then measure on production or staging. |
| PERF-003 | Public JS remains 632.58 kB minified. | It still triggers the production build warning. | Profile the entry bundle and split or remove the heaviest public-only dependencies after checking animation and interaction parity. |
| SEO-002 | `public/robots.txt` and `public/sitemap.xml` contain a beta Vercel domain. | Search engines should be given the verified canonical production hostname. | Confirm the public production domain, then update robots, sitemap, canonical/Open Graph URL policy, and Search Console property together. |
| SEO-003 | Route metadata is set after the JavaScript app runs. | Crawlers or social preview clients that do not execute the application may see only the fallback HTML metadata. | Add SSR or static prerendering for indexable public routes before treating route-level metadata as complete. |
| ANALYTICS-001 | No confirmed analytics, consent, conversion-event, or Search Console configuration was available to test. | Organic performance and enquiry attribution cannot be verified. | Supply approved analytics/consent requirements and credentials; configure only the agreed measurement plan. |
| SEC-001 | Production header, CSP/HSTS, distributed rate limit, upload inspection, and database-policy risks remain environment-dependent. | These require infrastructure and deployment configuration, not a safe local assumption. | Follow `docs/security/SECURITY_REMAINING_RISKS.md` and verify on the deployed hostname. |

## Validation executed

- `npm run build` completed successfully.
- Chromium production-preview checks passed for the specified four viewports.
- Direct routes `/`, `/rooms`, `/privacy-policy`, and `/admin/login` were exercised.
- Metadata, skip-link keyboard behavior, image alternative-text presence, console/page errors, and horizontal overflow were checked.
- Safari, Firefox, real devices, real form delivery, external payment/booking integrations, analytics, field CWV, and deployed-host security headers were not available for this pass.
