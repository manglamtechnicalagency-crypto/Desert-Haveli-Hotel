# Project Requirements Document

## 1. Document Information

| Field | Value |
|---|---|
| Project name | The Desert Haveli Guest House Jaisalmer website |
| Version | 1.0.0 (repository package version) |
| Status | Existing MVP in production-oriented development; documentation baseline |
| Last updated | 2026-07-16 |
| Document owner | Project owner / hotel stakeholders |
| Stakeholders | Hotel owners and operators, guests, content editors, administrators, developers, QA |

This document distinguishes verified behavior from proposed work. “Implemented” means verified in the repository; “planned” means not yet verified.

## 2. Project Overview

The product is a premium heritage-hotel website for The Desert Haveli Guest House in Jaisalmer. It presents the property, rooms, rooftop dining, facilities, safari assistance, local attractions, gallery, guest experiences, contact details, and direct booking enquiry actions.

The core problem is that prospective guests need trustworthy visual context and a low-friction way to ask the hotel about dates, rooms, prices, and local services. The implemented solution is a responsive React site with content/media fallbacks, live room inventory reads from Supabase, and WhatsApp/email enquiry links rather than an online payment or reservation engine.

**Vision:** make direct, informed enquiries for a distinctive stay inside Jaisalmer Fort easier than relying on generic listing pages.

## 3. Goals

### Primary goals

- Communicate the heritage location and experience clearly above the fold.
- Present current visible, published, bookable rooms from Supabase.
- Let a guest prefill dates, guests, and preferred room into a WhatsApp enquiry.
- Give hotel operators controlled administration of rooms, pricing, availability, content, images, gallery items, and short videos.
- Preserve graceful local fallback content if optional Supabase content is unavailable.

### Secondary goals

- Support search discoverability with public routes, sitemap, robots file, and structured local-business data.
- Keep media replaceable without changing component code.
- Maintain mobile, tablet, and desktop usability for guest and admin experiences.

### Measurable success criteria

- Public build completes with `npm run build`.
- Public site exposes no archived, deleted, hidden, draft, or non-bookable room in the public room list.
- Booking CTA includes check-in, check-out, guests, and room when entered by the guest.
- Admin unauthenticated users cannot reach protected admin pages; admin login is server-backed by Supabase Auth and login attempts are rate/lockout controlled by database RPCs.
- Media upload rejects videos over 200 MB or 15 seconds as implemented in `src/lib/siteVideos.js`.
- Every release has documented lint/type/test/build status. `npm run lint` and `npm run build` are currently available; type-check and automated test scripts remain outstanding.

## 4. Non-Goals

- Online payment capture, guaranteed reservation, inventory hold, or OTA/channel-manager synchronization.
- Customer accounts, guest self-service booking management, or password recovery UI beyond Supabase capability.
- A full hotel PMS, housekeeping system, invoicing system, or restaurant POS.
- Treating displayed room prices or service availability as a confirmed quote; the hotel must confirm by direct enquiry.
- Replacing the existing visual identity or migrating storage without an approved migration plan.

## 5. Target Users

| Role | Needs / actions | Expected outcome |
|---|---|---|
| Prospective guest | Explore heritage stay, rooms, facilities, dining, attractions; send enquiry | Understand fit and contact hotel with useful details |
| Mobile traveller | Navigate quickly on a phone; use WhatsApp; view images | Complete an enquiry without zooming or losing context |
| Hotel operator | Review dashboard, room inventory, prices, date blocks | Keep public room information accurate |
| Content editor | Update section copy, image slots, gallery, short videos | Publish approved content without code changes |
| Admin / super admin | Manage protected operations and audit history | Control access and recover from operational mistakes |
| Developer / QA | Understand verified scope and constraints | Make focused, testable changes without inventing features |

## 6. User Personas

- **Aanya, planning traveller:** compares distinctive stays on mobile and needs confidence about location, room fit, and direct contact before booking.
- **Raj, hotel operator:** updates room availability and seasonal pricing from a laptop, and needs archived rooms kept out of the public site.
- **Meera, content editor:** changes images and short marketing copy, but should not need database or deployment expertise.

## 7. User Stories

1. As a prospective guest, I want to understand that the guesthouse is inside Jaisalmer Fort, so that I can decide whether the location matches my trip.
   - Acceptance: hero, about, address, and local attraction content communicate the fort/Jain Temple area without requiring a login.
2. As a guest, I want to inspect rooms and current displayed pricing, so that I can choose a preferred room.
   - Acceptance: only published, visible, bookable, non-archived, non-deleted rooms render; effective price follows the documented pricing precedence.
3. As a guest, I want to send dates, guests, and room through WhatsApp, so that the hotel can confirm availability.
   - Acceptance: CTA opens the configured WhatsApp URL in a new tab with encoded enquiry text; dates are not claimed to be reserved.
4. As a guest, I want to contact the hotel by WhatsApp, email, phone, or map link, so that I can use my preferred channel.
   - Acceptance: contact links use the values in `src/data.js`; no secret is exposed.
5. As an administrator, I want to sign in and see operational pages, so that public content is protected.
   - Acceptance: inactive/non-admin profiles are rejected; protected routes are wrapped by `ProtectedRoute`.
6. As an editor, I want to save a section as draft or publish it, so that copy changes can be staged.
   - Acceptance: section status/visibility is persisted through Supabase and only published/visible content is read publicly.
7. As an operator, I want to set date-specific and rule-based prices, so that displayed prices reflect hotel policy.
   - Acceptance: exact override > highest-priority matching rule > promotion > weekend > base; equal priorities use deterministic ID ordering.
8. As an operator, I want to block a room for a date range, so that unavailable inventory is not offered operationally.
   - Acceptance: start/end are required and end cannot precede start; block state is stored in `room_availability`.

## 8. Functional Requirements

### Public presentation — P0 / implemented

The site shall render hero, about, rooms, restaurant, facilities, experiences, safari, gallery, nearby attractions, booking, reviews/trust, contact, FAQ, and footer sections. Content is sourced from local fallbacks and optionally merged with published Supabase sections and media.

### Room discovery — P0 / implemented

Inputs: public room query and optional date context. Processing: query the explicit public predicates in `fetchPublicRooms`, sort by display order, sort child images/features, calculate effective price. Output: room cards/detail presentation and enquiry CTA. Errors: loading state and user-facing room error. Dependency: Supabase `rooms` relationship data and image storage.

### Direct booking enquiry — P0 / implemented

Inputs: check-in, check-out, guest count, room. Validation currently includes native date/number controls; server reservation validation does not exist because no reservation endpoint exists. Output: encoded WhatsApp message. Priority: hotel confirmation remains external/manual.

### Admin authentication — P0 / implemented

Supabase Auth password sign-in, server-backed login lockout RPCs, admin profile lookup, logout, protected routes, noindex admin pages. Roles observed in code: `super_admin`, `admin`, `editor`; per-route role restrictions are not broadly configured yet.

### Admin PIN recovery — P1 / partially implemented

`/api/admin/request-pin-reset` and `/api/admin/verify-pin-reset` implement email-gated recovery challenges with a server-only Supabase service key, hashed six-digit OTPs, expiry, attempt limits, generic responses, and rate limiting. The migration for `admin_pin_recovery_challenges` is present. The verifier returns a Supabase recovery token hash, but the client does not consume it before attempting `updateUser`; the completion flow is therefore not verified. The delivery template also says “three-digit” despite the generated OTP being six digits. Recovery must not be presented as release-ready until these defects are corrected and a controlled email/reset test passes.

### Room operations — P1 / implemented

Create, edit, duplicate, archive, restore, permanently delete, manage photos/features, pricing rules/overrides, availability blocks, and dashboard statistics. Destructive actions must remain role- and server-policy-controlled.

### Media/content management — P1 / implemented

Manage editable site image slots, gallery images, section copy, and short videos. Cloudinary is preferred when configured; R2/Supabase paths remain readable. Public video rendering is not verified in the current `App.jsx` path and is therefore an operationally stored capability, not a confirmed guest-facing feature.

### Guest feedback — P2 / partially implemented

`fetchApprovedFeedback` and `submitGuestFeedback` exist, but the main public render currently uses static review data from `src/data.js`; end-to-end live feedback presentation is not verified.

## 9. Core Modules

- Public marketing site and route shell.
- Rooms and pricing.
- Direct enquiry/contact.
- Admin authentication and authorization.
- Admin room inventory and availability.
- Media library and site content editor.
- Gallery.
- Supabase data/storage integration.
- Serverless media signing/deletion endpoints.
- QA/release documentation under `docs/`.

Not in current scope: payments, notifications, reports beyond dashboard counts, guest accounts, and reservation persistence.

## 10. Roles and Permissions

| Capability | Guest | Editor | Admin | Super admin |
|---|---:|---:|---:|---:|
| View public site | Yes | Yes | Yes | Yes |
| Submit guest feedback | Yes | Yes | Yes | Yes |
| Sign in to admin | No | Yes | Yes | Yes |
| View admin rooms/media | No | Yes | Yes | Yes |
| Create/edit room/content/media | No | Yes by RLS | Yes by RLS | Yes by RLS |
| Publish content | No | Yes by current RLS | Yes | Yes |
| Archive/restore/delete rooms | No | Code paths exist; confirm policy | Code paths exist | Code paths exist |
| Manage users/roles | No | No verified module | No verified module | No verified module |
| View audit logs | No | No direct UI verified | No direct UI verified | No direct UI verified |

The matrix is a repository baseline, not a substitute for Supabase policies. Confirm role-specific destructive permissions before expanding them.

## 11. User Flows

### Guest enquiry

1. Guest opens public route.
2. Guest explores sections or room cards.
3. Guest enters dates, guests, and room in booking bar/form.
4. Guest activates WhatsApp CTA.
5. Browser opens `hotel.whatsappBase` with encoded message.
6. Hotel confirms availability, final rate, policies, and payment externally.

### Admin room update

1. Visit `/admin/login`.
2. Supabase Auth authenticates credentials; lockout RPC is checked/updated.
3. `fetchCurrentAdminProfile` verifies active admin profile.
4. Protected layout renders dashboard/rooms/media.
5. Operator edits room or related child entities.
6. Supabase RLS and audit-log writes enforce/record the change.

### Content publish

1. Editor opens Media Library.
2. Loads section rows and edits bounded fields.
3. Saves draft or publishes/toggles visibility.
4. Public client fetches only `published` and `is_visible = true` rows.
5. Local fallback remains available if the read fails.

## 12. Data Requirements

Verified entities include `site_images`, `site_sections`, `site_videos`, `site_gallery_images`, `rooms`, `room_images`, `room_features`, `room_price_overrides`, `room_pricing_rules`, `room_availability`, `admin_profiles`, `room_audit_logs`, `guest_feedback`, and Supabase Auth users. Only the site-image/section/video/gallery migrations are present in this repository; the base room/auth schema is an external dependency.

Sensitive data: admin credentials, service-role key, Cloudinary secret, R2 secret, and private audit/internal notes. These must remain server-side or protected by RLS. Guest feedback is user-provided personal content and requires moderation before public display.

## 13. Integrations

| Integration | Purpose | Auth/config | Failure behavior |
|---|---|---|---|
| Supabase | Auth, Postgres reads/writes, storage | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, server `SUPABASE_SERVICE_ROLE_KEY` | Public fallbacks or visible loading/error states; admin errors shown in UI |
| WhatsApp | Direct enquiry | Hotel phone in `src/data.js` | Browser link; external delivery/availability not controlled |
| Email/maps | Contact conversion | Static hotel values | Browser handles mail/map target |
| Cloudinary | Optional media uploads | `VITE_CLOUDINARY_CLOUD_NAME`; server secret trio | Upload error surfaced; existing paths remain readable |
| Cloudflare R2 | Fallback/legacy media | R2 server values and public base URL | API returns error; no secret in client |
| Vercel | Hosting/serverless API | `vercel.json`, environment configuration | Deployment/platform concern |

## 14. Notifications

No in-app notification system is implemented. Guest enquiries are delivered through WhatsApp/email actions; delivery status, retries, unread state, and operator notifications are external and out of scope.

## 15. Non-Functional Requirements

- Performance: hero image is high priority; non-critical images use lazy loading; admin code is lazy-loaded from public routes. The verified public bundle remains 632.58 kB minified; several source images are 2.5 MB+ and the hero video is 7.5 MB, so production performance is not yet accepted.
- Accessibility: semantic headings, labels, `aria-expanded`, `aria-current`, visible focus, a skip link to `#main-content`, reduced-motion handling in room gallery, alt text for managed images; target WCAG 2.2 AA.
- SEO: public routes have client-rendered title/description/canonical/Open Graph/Twitter metadata; admin route noindex. `robots.txt` and sitemap require the confirmed production hostname, and SSR/prerendering is required for metadata guarantees to non-JavaScript crawlers.
- Security: server-side authorization/RLS, no secrets in `VITE_` variables, protected upload endpoints, no unsafe HTML rendering.
- Reliability: render-time error boundary; preserve local content when optional reads fail.
- Support: current CSS uses responsive behavior for mobile, tablet, desktop; validate actual supported browser matrix before release.
- Localization: English UI and INR formatting are the current verified baseline.
- Observability: console error logging exists; centralized production monitoring is not verified.

## 16. Security Requirements

Use Supabase Auth and RLS as authoritative controls. Never trust client roles, ownership IDs, uploaded MIME/type claims, or public paths. Keep `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, R2 secrets, and Resend API key server-only. Validate upload size/type/duration, use signed server endpoints, body allow-lists, safe error envelopes, and rate limits. PIN recovery must use short-lived hashed six-digit OTPs, generic responses, email/IP-aware rate limiting, and no user enumeration. The in-memory rate limiter is a per-instance safeguard only; shared production enforcement remains required. Add CSRF protections if cookie-authenticated mutation endpoints are introduced.

## 17. Analytics and Tracking

CTA elements expose `data-cta` values such as `whatsapp-booking`, `contact-whatsapp`, `restaurant-enquiry`, and `safari-enquiry`. A separate analytics provider is not configured. Future analytics should measure CTA clicks, room impressions, enquiry starts/completions, gallery engagement, and admin publish/update events without collecting secrets or unnecessary personal data.

## 18. Assumptions

- Hotel staff manually confirms bookings through WhatsApp/email.
- Displayed prices are indicative and may need confirmation.
- Existing local assets are approved enough for current presentation unless stakeholders identify licensing/content issues.
- Supabase project contains externally provisioned room/auth tables and security functions referenced by the code.
- English and Indian rupees are the initial market defaults.

## 19. Constraints

- Vite/React frontend and Vercel rewrite are existing constraints.
- Only files in this repository can be treated as reproducible implementation evidence.
- No payment/reservation API credentials or confirmed PMS integration are present.
- Public media may come from local assets, Supabase, R2, or Cloudinary.
- Hotel-specific facts, rates, service availability, and legal policies require stakeholder confirmation.

## 20. Dependencies

Node/npm, React 19, Vite 6, React Router 6, Framer Motion, Supabase JS, AWS S3 SDK/presigner, ESLint, Playwright dependency, Supabase schema/functions, Cloudinary/R2 configuration, Vercel hosting, and approved hotel media/content.

## 21. Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Room schema/functions absent from repo | High | High | Export/version all base migrations; document environment dependency | Developer/operator |
| Indicative data becomes stale | Medium | High | Admin content ownership and release review | Hotel operator |
| Storage provider configuration mismatch | Medium | High | Test each configured path; keep provider abstraction | Developer |
| Direct enquiry is mistaken for confirmed booking | Medium | High | Copy explicitly says hotel confirmation is required | Product owner |
| Missing type-check and automated test scripts | High | Medium | Add validation scripts before production gate | Developer/QA |
| Accessibility or responsive regressions | Medium | Medium | Playwright viewport and keyboard checks | QA |
| Incorrect production hostname in robots/sitemap | Medium | High | Confirm canonical domain before deployment and update all crawl directives together | Product owner/DevOps |
| Large local media delays mobile LCP | High | High | Replace with approved compressed derivatives and measure on production/staging | Content owner/Developer |
| Recovery email wording conflicts with OTP length | High | Medium | Correct template and run a controlled recovery test before enabling use | Developer/QA |

## 22. Acceptance Criteria

The current documentation baseline is complete when the five root docs exist, identify verified/partial/planned scope, reference actual paths and tables, keep MVP separate from future work, and agree on the first phase. Product MVP completion additionally requires stakeholder confirmation of hotel facts, reproducible schema/deployment configuration, successful build, responsive/accessibility checks, and direct-enquiry acceptance testing.

## 23. Open Questions

- Which Supabase migration/repository owns `rooms`, admin profiles, RLS helpers, pricing, and audit tables?
- Is Cloudinary the target provider, or should R2 remain the production default?
- Which room rates, facilities, restaurant claims, reviews, and travel services are currently approved for publication?
- Should the website eventually create a reservation record, or remain enquiry-only?
- Which admin roles may permanently delete rooms or publish content?
- Which legal pages and privacy/cookie consent requirements apply to the deployment jurisdiction?
- Which analytics/monitoring provider is approved?
- What is the canonical production domain for sitemap, robots, canonical tags, and Search Console?
- Is the PIN recovery email provider/domain approved, and who owns a controlled end-to-end recovery test?

## 24. Future Enhancements

Online reservation/payment, availability calendar visible to guests, PMS/OTA sync, transactional email/SMS, guest accounts, multilingual content, live review integration, analytics dashboard, staff/user management UI, automated image optimization pipeline, and centralized error/performance monitoring.
