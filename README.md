# Carolina Sedan Service Website

Static website for Carolina Sedan Service, prepared for Cloudflare Pages.

## Cloudflare Pages setup

Use these settings when creating the Cloudflare Pages project:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `/`

## Reservation form

The booking form submits to `/api/reservation`, implemented as a Cloudflare Pages Function in `functions/api/reservation.js`.

Set these Cloudflare Pages environment variables:

- `RESEND_API_KEY`
- `RESERVATION_FROM_EMAIL`
- `RESERVATION_TO_EMAIL=booking@carolinasedan.com`
- `RESERVATION_TO_PHONE=+19192594030`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Email requires a verified sender/domain in Resend. SMS requires a Twilio phone number and approved messaging setup.

## Domain migration

Do not update DNS until the Cloudflare Pages preview URL works.

Recommended launch order:

1. Push this folder to GitHub.
2. Connect the GitHub repo to Cloudflare Pages.
3. Confirm the Pages preview site loads correctly.
4. Configure the reservation environment variables.
5. Test a reservation submission.
6. Add `www.carolinasedan.com` as a custom domain in Cloudflare Pages.
7. Update DNS only after the preview and form are confirmed.
