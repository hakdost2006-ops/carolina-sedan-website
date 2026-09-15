const REQUIRED_FIELDS = ["name", "phone", "pickup-time", "pickup-address", "destination-address"];
const DEFAULT_TO_EMAIL = "booking@carolinasedan.com";
const DEFAULT_FROM_EMAIL = "Carolina Sedan <booking@carolinasedan.com>";
const DEFAULT_TO_PHONE = "+19199240568";
const RESERVATION_PREFIX = "CSS";
const ADMIN_STATUSES = new Set([
  "pending-confirmation",
  "confirmed",
  "declined",
  "completed",
  "canceled",
  "reschedule-requested",
]);
const PAYMENT_STATUSES = new Set(["not-requested", "payment-link-sent", "paid", "pay-on-ride", "refunded"]);
const CANONICAL_HOST = "www.carolinasedan.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const RESERVATION_TTL = 60 * 60 * 24 * 180;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const NOTIFICATION_LOG_LIMIT = 20;
const CONFIRMATION_COOLDOWN_SECONDS = 5 * 60;
const SQUARE_API_VERSION = "2026-08-19";

const LEGACY_REDIRECTS = {
  "/blog": "/news",
  "/chapel-hill-regional-weekend-ride-tips-2026":
    "/news#chapel-hill-regional-weekend-ride-tips-2026",
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
  "/admin": "/admin.html",
  "/about": "/about.html",
  "/ai-summary": "/ai-summary.html",
  "/chapel-hill-carrboro-dex-fest-travel-update-2026":
    "/chapel-hill-carrboro-dex-fest-travel-update-2026.html",
  "/cmas-conference-transportation-2026": "/cmas-conference-transportation-2026.html",
  "/corporate-transportation-rtp": "/corporate-transportation-rtp.html",
  "/duke-ornl-workshop-transportation-2026": "/duke-ornl-workshop-transportation-2026.html",
  "/duke-immunotherapy-symposium-transportation-2026":
    "/duke-immunotherapy-symposium-transportation-2026.html",
  "/duke-energy-conference-transportation-2026":
    "/duke-energy-conference-transportation-2026.html",
  "/dicon-dason-symposium-transportation-2026":
    "/dicon-dason-symposium-transportation-2026.html",
  "/duke-family-weekend-transportation-2026": "/duke-family-weekend-transportation-2026.html",
  "/durham-black-car-rdu-transportation": "/durham-black-car-rdu-transportation.html",
  "/durham-duke-street-closure-detours-2026": "/durham-duke-street-closure-detours-2026.html",
  "/event-transportation-triangle": "/event-transportation-triangle.html",
  "/hotel-rdu-transportation": "/hotel-rdu-transportation.html",
  "/july-4th-week-travel-advisory-2026": "/july-4th-week-travel-advisory-2026.html",
  "/juneteenth-fathers-day-weekend-travel-notes-2026":
    "/juneteenth-fathers-day-weekend-travel-notes-2026.html",
  "/medical-appointment-rides": "/medical-appointment-rides.html",
  "/news": "/news.html",
  "/nc-one-water-conference-transportation-2026":
    "/nc-one-water-conference-transportation-2026.html",
  "/rdu-airport-transportation-chapel-hill": "/rdu-airport-transportation-chapel-hill.html",
  "/rdu-parking-time-tips-may-2026": "/rdu-parking-time-tips-may-2026.html",
  "/reservation": "/reservation.html",
  "/triangle-travel-advisory-july-14-19-2026": "/triangle-travel-advisory-july-14-19-2026.html",
  "/triangle-travel-advisory-july-27-august-2-2026":
    "/triangle-travel-advisory-july-27-august-2-2026.html",
  "/triangle-travel-update-rdu-terminal-2-raleigh-roadwork-durham-detour-may-2026":
    "/triangle-travel-update-rdu-terminal-2-raleigh-roadwork-durham-detour-may-2026.html",
  "/triangle-placenta-symposium-transportation-2026":
    "/triangle-placenta-symposium-transportation-2026.html",
  "/unc-baseball-super-regional-weekend-travel-2026": "/unc-baseball-super-regional-weekend-travel-2026.html",
  "/unc-department-transportation": "/unc-department-transportation.html",
  "/unc-health-championship-raleigh-ride-tips-2026": "/unc-health-championship-raleigh-ride-tips-2026.html",
  "/unc-homecoming-transportation-2026": "/unc-homecoming-transportation-2026.html",
  "/unc-nc-state-thanksgiving-transportation-2026":
    "/unc-nc-state-thanksgiving-transportation-2026.html",
  "/unc-notre-dame-transportation-2026": "/unc-notre-dame-transportation-2026.html",
  "/unc-water-health-conference-transportation-2026":
    "/unc-water-health-conference-transportation-2026.html",
  "/unc-visual-discovery-conference-transportation-2026":
    "/unc-visual-discovery-conference-transportation-2026.html",
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
  "/assets/airport-service.png",
  "/assets/carolina-lexus.jpeg",
  "/assets/carolina-sedan-logo.jpeg",
  "/assets/chauffeur-hero.jpg",
  "/assets/team-beck.jpeg",
  "/assets/team-noah.jpg",
  "/assets/team-sam.jpeg",
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
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

function cleanLimit(value, length) {
  return clean(value).slice(0, length);
}

function isValidEmail(value) {
  const email = clean(value);
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAddress(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function hashValue(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function looksLikeSolicitation(formData) {
  const content = [formData.get("details"), formData.get("name"), formData.get("pickup-address")]
    .map((value) => clean(value).toLowerCase())
    .join(" ");
  const signals = [
    /\bai (agent|assistant|implementation)\b/,
    /\b(marketing|seo|lead generation) (agency|service|services|offer|solution|solutions)?\b/,
    /\b(schedule|book|grab) (a )?(call|chat|demo|meeting)\b/,
    /\b(money back|full refund|guaranteed return)\b/,
    /\bwe (can|help|build|made|created|set up).{0,50}\b(your business|your website|more customers|more leads)\b/,
    /\bunsubscribe\b/,
  ];

  return signals.filter((pattern) => pattern.test(content)).length >= 2;
}

function isImplausibleRoute(formData) {
  const rideType = clean(formData.get("ride-type")).toLowerCase();
  if (rideType === "hourly service") return false;
  const pickup = normalizeAddress(formData.get("pickup-address"));
  const destination = normalizeAddress(formData.get("destination-address"));
  return pickup.length >= 8 && pickup === destination;
}

function wasSubmittedTooQuickly(formData) {
  const startedAt = Number(clean(formData.get("form-started-at")));
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  const elapsed = Date.now() - startedAt;
  return elapsed >= 0 && elapsed < 2500;
}

async function exceedsSubmissionRate(request, env) {
  const ip = clean(request.headers.get("cf-connecting-ip"));
  if (!ip || !env.RESERVATIONS) return false;

  const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const ipHash = (await hashValue(ip)).slice(0, 24);
  const key = `security:rate:${bucket}:${ipHash}`;
  const existing = Number((await env.RESERVATIONS.get(key)) || 0);
  await env.RESERVATIONS.put(key, String(existing + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2,
  });
  return existing >= RATE_LIMIT_MAX_SUBMISSIONS;
}

async function recordBlockedSubmission(env, reason) {
  if (!env.RESERVATIONS) return;
  await env.RESERVATIONS.put(
    `security:blocked:${Date.now()}:${crypto.randomUUID()}`,
    JSON.stringify({ reason, createdAt: new Date().toISOString() }),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
}

async function silentlyBlockSubmission(env, reason) {
  await recordBlockedSubmission(env, reason);
  return json({ ok: true, accepted: true }, 202);
}

function cleanMoney(value) {
  const cleaned = clean(value).replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return "";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return "";
  return cleaned;
}

function moneyToCents(value) {
  const amount = cleanMoney(value);
  if (!amount) return 0;
  const [dollars, cents = ""] = amount.split(".");
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

function safeUrl(value) {
  const url = clean(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function safeSquareUrl(value) {
  const url = safeUrl(value);
  if (!url) return "";
  const hostname = new URL(url).hostname.toLowerCase();
  return ["square.link", "sandbox.square.link", "checkout.square.site"].includes(hostname) ? url : "";
}

function hasField(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function getOrigin(request) {
  return CANONICAL_ORIGIN;
}

function getCampaign(value, request) {
  const submitted = clean(value).slice(0, 100);
  if (submitted) return submitted;

  try {
    const referer = new URL(clean(request.headers.get("referer")));
    return clean(referer.searchParams.get("campaign")).slice(0, 100) || "Direct / not tagged";
  } catch {
    return "Direct / not tagged";
  }
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
  const phone = cleanLimit(clean(formData.get("phone")) || legacyContact, 40);
  const email = cleanLimit(clean(formData.get("email")) || (legacyContact.includes("@") ? legacyContact : ""), 254);

  return {
    id,
    status: "pending-confirmation",
    paymentStatus: "not-requested",
    createdAt: new Date().toISOString(),
    trackingUrl: getTrackingUrl(request, id),
    name: cleanLimit(formData.get("name"), 100),
    phone,
    email,
    contact: [phone, email].filter(Boolean).join(" | "),
    rideType: cleanLimit(formData.get("ride-type"), 80) || "Reservation request",
    leadSource: cleanLimit(formData.get("lead-source"), 80) || "Not provided",
    campaign: getCampaign(formData.get("campaign"), request),
    pickupTime,
    pickupTimeLabel: formatPickupTime(pickupTime),
    pickupAddress: cleanLimit(formData.get("pickup-address"), 300),
    destinationAddress: cleanLimit(formData.get("destination-address"), 300),
    passengers: cleanLimit(formData.get("passengers"), 3) || "1",
    luggage: cleanLimit(formData.get("luggage"), 160),
    flightNumber: cleanLimit(formData.get("flight-number"), 80),
    details: cleanLimit(formData.get("details"), 2000),
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
    `Lead source: ${data.leadSource || "Not provided"}`,
    `Campaign: ${data.campaign || "Direct / not tagged"}`,
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
  const result = await response.json().catch(() => ({}));
  return { sent: true, messageId: clean(result.id) };
}

function customerFirstName(name) {
  return clean(name).split(/\s+/)[0] || "there";
}

function paymentInstructions(reservation) {
  if (reservation.paymentStatus === "paid") return ["Payment status: Paid"];
  if (reservation.paymentStatus === "refunded") return ["Payment status: Refunded"];
  if (reservation.paymentStatus === "pay-on-ride") {
    return ["Payment: Pay during the ride using the payment method arranged with Carolina Sedan."];
  }
  if (reservation.paymentStatus === "payment-link-sent" && reservation.paymentLink) {
    return ["Payment link:", reservation.paymentLink];
  }
  return ["Payment: Carolina Sedan will provide payment instructions separately."];
}

function buildCustomerConfirmation(reservation) {
  const lines = [
    `Dear ${customerFirstName(reservation.name)},`,
    "",
    "Your Carolina Sedan reservation is confirmed after our availability review.",
    "",
    `Reservation ID: ${reservation.id}`,
    `Ride type: ${reservation.rideType}`,
    `Pickup date/time: ${reservation.pickupTimeLabel}`,
    `Pickup: ${reservation.pickupAddress}`,
    `Destination: ${reservation.destinationAddress}`,
    `Passengers: ${reservation.passengers}`,
  ];

  if (reservation.flightNumber) lines.push(`Flight: ${reservation.flightNumber}`);
  if (reservation.driverName) lines.push(`Driver: ${reservation.driverName}`);
  lines.push(`Confirmed price: $${reservation.quotedPrice}`);
  lines.push(...paymentInstructions(reservation));
  if (reservation.customerMessage) lines.push("", "Additional information:", reservation.customerMessage);
  lines.push(
    "",
    "View the current reservation status:",
    reservation.trackingUrl,
    "",
    "Please reply to this email or call 919-924-0568 if any flight, passenger, luggage, pickup, or destination details change.",
    "",
    "Carolina Sedan Service",
    "919-924-0568",
    "booking@carolinasedan.com"
  );
  return lines.join("\n");
}

async function sendCustomerConfirmation(env, reservation) {
  const apiKey = clean(env.RESEND_API_KEY);
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!isValidEmail(reservation.email) || !reservation.email) {
    throw new Error("This reservation does not have a valid customer email address.");
  }

  const fromEmail = clean(env.RESERVATION_FROM_EMAIL) || DEFAULT_FROM_EMAIL;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [reservation.email],
      subject: `Reservation confirmed | ${reservation.id} | Carolina Sedan`,
      text: buildCustomerConfirmation(reservation),
      reply_to: DEFAULT_TO_EMAIL,
    }),
  });

  if (!response.ok) throw new Error(`Customer email failed: ${await response.text()}`);
  const result = await response.json().catch(() => ({}));
  return { sent: true, messageId: clean(result.id) };
}

function buildCustomerPaymentRequest(reservation) {
  const lines = [
    `Dear ${customerFirstName(reservation.name)},`,
    "",
    "A payment request is ready for your confirmed Carolina Sedan reservation.",
    "",
    `Reservation ID: ${reservation.id}`,
    `Ride type: ${reservation.rideType}`,
    `Pickup date/time: ${reservation.pickupTimeLabel}`,
    `Pickup: ${reservation.pickupAddress}`,
    `Destination: ${reservation.destinationAddress}`,
    `Amount due: $${reservation.quotedPrice}`,
    "",
    "Payment link:",
    reservation.paymentLink,
    "",
    "Your reservation is not marked paid until Carolina Sedan verifies the payment with the payment provider.",
    "",
    "View the current reservation status:",
    reservation.trackingUrl,
    "",
    "Please reply to this email or call 919-924-0568 if you have any questions before paying.",
    "",
    "Carolina Sedan Service",
    "919-924-0568",
    "booking@carolinasedan.com",
  ];
  return lines.join("\n");
}

async function sendCustomerPaymentRequest(env, reservation) {
  const apiKey = clean(env.RESEND_API_KEY);
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!isValidEmail(reservation.email) || !reservation.email) {
    throw new Error("This reservation does not have a valid customer email address.");
  }

  const fromEmail = clean(env.RESERVATION_FROM_EMAIL) || DEFAULT_FROM_EMAIL;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [reservation.email],
      subject: `Payment request | ${reservation.id} | Carolina Sedan`,
      text: buildCustomerPaymentRequest(reservation),
      reply_to: DEFAULT_TO_EMAIL,
    }),
  });

  if (!response.ok) throw new Error(`Payment request email failed: ${await response.text()}`);
  const result = await response.json().catch(() => ({}));
  return { sent: true, messageId: clean(result.id) };
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
    expirationTtl: RESERVATION_TTL,
    metadata: {
      createdAt: reservation.createdAt,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      leadSource: reservation.leadSource,
      campaign: reservation.campaign,
    },
  });

  return { saved: true };
}

function getAdminToken(request) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();

  const url = new URL(request.url);
  return clean(url.searchParams.get("token"));
}

function requireAdmin(request, env) {
  const configured = clean(env.ADMIN_TOKEN);
  if (!configured) return { ok: false, response: json({ error: "ADMIN_TOKEN is not configured." }, 503) };
  if (getAdminToken(request) !== configured) return { ok: false, response: json({ error: "Unauthorized." }, 401) };
  return { ok: true };
}

function publicReservation(reservation) {
  return {
    id: reservation.id,
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    trackingUrl: reservation.trackingUrl,
    name: reservation.name,
    rideType: reservation.rideType,
    pickupTime: reservation.pickupTime,
    pickupTimeLabel: reservation.pickupTimeLabel,
    pickupAddress: reservation.pickupAddress,
    destinationAddress: reservation.destinationAddress,
    passengers: reservation.passengers,
    luggage: reservation.luggage,
    flightNumber: reservation.flightNumber,
    quotedPrice: reservation.quotedPrice,
    paymentLink: reservation.paymentStatus === "payment-link-sent" ? reservation.paymentLink : "",
    driverName: reservation.driverName,
    customerMessage: reservation.customerMessage,
  };
}

function updateFields(existing, input, { confirm = false } = {}) {
  const requestedStatus = confirm ? "confirmed" : clean(input.status);
  const status = requestedStatus || existing.status || "pending-confirmation";
  let paymentStatus = clean(input.paymentStatus) || existing.paymentStatus || "not-requested";
  const rawPaymentLink = hasField(input, "paymentLink") ? clean(input.paymentLink) : existing.paymentLink || "";
  const paymentLink = safeUrl(rawPaymentLink);
  const rawQuotedPrice = hasField(input, "quotedPrice") ? clean(input.quotedPrice) : existing.quotedPrice || "";
  const quotedPrice = cleanMoney(rawQuotedPrice);

  if (!ADMIN_STATUSES.has(status)) throw new Error("Invalid reservation status.");
  if (!PAYMENT_STATUSES.has(paymentStatus)) throw new Error("Invalid payment status.");
  if (rawQuotedPrice && !quotedPrice) throw new Error("Quoted price must be a valid positive amount.");
  if (rawPaymentLink && !paymentLink) throw new Error("Payment link must be a valid https:// address.");
  if (paymentStatus === "payment-link-sent" && !paymentLink) {
    throw new Error("Add a payment link before selecting payment link sent.");
  }

  const updatedAt = new Date().toISOString();
  const updated = {
    ...existing,
    status,
    paymentStatus,
    quotedPrice,
    paymentLink,
    driverName: hasField(input, "driverName") ? cleanLimit(input.driverName, 100) : existing.driverName || "",
    customerMessage: hasField(input, "customerMessage")
      ? cleanLimit(input.customerMessage, 2000)
      : existing.customerMessage || "",
    adminNotes: hasField(input, "adminNotes") ? cleanLimit(input.adminNotes, 4000) : existing.adminNotes || "",
    updatedAt,
  };

  if (status === "confirmed" && !updated.confirmedAt) updated.confirmedAt = updatedAt;
  if (status === "declined" && !updated.declinedAt) updated.declinedAt = updatedAt;
  if (status === "completed" && !updated.completedAt) updated.completedAt = updatedAt;
  if (status === "canceled" && !updated.canceledAt) updated.canceledAt = updatedAt;
  return updated;
}

function appendNotification(reservation, entry, latestField) {
  const notificationLog = Array.isArray(reservation.notificationLog) ? reservation.notificationLog : [];
  return {
    ...reservation,
    notificationLog: [...notificationLog, entry].slice(-NOTIFICATION_LOG_LIMIT),
    [latestField]: entry,
  };
}

async function listReservations(request, env) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  if (!env.RESERVATIONS) return json({ error: "RESERVATIONS KV binding is not configured." }, 503);

  const url = new URL(request.url);
  const statusFilter = clean(url.searchParams.get("status"));
  const list = await env.RESERVATIONS.list({ prefix: "reservation:", limit: 100 });
  const reservations = (
    await Promise.all(list.keys.map((key) => env.RESERVATIONS.get(key.name, "json")))
  )
    .filter(Boolean)
    .filter((reservation) => !statusFilter || reservation.status === statusFilter)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  return json({ ok: true, reservations, count: reservations.length, truncated: Boolean(list.list_complete === false) });
}

async function updateReservation(request, env) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  if (!env.RESERVATIONS) return json({ error: "RESERVATIONS KV binding is not configured." }, 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const id = clean(input.id).toUpperCase();
  if (!id) return json({ error: "Reservation ID is required." }, 400);

  const existing = await env.RESERVATIONS.get(`reservation:${id}`, "json");
  if (!existing) return json({ error: "Reservation was not found." }, 404);

  let updated;
  try {
    updated = updateFields(existing, input);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  await env.RESERVATIONS.put(`reservation:${id}`, JSON.stringify(updated), {
    expirationTtl: RESERVATION_TTL,
    metadata: {
      createdAt: updated.createdAt,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      leadSource: updated.leadSource,
      campaign: updated.campaign,
    },
  });

  return json({ ok: true, reservation: updated });
}

function squareApiOrigin(env) {
  const environment = clean(env.SQUARE_ENVIRONMENT).toLowerCase();
  if (environment === "production") return "https://connect.squareup.com";
  if (environment === "sandbox") return "https://connect.squareupsandbox.com";
  return "";
}

function squareErrorMessage(result, status) {
  const first = Array.isArray(result?.errors) ? result.errors[0] : null;
  const detail = cleanLimit(first?.detail || first?.code, 240);
  return detail
    ? `Square could not create the payment link: ${detail}`
    : `Square could not create the payment link (HTTP ${status}).`;
}

async function createSquarePaymentLink(request, env) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.RESERVATIONS) return json({ error: "RESERVATIONS KV binding is not configured." }, 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const id = clean(input.id).toUpperCase();
  if (!id) return json({ error: "Reservation ID is required." }, 400);
  const existing = await env.RESERVATIONS.get(`reservation:${id}`, "json");
  if (!existing) return json({ error: "Reservation was not found." }, 404);
  if (existing.status !== "confirmed") {
    return json({ error: "Confirm the reservation before creating a Square payment link." }, 409);
  }
  if (["payment-link-sent", "paid", "refunded"].includes(existing.paymentStatus)) {
    return json({ error: `Payment is already marked ${existing.paymentStatus}.` }, 409);
  }

  let prepared;
  try {
    prepared = updateFields(existing, {
      ...input,
      status: existing.status,
      paymentStatus: existing.paymentStatus || "not-requested",
    });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
  const amount = moneyToCents(prepared.quotedPrice);
  if (!amount) return json({ error: "Enter a quoted price before creating a Square payment link." }, 400);

  const requestId = clean(input.squareRequestId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
  if (!requestId) return json({ error: "A Square request ID is required." }, 400);
  const previous = (existing.notificationLog || []).find(
    (entry) => entry.type === "square-payment-link" && entry.requestId === requestId
  );
  if (previous?.status === "created" && existing.paymentLink) {
    return json({ ok: true, alreadyCreated: true, reservation: existing, square: previous });
  }

  const accessToken = clean(env.SQUARE_ACCESS_TOKEN);
  const locationId = clean(env.SQUARE_LOCATION_ID);
  const apiOrigin = squareApiOrigin(env);
  if (!accessToken || !locationId || !apiOrigin) {
    return json(
      {
        error:
          "Square is not configured. Add SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, and SQUARE_ENVIRONMENT to the Worker.",
      },
      503
    );
  }

  const response = await fetch(`${apiOrigin}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "square-version": SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      idempotency_key: `${id}-${requestId}`.slice(0, 192),
      description: `Carolina Sedan reservation ${id}`,
      payment_note: `Carolina Sedan reservation ${id}`,
      quick_pay: {
        name: `Carolina Sedan reservation ${id}`,
        price_money: { amount, currency: "USD" },
        location_id: locationId,
      },
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: squareErrorMessage(result, response.status) }, 502);

  const paymentLink = safeSquareUrl(result?.payment_link?.url);
  const squarePaymentLinkId = cleanLimit(result?.payment_link?.id, 100);
  const squareOrderId = cleanLimit(result?.payment_link?.order_id, 100);
  if (!paymentLink || !squarePaymentLinkId || !squareOrderId) {
    return json({ error: "Square returned an incomplete payment-link response." }, 502);
  }

  const createdAt = new Date().toISOString();
  const entry = {
    type: "square-payment-link",
    requestId,
    status: "created",
    amount: prepared.quotedPrice,
    createdAt,
    paymentLinkId: squarePaymentLinkId,
    orderId: squareOrderId,
  };
  const notificationLog = Array.isArray(prepared.notificationLog) ? prepared.notificationLog : [];
  const updated = {
    ...prepared,
    paymentLink,
    paymentProvider: "square",
    squarePaymentLinkId,
    squareOrderId,
    squarePaymentLinkCreatedAt: createdAt,
    notificationLog: [...notificationLog, entry].slice(-NOTIFICATION_LOG_LIMIT),
    updatedAt: createdAt,
  };
  await saveReservation(env, updated);
  return json({ ok: true, reservation: updated, square: entry });
}

async function confirmAndEmailReservation(request, env) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.RESERVATIONS) return json({ error: "RESERVATIONS KV binding is not configured." }, 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const id = clean(input.id).toUpperCase();
  if (!id) return json({ error: "Reservation ID is required." }, 400);
  const existing = await env.RESERVATIONS.get(`reservation:${id}`, "json");
  if (!existing) return json({ error: "Reservation was not found." }, 404);
  if (!existing.email || !isValidEmail(existing.email)) {
    return json({ error: "Add a valid customer email before sending confirmation." }, 400);
  }

  const requestId = clean(input.notificationRequestId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
  if (!requestId) return json({ error: "A notification request ID is required." }, 400);
  const previous = (existing.notificationLog || []).find((entry) => entry.requestId === requestId);
  if (previous?.status === "sent") {
    return json({ ok: true, alreadySent: true, reservation: existing, email: previous });
  }
  const lastSentAt = Date.parse(existing.lastConfirmationEmail?.sentAt || "");
  if (
    existing.lastConfirmationEmail?.status === "sent" &&
    Number.isFinite(lastSentAt) &&
    Date.now() - lastSentAt < CONFIRMATION_COOLDOWN_SECONDS * 1000
  ) {
    return json(
      { error: "A confirmation email was sent recently. Wait five minutes before sending another." },
      409
    );
  }

  let confirmed;
  try {
    confirmed = updateFields(existing, input, { confirm: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
  if (!confirmed.quotedPrice) return json({ error: "Enter a quoted price before sending confirmation." }, 400);

  const startedAt = new Date().toISOString();
  let pending = appendNotification(confirmed, {
    type: "confirmation-email",
    requestId,
    status: "sending",
    createdAt: startedAt,
  }, "lastConfirmationEmail");
  await saveReservation(env, pending);

  try {
    const result = await sendCustomerConfirmation(env, pending);
    const sentAt = new Date().toISOString();
    const sentEntry = {
      type: "confirmation-email",
      requestId,
      status: "sent",
      createdAt: startedAt,
      sentAt,
      messageId: result.messageId,
    };
    const log = (pending.notificationLog || []).filter((entry) => entry.requestId !== requestId);
    pending = {
      ...pending,
      notificationLog: [...log, sentEntry].slice(-NOTIFICATION_LOG_LIMIT),
      lastConfirmationEmail: sentEntry,
      confirmationEmailSentAt: sentAt,
      updatedAt: sentAt,
    };
    await saveReservation(env, pending);
    return json({ ok: true, reservation: pending, email: sentEntry });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failedEntry = {
      type: "confirmation-email",
      requestId,
      status: "failed",
      createdAt: startedAt,
      failedAt,
      error: cleanLimit(error.message, 500),
    };
    const log = (pending.notificationLog || []).filter((entry) => entry.requestId !== requestId);
    pending = {
      ...pending,
      notificationLog: [...log, failedEntry].slice(-NOTIFICATION_LOG_LIMIT),
      lastConfirmationEmail: failedEntry,
      updatedAt: failedAt,
    };
    await saveReservation(env, pending);
    return json({ error: failedEntry.error, reservation: pending }, 502);
  }
}

async function emailPaymentRequest(request, env) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.RESERVATIONS) return json({ error: "RESERVATIONS KV binding is not configured." }, 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const id = clean(input.id).toUpperCase();
  if (!id) return json({ error: "Reservation ID is required." }, 400);
  const existing = await env.RESERVATIONS.get(`reservation:${id}`, "json");
  if (!existing) return json({ error: "Reservation was not found." }, 404);
  if (existing.status !== "confirmed") {
    return json({ error: "Confirm the reservation before sending a payment request." }, 409);
  }
  if (!existing.email || !isValidEmail(existing.email)) {
    return json({ error: "Add a valid customer email before sending a payment request." }, 400);
  }
  if (["paid", "refunded"].includes(existing.paymentStatus)) {
    return json({ error: `Payment is already marked ${existing.paymentStatus}.` }, 409);
  }

  const requestId = clean(input.notificationRequestId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
  if (!requestId) return json({ error: "A notification request ID is required." }, 400);
  const previous = (existing.notificationLog || []).find(
    (entry) => entry.type === "payment-request-email" && entry.requestId === requestId
  );
  if (previous?.status === "sent") {
    return json({ ok: true, alreadySent: true, reservation: existing, email: previous });
  }
  const lastSentAt = Date.parse(existing.lastPaymentRequestEmail?.sentAt || "");
  if (
    existing.lastPaymentRequestEmail?.status === "sent" &&
    Number.isFinite(lastSentAt) &&
    Date.now() - lastSentAt < CONFIRMATION_COOLDOWN_SECONDS * 1000
  ) {
    return json(
      { error: "A payment request was sent recently. Wait five minutes before sending another." },
      409
    );
  }

  let prepared;
  try {
    prepared = updateFields(existing, {
      ...input,
      status: existing.status,
      paymentStatus: existing.paymentStatus || "not-requested",
    });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
  if (!prepared.quotedPrice) return json({ error: "Enter a quoted price before sending a payment request." }, 400);
  if (!prepared.paymentLink) return json({ error: "Add a valid https:// payment link before sending." }, 400);

  const startedAt = new Date().toISOString();
  let pending = appendNotification(prepared, {
    type: "payment-request-email",
    requestId,
    status: "sending",
    amount: prepared.quotedPrice,
    createdAt: startedAt,
  }, "lastPaymentRequestEmail");
  await saveReservation(env, pending);

  try {
    const result = await sendCustomerPaymentRequest(env, pending);
    const sentAt = new Date().toISOString();
    const sentEntry = {
      type: "payment-request-email",
      requestId,
      status: "sent",
      amount: pending.quotedPrice,
      createdAt: startedAt,
      sentAt,
      messageId: result.messageId,
    };
    const log = (pending.notificationLog || []).filter(
      (entry) => !(entry.type === "payment-request-email" && entry.requestId === requestId)
    );
    pending = {
      ...pending,
      paymentStatus: "payment-link-sent",
      notificationLog: [...log, sentEntry].slice(-NOTIFICATION_LOG_LIMIT),
      lastPaymentRequestEmail: sentEntry,
      paymentRequestEmailSentAt: sentAt,
      updatedAt: sentAt,
    };
    await saveReservation(env, pending);
    return json({ ok: true, reservation: pending, email: sentEntry });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failedEntry = {
      type: "payment-request-email",
      requestId,
      status: "failed",
      amount: pending.quotedPrice,
      createdAt: startedAt,
      failedAt,
      error: cleanLimit(error.message, 500),
    };
    const log = (pending.notificationLog || []).filter(
      (entry) => !(entry.type === "payment-request-email" && entry.requestId === requestId)
    );
    pending = {
      ...pending,
      notificationLog: [...log, failedEntry].slice(-NOTIFICATION_LOG_LIMIT),
      lastPaymentRequestEmail: failedEntry,
      updatedAt: failedAt,
    };
    await saveReservation(env, pending);
    return json({ error: failedEntry.error, reservation: pending }, 502);
  }
}

async function handleAdminReservations(request, env) {
  if (request.method === "GET") return listReservations(request, env);
  if (request.method === "PATCH") return updateReservation(request, env);
  return json({ error: "Use GET to list reservations or PATCH to update one." }, 405);
}

async function handleTrack(request, env) {
  if (request.method !== "POST") return json({ error: "Use POST for analytics events." }, 405);

  let input = {};
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const event = clean(input.event).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!event) return new Response(null, { status: 204 });

  if (env.RESERVATIONS) {
    const record = {
      event,
      page: clean(input.page).slice(0, 160),
      label: clean(input.label).slice(0, 160),
      href: clean(input.href).slice(0, 160),
      rideType: clean(input.rideType).slice(0, 80),
      leadSource: clean(input.leadSource).slice(0, 80),
      campaign: getCampaign(input.campaign, request),
      createdAt: new Date().toISOString(),
      userAgent: clean(request.headers.get("user-agent")).slice(0, 180),
    };

    await env.RESERVATIONS.put(`analytics:${Date.now()}:${crypto.randomUUID()}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 90,
    });
  }

  return new Response(null, { status: 204 });
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

  return json({ ok: true, reservation: publicReservation(reservation), storageConnected: true });
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

  if (clean(formData.get("website"))) return silentlyBlockSubmission(env, "honeypot");
  if (wasSubmittedTooQuickly(formData)) return silentlyBlockSubmission(env, "timing");
  if (looksLikeSolicitation(formData)) return silentlyBlockSubmission(env, "solicitation");
  if (isImplausibleRoute(formData)) return silentlyBlockSubmission(env, "same-route");
  if (await exceedsSubmissionRate(request, env)) return silentlyBlockSubmission(env, "rate-limit");

  const missing = REQUIRED_FIELDS.filter((field) => !clean(formData.get(field)));
  if (missing.length > 0) return json({ error: "Please complete all required fields." }, 400);

  const submittedEmail = clean(formData.get("email"));
  if (!isValidEmail(submittedEmail)) return json({ error: "Please enter a valid email address." }, 400);

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

    if (pathname === "/api/reservation-status") {
      if (!diagnosticsEnabled(env)) {
        return json({ ok: true, status: "reservation endpoint available" });
      }

      return json(getReservationStatus(env));
    }

    if (pathname === "/api/reservation") {
      return handleReservation(request, env);
    }

    if (pathname === "/api/admin/reservations") {
      return handleAdminReservations(request, env);
    }

    if (pathname === "/api/admin/reservations/confirmation") {
      if (request.method !== "POST") return json({ error: "Use POST to send a confirmation email." }, 405);
      return confirmAndEmailReservation(request, env);
    }

    if (pathname === "/api/admin/reservations/payment-request") {
      if (request.method !== "POST") return json({ error: "Use POST to send a payment request." }, 405);
      return emailPaymentRequest(request, env);
    }

    if (pathname === "/api/admin/reservations/square-link") {
      if (request.method !== "POST") return json({ error: "Use POST to create a Square payment link." }, 405);
      return createSquarePaymentLink(request, env);
    }

    if (pathname === "/api/track") {
      return handleTrack(request, env);
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
