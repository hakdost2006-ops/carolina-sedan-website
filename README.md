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

Optional Cloudflare variables:

- `RESERVATION_FROM_EMAIL=Carolina Sedan <booking@carolinasedan.com>`
- `RESERVATION_TO_EMAIL=booking@carolinasedan.com`
- `RESERVATION_TO_PHONE=+19199240568`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email requires a Resend API key. SMS requires a Twilio phone number and approved messaging setup.

### Stage 1 reservation engine

The homepage form collects ride type, phone, email, pickup time, pickup address, destination, passengers, luggage, flight number, and notes. The Worker generates a reservation request number such as `CSS-20260731-ABC123` and includes a private status link in the email notification.

Optional Cloudflare KV binding:

- Binding name: `RESERVATIONS`
- Purpose: store reservation request details so `/reservation.html?id=...` can show the customer status page.

Without the `RESERVATIONS` KV binding, email notifications can still work, but the status page cannot retrieve saved ride details. Add the KV namespace in Cloudflare Worker settings, bind it as `RESERVATIONS`, then redeploy.

Payment collection is not part of Stage 1. Add Stripe in Stage 2 after the reservation request and tracking flow is stable.
