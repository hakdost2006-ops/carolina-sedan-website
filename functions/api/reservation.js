const REQUIRED_FIELDS = ["name", "contact", "pickup-time", "details"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
function clean(value) { return String(value || "").trim(); }
function formatPickupTime(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date);
}
function buildMessage(data) {
  return ["New Carolina Sedan reservation request", "", `Name: ${data.name}`, `Phone or email: ${data.contact}`, `Pickup date/time: ${formatPickupTime(data.pickupTime)}`, "", "Ride details:", data.details, "", `Submitted: ${new Date().toISOString()}`].join("\n");
}
async function sendEmail(env, data, message) {
  if (!env.RESEND_API_KEY || !env.RESERVATION_TO_EMAIL || !env.RESERVATION_FROM_EMAIL) return { skipped: true, reason: "Email environment variables are not configured." };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.RESERVATION_FROM_EMAIL, to: [env.RESERVATION_TO_EMAIL], subject: `Reservation request from ${data.name}`, text: message, reply_to: data.contact.includes("@") ? data.contact : undefined }),
  });
  if (!response.ok) throw new Error(`Email send failed: ${await response.text()}`);
  return { sent: true };
}
async function sendSms(env, message) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER || !env.RESERVATION_TO_PHONE) return { skipped: true, reason: "SMS environment variables are not configured." };
  const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const body = new URLSearchParams({ From: env.TWILIO_FROM_NUMBER, To: env.RESERVATION_TO_PHONE, Body: message.slice(0, 1500) });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: "POST", headers: { authorization: `Basic ${credentials}`, "content-type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error(`SMS send failed: ${await response.text()}`);
  return { sent: true };
}
export async function onRequestPost({ request, env }) {
  let formData;
  try { formData = await request.formData(); } catch { return json({ error: "Invalid form submission." }, 400); }
  if (clean(formData.get("website"))) return json({ ok: true });
  const missing = REQUIRED_FIELDS.filter((field) => !clean(formData.get(field)));
  if (missing.length > 0) return json({ error: "Please complete all required fields." }, 400);
  const data = { name: clean(formData.get("name")), contact: clean(formData.get("contact")), pickupTime: clean(formData.get("pickup-time")), details: clean(formData.get("details")) };
  const message = buildMessage(data);
  try {
    const [email, sms] = await Promise.all([sendEmail(env, data, message), sendSms(env, message)]);
    if (!email.sent && !sms.sent) return json({ error: "Reservation notifications are not configured yet." }, 503);
    return json({ ok: true, email, sms });
  } catch (error) {
    return json({ error: error.message || "Unable to send reservation request." }, 500);
  }
}
export function onRequestGet() { return json({ error: "Use POST to submit a reservation request." }, 405); }
