const REQUIRED_FIELDS = ["name", "phone", "pickup-time", "pickup-address", "destination-address"];
const DEFAULT_TO_EMAIL = "booking@carolinasedan.com";
const DEFAULT_FROM_EMAIL = "Carolina Sedan <booking@carolinasedan.com>";
const DEFAULT_TO_PHONE = "+19199240568";
const RESERVATION_PREFIX = "CSS";
const CANONICAL_HOST = "www.carolinasedan.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

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

const LEGACY_REDIRECTS = {
  "/blog": "/news",
  "/post/exploring-the-best-restaurants-in-chapel-hill-and-carrboro-with-carolina-sedan-service":
    "/news#restaurants",
  "/post/discover-carolina-sedan-services-top-10-chapel-hill-carrboro-attractions":
    "/news#chapel-hill-attractions",
  "/post/the-advantages-of-choosing-a-professional-chauffeur-for-your-airport-transfers-with-carolina-sedan":
    "/rdu-airport-transportation-chapel-hill",
  "/post/discovering-the-history-and-culture-of-chapel-hill-and-carrboro-with-carolina-sedan-service":
    "/news#chapel-hill-culture",
  "/post/why-carolina-sedan-service-is-the-best-choice-for-your-next-special-event":
    "/event-transportation-triangle",
};

const PAGE_ROUTES = {
  "/": "/index.html",
  "/about": "/about.html",
  "/ai-summary": "/ai-summary.html",
  "/chapel-hill-regional-weekend-ride-tips-2026": "/chapel-hill-regional-weekend-ride-tips-2026.html",
  "/chapel-hill-carrboro-dex-fest-travel-update-2026":
    "/chapel-hill-carrboro-dex-fest-travel-update-2026.html",
  "/durham-duke-street-closure-detours-2026": "/durham-duke-street-closure-detours-2026.html",
  "/event-transportation-triangle": "/event-transportation-triangle.html",
  "/hotel-rdu-transportation": "/hotel-rdu-transportation.html",
  "/july-4th-week-travel-advisory-2026": "/july-4th-week-travel-advisory-2026.html",
  "/juneteenth-fathers-day-weekend-travel-notes-2026":
    "/juneteenth-fathers-day-weekend-travel-notes-2026.html",
  "/medical-appointment-rides": "/medical-appointment-rides.html",
  "/news": "/news.html",
  "/rdu-airport-transportation-chapel-hill": "/rdu-airport-transportation-chapel-hill.html",
  "/rdu-parking-time-tips-may-2026": "/rdu-parking-time-tips-may-2026.html",
  "/reservation": "/reservation.html",
  "/triangle-travel-advisory-july-14-19-2026": "/triangle-travel-advisory-july-14-19-2026.html",
  "/triangle-travel-advisory-july-27-august-2-2026":
    "/triangle-travel-advisory-july-27-august-2-2026.html",
  "/triangle-travel-update-rdu-terminal-2-raleigh-roadwork-durham-detour-may-2026":
    "/triangle-travel-update-rdu-terminal-2-raleigh-roadwork-durham-detour-may-2026.html",
  "/unc-baseball-super-regional-weekend-travel-2026": "/unc-baseball-super-regional-weekend-travel-2026.html",
  "/unc-department-transportation": "/unc-department-transportation.html",
  "/unc-health-championship-raleigh-ride-tips-2026": "/unc-health-championship-raleigh-ride-tips-2026.html",
};

const STATIC_FILES = new Set([
  "/_headers",
  "/_redirects",
  "/robots.txt",
  "/llms.txt",
  "/sitemap.xml",
  "/script.js",
  "/styles.css",
  "/team.css",
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function redirect(location, status = 301) {
  return new Response(null, {
    status,
    headers: { location },
  });
}

function notFound() {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="robots" content="noindex" /><title>Page Not Found | Carolina Sedan</title><link rel="stylesheet" href="/styles.css" /></head><body><main class="section"><p class="eyebrow">Page Not Found</p><h1>That page is not available.</h1><p>The page may have moved during the website migration.</p><div class="hero-actions"><a class="button primary" href="/">Go home</a><a class="button quiet" href="/news">Read local travel news</a><a class="button quiet" href="tel:+19199240568">Call 919-924-0568</a></div></main></body></html>`,
    {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}

function clean(value) {
  return String(value || "").trim();
}

function getOrigin(request) {
  return CANONICAL_ORIGIN;
}

function formatPickupTime(value) {
  if (!value) return "Not provided";

  const localDateTime = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (localDateTime) {
    const [, year, month, day, hourValue, minute] = localDateTime;
    const hour = Number(hourValue);
    const hour12 = hour % 12 || 12;
    const period = hour >= 12 ? "PM" : "AM";
    const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(date);

    return `${dateLabel}, ${hour12}:${minute} ${period}`;
  }

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
  return `${getOrigin(request)}/reservation?id=${encodeURIComponent(reservationId)}`;
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

function diagnosticsEnabled(env) {
  return clean(env.EXPOSE_DIAGNOSTICS).toLowerCase() === "true";
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
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (url.hostname === "carolinasedan.com") {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      return redirect(url.toString());
    }

    if (url.hostname === CANONICAL_HOST && url.protocol !== "https:") {
      url.protocol = "https:";
      return redirect(url.toString());
    }

    if (pathname.endsWith(".html")) {
      const canonicalPath = pathname === "/index.html" ? "/" : pathname.slice(0, -5);
      url.pathname = canonicalPath;
      return redirect(url.toString());
    }

    const legacyRedirect = LEGACY_REDIRECTS[pathname];
    if (legacyRedirect) {
      return redirect(`${CANONICAL_ORIGIN}${legacyRedirect}`);
    }

    const hostedImage = await serveHostedImage(pathname);
    if (hostedImage) {
      return hostedImage;
    }

    if (pathname === "/api/reservation-status") {
      if (!diagnosticsEnabled(env)) {
        return json({ ok: true, status: "reservation endpoint available" });
      }

      return json(getReservationStatus(env));
    }

    if (pathname === "/api/reservation") {
      return handleReservation(request, env);
    }

    if (PAGE_ROUTES[pathname]) {
      url.pathname = PAGE_ROUTES[pathname];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    if (STATIC_FILES.has(pathname)) {
      return env.ASSETS.fetch(request);
    }

    return notFound();
  },
};
