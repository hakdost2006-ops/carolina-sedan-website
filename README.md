# Carolina Sedan Service Website

Static website for Carolina Sedan Service, prepared for Cloudflare Pages.

## Cloudflare Pages setup

Use these settings when creating the Cloudflare Pages project:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `/`

## Reservation form

The booking form submits to `/api/reservation`, implemented as a Cloudflare Worker endpoint and the Pages-compatible function in `functions/api/reservation.js`.

Required Cloudflare secret:

- `RESEND_API_KEY`

Optional Cloudflare variables:

- `RESERVATION_FROM_EMAIL`
- `RESERVATION_TO_EMAIL=booking@carolinasedan.com`
- `RESERVATION_TO_PHONE=+19199240568`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email requires a Resend API key. SMS requires a Twilio phone number and approved messaging setup.

Deployment trigger: 2026-05-21 15:25 EDT.

## Domain migration

Do not update DNS until the Cloudflare preview URL works.

Recommended launch order:

1. Push this folder to GitHub.
2. Connect the GitHub repo to Cloudflare.
3. Confirm the preview site loads correctly.
4. Configure the reservation environment variables.
5. Test a reservation submission.
6. Add `www.carolinasedan.com` as a custom domain.
7. Update DNS only after the preview and form are confirmed.