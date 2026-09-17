# PlasticBench MLP Collection Platform Plan

## Outcome
Extend the existing PlasticBench donation and impact app into a credible MLP waste reporting and collection coordination platform without replacing working pages or inventing verified environmental claims.

## Confirmed decisions
- MLP reports require sign-in so each citizen can securely view their own reports.
- Payment remains the current clearly labelled demo flow until Razorpay Test Mode credentials are available.
- Collection locations will store validated text plus coordinates, leaving the UI ready for an open-map experience without requiring a paid map key.
- Existing PlasticBench donation, impact, donor wall, profile, authentication, and admin functionality stays available.

## Phases

### Phase 1 — Reporting foundation
- Add a normalized multi-NGO-ready schema for NGOs, MLP collection requests, request events, and safe media references.
- Add explicit grants, RLS, indexes, status rules, and role-aware policies in one approved database migration.
- Add authenticated server functions for creating reports and reading the signed-in user’s own reports; keep service credentials server-only.
- Add a signed-in `/report-waste` page with validated fields for photo, location, estimated kg, waste type, description, and optional contact details.
- Add browser geolocation as an optional enhancement to manual location entry.
- Add Supabase Storage bucket and upload validation for image type/size, with private access and authenticated ownership checks.
- Generate a server-side request ID in the `MLP-YYYY-######` format and show a confirmed `REPORTED` result.
- Add `/my-reports` with loading, empty, error, and report-card states.

### Phase 2 — NGO collection management
- Extend the existing admin page with summary cards, request filters, request detail view, and confirmation dialogs.
- Add role-controlled transitions: review, accept/reject, assign, collect, verify weight, and send for processing.
- Store estimated and verified weight separately, never overwriting the original estimate.
- Add collection assignments with approved volunteer support as a later role extension, while keeping the first workflow secure for NGO admins.
- Add notifications data and an in-app notification surface for report and status changes where the event model is stable.

### Phase 3 — Waste journey tracker
- Add a public-safe request journey surface only for authorized reporters and staff.
- Display the lifecycle timeline, timestamps, location, responsible party, verified weight, and optional evidence photo.
- Add clear state labels for reported, accepted, assigned, collected, verified, processing, processed, and impact recorded.
- Add before/after impact presentation that distinguishes reported estimates, verified weights, and demonstration values.

### Phase 4 — Open collection map and awareness
- Add an open-map collection view using stored coordinates and privacy-safe marker data.
- Show reported, assigned, and collected markers without exposing personal contact details.
- Add an awareness hub covering MLP, handling, reporting, collection, processing, and PlasticBench’s downstream role.

### Phase 5 — PlasticBench public impact records
- Add schools, benches, and impact records with multi-NGO ownership and public-safe fields.
- Add a public bench detail route with QR-friendly stable URLs and a generated QR code only after the record is real.
- Link verified processing outcomes to approved end uses; PlasticBench remains one possible route, not an automatic conversion claim.
- Make any plastic-to-bench factor configurable by NGO/admin and label values as verified, estimated, or demonstration.

### Phase 6 — Donation and payment hardening
- Keep the current demo payment visible as a demo until credentials are provided.
- After Razorpay Test Mode credentials are available, add secure order creation, checkout, server-side signature verification, idempotency, failure/cancel/retry states, and donation payment fields.
- Update impact only from verified payment records, not from a client-side success state.
- Add donation receipt and aggregated impact journey messaging that never claims a specific donation caused a specific bench unless linked by verified records.

### Phase 7 — Live impact dashboard and review
- Replace static chart series with database-backed monthly MLP, donation, bench, and status data.
- Add total reported, collected, processed, benches, schools, donors, volunteers, and completed requests with explicit data-quality labels.
- Add realtime updates where useful, pagination for operational lists, and consistent loading/error/empty states.
- Run security, accessibility, responsive, route, and regression checks across existing donation/auth/impact flows.

## Routes to add incrementally
- `/report-waste` — authenticated report form
- `/my-reports` — authenticated citizen report list
- `/my-reports/$requestId` — authenticated journey tracker
- `/bench/$benchId` — public safe bench impact page
- `/awareness` — public education hub
- Admin request management stays under the existing authenticated admin route.

## Database and security principles
- Use migrations for schema only, with GRANTs immediately after every public table creation.
- Keep roles in `user_roles`; do not place privileges on profiles or client storage.
- Use authenticated server functions for private reads/writes and RLS as the final authorization boundary.
- Store only private image paths; create time-limited access URLs after authorization.
- Validate all client inputs again on the server, including image MIME type/size, quantity, coordinates, text lengths, and status transitions.
- Keep public bench data separate from private donor/contact/report data.
- Never expose service keys, payment secrets, private contact details, or unverified environmental claims.

## Not included until an external prerequisite is supplied
- Live Razorpay Test Mode integration: requires Razorpay test credentials and provider setup.
- Provider-side notification delivery: requires an approved email/SMS service choice and credentials.
- Map provider calls: the first implementation can use validated coordinates and an open-map UI; no paid key is assumed.
