const REQUIRED_FIELDS = ["name", "phone", "pickup-time", "pickup-address", "destination-address"];
const DEFAULT_TO_EMAIL = "booking@carolinasedan.com";
const DEFAULT_FROM_EMAIL = "Carolina Sedan <booking@carolinasedan.com>";
const DEFAULT_TO_PHONE = "+19199240568";
const RESERVATION_PREFIX = "CSS";

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

function getOrigin(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
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

function makeReservationId(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `${RESERVATION_PREFIX}-${date}-${random}`;
}

function getTrackingUrl(request, reservationId) {
  return `${getOrigin(request)}/reservation.html?id=${encodeURIComponent(reservationId)}`;
}

function buildReservation(formData, request) {
  const id = makeReservationId();
  const pickupTime = clean(formData.get("pickup-time"));
  const legacyContact = clean(formData.get("contact"));
  const phone = clean(formData.get("phone")) || legacyContact;
  const email = clean(formData.get("email")) || (legacyContact.includes("@") ? legacyContact : "");

  return {
    id,
    status: "pending-confirmation",
    paymentStatus: "not-requested",
    createdAt: new Date().toISOString(),
    trackingUrl: getTrackingUrl(request, id),
    name: clean(formData.get("name")),
    phone,
    email,
    contact: [phone, email].filter(Boolean).join(" | "),
    rideType: clean(formData.get("ride-type")) || "Reservation request",
    pickupTime,
    pickupTimeLabel: formatPickupTime(pickupTime),
    pickupAddress: clean(formData.get("pickup-address")),
    destinationAddress: clean(formData.get("destination-address")),
    passengers: clean(formData.get("passengers")) || "1",
    luggage: clean(formData.get("luggage")),
    flightNumber: clean(formData.get("flight-number")),
    details: clean(formData.get("details")),
  };
}

function buildMessage(data) {
  return [
    "New Carolina Sedan reservation request",
    "",
    `Reservation ID: ${data.id}`,
    `Status link: ${data.trackingUrl}`,
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone || "Not provided"}`,
    `Email: ${data.email || "Not provided"}`,
    `Ride type: ${data.rideType}`,
    `Pickup date/time: ${data.pickupTimeLabel}`,
    `Pickup: ${data.pickupAddress}`,
    `Destination: ${data.destinationAddress}`,
    `Passengers: ${data.passengers}`,
    `Luggage: ${data.luggage || "Not provided"}`,
    `Flight: ${data.flightNumber || "Not provided"}`,
    "",
    "Notes:",
    data.details || "None",
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
    storageConnected: Boolean(env.RESERVATIONS),
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
      subject: `${data.id} | Reservation request from ${data.name}`,
      text: message,
      reply_to: data.email || undefined,
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

async function saveReservation(env, reservation) {
  if (!env.RESERVATIONS) {
    return { skipped: true, reason: "RESERVATIONS KV binding is not configured." };
  }

  await env.RESERVATIONS.put(`reservation:${reservation.id}`, JSON.stringify(reservation), {
    expirationTtl: 60 * 60 * 24 * 180,
  });

  return { saved: true };
}

async function getReservation(request, env) {
  const url = new URL(request.url);
  const id = clean(url.searchParams.get("id")).toUpperCase();

  if (!id) {
    return json({ error: "Reservation number is required." }, 400);
  }

  if (!env.RESERVATIONS) {
    return json(
      {
        error:
          "Reservation tracking storage is not connected yet. Please call or text Carolina Sedan to confirm status.",
        storageConnected: false,
      },
      503
    );
  }

  const reservation = await env.RESERVATIONS.get(`reservation:${id}`, "json");

  if (!reservation) {
    return json({ error: "Reservation was not found." }, 404);
  }

  return json({ ok: true, reservation, storageConnected: true });
}

async function handleReservation(request, env) {
  if (request.method === "GET") {
    return getReservation(request, env);
  }

  if (request.method !== "POST") {
    return json({ error: "Use POST to submit a reservation request or GET to check reservation status." }, 405);
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

  const data = buildReservation(formData, request);
  const message = buildMessage(data);

  const [storageResult, emailResult, smsResult] = await Promise.allSettled([
    saveReservation(env, data),
    sendEmail(env, data, message),
    sendSms(env, message),
  ]);

  const storage =
    storageResult.status === "fulfilled" ? storageResult.value : { error: storageResult.reason.message };
  const email = emailResult.status === "fulfilled" ? emailResult.value : { error: emailResult.reason.message };
  const sms = smsResult.status === "fulfilled" ? smsResult.value : { error: smsResult.reason.message };
  const sent = Boolean(email.sent || sms.sent);

  if (sent) {
    return json({
      ok: true,
      reservationId: data.id,
      statusUrl: data.trackingUrl,
      storageConnected: Boolean(storage.saved),
      storage,
      email,
      sms,
    });
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
