# Carolina Sedan Service Website

Static website for Carolina Sedan Service, prepared for Cloudflare Pages and Cloudflare Workers.

## Cloudflare setup

Use these settings when creating or reviewing the Cloudflare project:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `/`
- Worker deploy command: `npx wrangler deploy`

## Reservation form

The booking form submits to `/api/reservation`, implemented as a Cloudflare Worker endpoint and the Pages-compatible function in `functions/api/reservation.js`.

Required Cloudflare secret:

- `RESEND_API_KEY`
- `ADMIN_TOKEN` for the private `/admin` reservation queue

Square payment-link secrets and variable, required only when the owner enables Square:

- `SQUARE_ACCESS_TOKEN` (secret; production token from the Square Developer Console)
- `SQUARE_LOCATION_ID` (secret)
- `SQUARE_ENVIRONMENT=production` (text; use `sandbox` for non-production testing)

Optional Cloudflare variables:

- `RESERVATION_FROM_EMAIL=Carolina Sedan <booking@carolinasedan.com>`
- `RESERVATION_TO_EMAIL=booking@carolinasedan.com`
- `RESERVATION_TO_PHONE=+19199240568`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email requires a Resend API key. SMS requires a Twilio phone number and approved messaging setup.

### Stage 1 reservation engine

The homepage form collects ride type, phone, email, pickup time, pickup address, destination, passengers, luggage, flight number, lead source, and notes. The Worker generates a reservation request number such as `CSS-20260731-ABC123` and includes a private status link in the email notification.

Optional Cloudflare KV binding:

- Binding name: `RESERVATIONS`
- Purpose: store reservation request details so `/reservation.html?id=...` can show the customer status page.

Without the `RESERVATIONS` KV binding, email notifications can still work, but the status page cannot retrieve saved ride details. Add the KV namespace in Cloudflare Worker settings, bind it as `RESERVATIONS`, then redeploy.

Payment collection is not part of Stage 1. Stage 2 uses Square-hosted checkout links so Carolina Sedan never receives or stores card details.

### Stage 2 admin queue foundation

The `/admin` page loads saved reservations from the `RESERVATIONS` KV binding when the owner enters the Cloudflare `ADMIN_TOKEN`. It can update:

- reservation status
- payment status
- quoted price
- payment link
- driver name
- customer-visible message
- private admin notes

The owner has four deliberately separate actions for each reservation:

- **Save privately** updates the queue and customer status page without sending email.
- **Confirm & email customer** marks the reservation confirmed and sends the approved ride details, final price, and status link through Resend. It does not send a payment link.
- **Create Square link** creates a one-time Square-hosted checkout link for the confirmed ride and exact quote. It stores the link privately but does not email or charge the customer.
- **Send payment request** emails the already-created HTTPS link and only then exposes it on the customer status page.

The email actions require a valid customer email and final quoted price, preview the action in a browser confirmation, disable repeat clicks while sending, and use unique request IDs so retries do not create duplicate emails. A five-minute per-reservation cooldown blocks accidental repeat deliveries. Delivery success or failure is stored with the reservation for owner review.

Square link creation requires a confirmed reservation, final quote, and owner authentication. It uses Square's idempotency support and stores the returned payment-link and order identifiers. The application does not mark the reservation paid automatically; the owner must verify payment in Square before selecting `paid`. SMS and automatic payment webhooks remain deferred.

### Reservation spam protection

The Worker applies several low-friction checks before saving a request or notifying the owner:

- hidden honeypot field
- minimum form-completion time
- bounded field lengths and email validation
- repeated-submission limit of five requests per hashed IP address per 15 minutes
- screening for obvious marketing solicitations disguised as reservations
- screening for identical pickup and destination outside hourly-service requests

Blocked submissions receive a neutral accepted response so automated senders do not get useful tuning feedback. Only a reason and timestamp are retained for blocked submissions; raw IP addresses and submitted contact details are not stored in the security log.

Analytics hooks are included for booking clicks, phone clicks, estimate-to-booking clicks, reservation attempts, reservation successes, and reservation errors. If Google Analytics `gtag` or Cloudflare Zaraz is present, the browser sends those events there. The site also sends lightweight first-party events to `/api/track`; if `RESERVATIONS` exists, those events are stored for 90 days without customer contact details.

Deployment trigger: 2026-07-31 after Cloudflare Git reconnect.
