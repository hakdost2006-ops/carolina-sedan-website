# Upload Instructions

The Carolina Sedan website files are now in this repository.

## Cloudflare Pages settings

When connecting this GitHub repo to Cloudflare Pages:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `/`

## Reservation form setup

The form posts to:

`/api/reservation`

This is powered by:

`functions/api/reservation.js`

Set these Cloudflare Pages environment variables before testing live form submissions:

- `RESEND_API_KEY`
- `RESERVATION_FROM_EMAIL`
- `RESERVATION_TO_EMAIL=booking@carolinasedan.com`
- `RESERVATION_TO_PHONE=+19192594030`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Do not change domain DNS until the Cloudflare preview website is working correctly.
