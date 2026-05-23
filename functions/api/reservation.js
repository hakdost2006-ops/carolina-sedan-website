const REQUIRED_FIELDS = ["name", "contact", "pickup-time", "details"];
const DEFAULT_TO_EMAIL = "booking@carolinasedan.com";
const DEFAULT_FROM_EMAIL = "Carolina Sedan <booking@carolinasedan.com>";
const DEFAULT_TO_PHONE = "+19199240568";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function clean(value) {
  return String(value || "").trim();
}

function formatPickupTime(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function buildMessage(data) {
  return [
    "New Carolina Sedan reservation request",
    "",
    `Name: ${data.name}`,
    `Phone or email: ${data.contact}`,
    `Pickup date/time: ${formatPickupTime(data.pickupTime)}`,
    "",
    "Ride details:",
    data.details,
    "",
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");
}

async function sendEmail(env, data, message) {
  const apiKey = clean(env.RESEND_API_KEY);
  const toEmail = clean(env.RESERVATION_TO_EMAIL) || DEFAULT_TO_EMAIL;
  const fromEmail = clean(env.RESERVATION_FROM_EMAIL) || DEFAULT_FROM_EMAIL;

  if (!apiKey) {
    return { skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `Reservation request from ${data.name}`,
      text: message,
      reply_to: data.contact.includes("@") ? data.contact : undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed: ${body}`);
  }

  return { sent: true };
}

async function sendSms(env, message) {
  const toPhone = clean(env.RESERVATION_TO_PHONE) || DEFAULT_TO_PHONE;

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    return { skipped: true, reason: "SMS environment variables are not configured." };
  }

  const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const body = new URLSearchParams({
    From: env.TWILIO_FROM_NUMBER,
    To: toPhone,
    Body: message.slice(0, 1500),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`SMS send failed: ${responseBody}`);
  }

  return { sent: true };
}

export async function onRequestPost({ request, env }) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  if (clean(formData.get("website"))) {
    return json({ ok: true });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !clean(formData.get(field)));

  if (missing.length > 0) {
    return json({ error: "Please complete all required fields." }, 400);
  }

  const data = {
    name: clean(formData.get("name")),
    contact: clean(formData.get("contact")),
    pickupTime: clean(formData.get("pickup-time")),
    details: clean(formData.get("details")),
  };
  const message = buildMessage(data);

  const [emailResult, smsResult] = await Promise.allSettled([
    sendEmail(env, data, message),
    sendSms(env, message),
  ]);

  const email = emailResult.status === "fulfilled" ? emailResult.value : { error: emailResult.reason.message };
  const sms = smsResult.status === "fulfilled" ? smsResult.value : { error: smsResult.reason.message };
  const sent = Boolean(email.sent || sms.sent);

  if (sent) {
    return json({ ok: true, email, sms });
  }

  const failed = Boolean(email.error || sms.error);
  const error = failed
    ? "Reservation notification delivery failed."
    : "Reservation notifications are not configured yet.";

  return json({ error, email, sms }, failed ? 500 : 503);
}

export function onRequestGet() {
  return json({ error: "Use POST to submit a reservation request." }, 405);
}
