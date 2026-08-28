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

These updates change the customer `/reservation?id=...` status page. They do not automatically send email, SMS, or charge a customer. Payment links should be created manually until Stripe is configured and tested.

Analytics hooks are included for booking clicks, phone clicks, estimate-to-booking clicks, reservation attempts, reservation successes, and reservation errors. If Google Analytics `gtag` or Cloudflare Zaraz is present, the browser sends those events there. The site also sends lightweight first-party events to `/api/track`; if `RESERVATIONS` exists, those events are stored for 90 days without customer contact details.

Deployment trigger: 2026-07-31 after Cloudflare Git reconnect.
