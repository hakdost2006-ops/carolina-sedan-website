const REQUIRED_FIELDS = ["name", "contact", "pickup-time", "details"];
const DEFAULT_TO_EMAIL = "booking@carolinasedan.com";
const DEFAULT_FROM_EMAIL = "Carolina Sedan <booking@carolinasedan.com>";
const DEFAULT_TO_PHONE = "+19199240568";

const HOSTED_IMAGES = {
  "/assets/carolina-sedan-logo.jpeg":
    "https://static.wixstatic.com/media/227b82_7387b084eac248a08f01c9856a4d3ab1~mv2.jpeg/v1/fill/w_246,h_197,al_c,q_90,enc_auto/Carolina%20S%20logo.jpeg",
  "/assets/carolina-lexus.jpeg":
    "https://static.wixstatic.com/media/227b82_f254873438d6493fb0d312c202b41649~mv2.jpeg/v1/fill/w_794,h_794,al_c,q_90,enc_auto/Caolina%20Lexus.jpeg",
  "/assets/chauffeur-hero.jpg":
    "https://static.wixstatic.com/media/ea26fd_b01c89023bd4439a87f0498ddb39dabb~mv2_d_3840_2200_s_2.jpg/v1/fill/w_1600,h_920,al_c,q_90,enc_auto/hero.jpg",
  "/assets/airport-service.png":
    "https://static.wixstatic.com/media/ea26fd_b01c89023bd4439a87f0498ddb39dabb~mv2_d_3840_2200_s_2.jpg/v1/fill/w_1600,h_920,al_c,q_90,enc_auto/hero.jpg",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function clean(value) {
  return String(value || "").trim();
}

function formatPickupTime(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

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

function getReservationStatus(env) {
  return {
    ok: true,
    resendKeyConnected: Boolean(clean(env.RESEND_API_KEY)),
    toEmail: clean(env.RESERVATION_TO_EMAIL) || DEFAULT_TO_EMAIL,
    fromEmail: clean(env.RESERVATION_FROM_EMAIL) || DEFAULT_FROM_EMAIL,
    smsConnected: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER),
    toPhone: clean(env.RESERVATION_TO_PHONE) || DEFAULT_TO_PHONE,
  };
}

async function serveHostedImage(pathname) {
  const imageUrl = HOSTED_IMAGES[pathname];
  if (!imageUrl) return null;

  const imageResponse = await fetch(imageUrl, {
    cf: { cacheEverything: true, cacheTtl: 31536000 },
  });

  const headers = new Headers(imageResponse.headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");

  return new Response(imageResponse.body, {
    status: imageResponse.status,
    statusText: imageResponse.statusText,
    headers,
  });
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

  if (!response.ok) throw new Error(`Email send failed: ${await response.text()}`);
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

  if (!response.ok) throw new Error(`SMS send failed: ${await response.text()}`);
  return { sent: true };
}

async function handleReservation(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Use POST to submit a reservation request." }, 405);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid form submission." }, 400);
  }

  if (clean(formData.get("website"))) return json({ ok: true });

  const missing = REQUIRED_FIELDS.filter((field) => !clean(formData.get(field)));
  if (missing.length > 0) return json({ error: "Please complete all required fields." }, 400);

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const hostedImage = await serveHostedImage(url.pathname);
    if (hostedImage) {
      return hostedImage;
    }

    if (url.pathname === "/api/reservation-status") {
      return json(getReservationStatus(env));
    }

    if (url.pathname === "/api/reservation") {
      return handleReservation(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
