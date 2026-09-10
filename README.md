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

Payment collection is not part of Stage 1. Add Stripe in Stage 2 after the reservation request and tracking flow is stable.

### Stage 2 admin queue foundation

The `/admin` page loads saved reservations from the `RESERVATIONS` KV binding when the owner enters the Cloudflare `ADMIN_TOKEN`. It can update:

- reservation status
- payment status
- quoted price
- payment link
- driver name
- customer-visible message
- private admin notes

The owner has two separate actions for each reservation:

- **Save without email** updates the private queue and customer status page only.
- **Confirm & email customer** marks the reservation confirmed and sends the approved ride details, final price, status link, and optional HTTPS payment link to the customer's email through Resend.

The confirmation action requires a valid customer email and final quoted price, previews the fare and payment method in a second browser confirmation, disables repeat clicks while sending, and uses a unique request ID so a retried request cannot create a duplicate email. A five-minute per-reservation cooldown blocks accidental repeat confirmations after delivery. Delivery success or failure is stored with the reservation for owner review.

This action does not charge the customer and does not send SMS. Payment links remain owner-created until Stripe is configured and tested.

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
