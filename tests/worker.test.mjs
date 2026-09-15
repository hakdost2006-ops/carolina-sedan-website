import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerSource = await readFile(new URL("../worker.js", import.meta.url), "utf8");
const workerModule = await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString("base64")}`);
const worker = workerModule.default;

class MemoryKV {
  constructor() {
    this.values = new Map();
  }

  async get(key, type) {
    if (!this.values.has(key)) return null;
    const value = this.values.get(key);
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.values.set(key, String(value));
  }

  async list({ prefix = "" } = {}) {
    return {
      keys: [...this.values.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
    };
  }
}

function reservationForm(overrides = {}) {
  const values = {
    name: "Test Customer",
    phone: "919-555-0100",
    email: "customer@example.com",
    "ride-type": "RDU airport transfer",
    "pickup-time": "2026-10-01T10:00",
    "pickup-address": "RDU Airport, Morrisville, NC",
    "destination-address": "Franklin Street, Chapel Hill, NC",
    passengers: "2",
    luggage: "2 bags",
    "flight-number": "AA100",
    "lead-source": "Google Search",
    details: "Please monitor the flight.",
    "form-started-at": String(Date.now() - 5000),
    website: "",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function postForm(form, headers = {}) {
  return new Request("https://www.carolinasedan.com/api/reservation", {
    method: "POST",
    headers,
    body: form,
  });
}

function adminRequest(body, token = "owner-secret") {
  return new Request("https://www.carolinasedan.com/api/admin/reservations/confirmation", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function paymentRequest(body, token = "owner-secret") {
  return new Request("https://www.carolinasedan.com/api/admin/reservations/payment-request", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function squareLinkRequest(body, token = "owner-secret") {
  return new Request("https://www.carolinasedan.com/api/admin/reservations/square-link", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function sampleReservation(overrides = {}) {
  return {
    id: "CSS-20260910-ABC123",
    status: "pending-confirmation",
    paymentStatus: "not-requested",
    createdAt: "2026-09-10T12:00:00.000Z",
    trackingUrl: "https://www.carolinasedan.com/reservation?id=CSS-20260910-ABC123",
    name: "Test Customer",
    phone: "919-555-0100",
    email: "customer@example.com",
    rideType: "RDU airport transfer",
    pickupTime: "2026-10-01T10:00",
    pickupTimeLabel: "Oct 1, 2026, 10:00 AM",
    pickupAddress: "RDU Airport, Morrisville, NC",
    destinationAddress: "Franklin Street, Chapel Hill, NC",
    passengers: "2",
    luggage: "2 bags",
    flightNumber: "AA100",
    leadSource: "Google Search",
    campaign: "Direct / not tagged",
    details: "Please monitor the flight.",
    ...overrides,
  };
}

test("solicitation disguised as a reservation is silently blocked", async () => {
  const kv = new MemoryKV();
  let emailCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    emailCalls += 1;
    return Response.json({ id: "unexpected" });
  };

  try {
    const form = reservationForm({
      "pickup-address": "100 Main Street, Irvine, CA",
      "destination-address": "100 Main Street, Irvine, CA",
      details: "We built an AI agent for your business. Schedule a demo and get a full refund if it does not generate leads. Unsubscribe here.",
    });
    const response = await worker.fetch(postForm(form), { RESERVATIONS: kv, RESEND_API_KEY: "test-key" });
    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.accepted, true);
    assert.equal(emailCalls, 0);
    assert.equal([...kv.values.keys()].some((key) => key.startsWith("reservation:")), false);
    assert.equal([...kv.values.keys()].some((key) => key.startsWith("security:blocked:")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an unrealistically fast browser submission is silently blocked", async () => {
  const kv = new MemoryKV();
  let emailCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    emailCalls += 1;
    return Response.json({ id: "unexpected" });
  };

  try {
    const response = await worker.fetch(
      postForm(reservationForm({ "form-started-at": String(Date.now()) })),
      { RESERVATIONS: kv, RESEND_API_KEY: "test-key" }
    );
    assert.equal(response.status, 202);
    assert.equal(emailCalls, 0);
    assert.equal([...kv.values.keys()].some((key) => key.startsWith("reservation:")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a real reservation is stored and emailed to the owner", async () => {
  const kv = new MemoryKV();
  const outbound = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    outbound.push(JSON.parse(options.body));
    return Response.json({ id: "owner-email-1" });
  };

  try {
    const response = await worker.fetch(postForm(reservationForm()), {
      RESERVATIONS: kv,
      RESEND_API_KEY: "test-key",
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.match(body.reservationId, /^CSS-\d{8}-[A-F0-9]{6}$/);
    assert.equal(outbound.length, 1);
    assert.deepEqual(outbound[0].to, ["booking@carolinasedan.com"]);
    assert.equal([...kv.values.keys()].some((key) => key.startsWith("reservation:")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the sixth submission from one address in 15 minutes is blocked", async () => {
  const kv = new MemoryKV();
  let emailCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    emailCalls += 1;
    return Response.json({ id: `owner-email-${emailCalls}` });
  };

  try {
    let lastResponse;
    for (let index = 0; index < 6; index += 1) {
      lastResponse = await worker.fetch(
        postForm(reservationForm({ "pickup-address": `${index + 1} Airport Road, Morrisville, NC` }), {
          "cf-connecting-ip": "203.0.113.10",
        }),
        { RESERVATIONS: kv, RESEND_API_KEY: "test-key" }
      );
    }
    assert.equal(lastResponse.status, 202);
    assert.equal(emailCalls, 5);
    assert.equal([...kv.values.keys()].filter((key) => key.startsWith("reservation:")).length, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmation endpoint requires owner authentication", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const response = await worker.fetch(adminRequest({ id: "CSS-20260910-ABC123" }, "wrong-token"), {
    RESERVATIONS: kv,
    ADMIN_TOKEN: "owner-secret",
  });
  assert.equal(response.status, 401);
});

test("owner can confirm once without exposing a staged payment link", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const outbound = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    outbound.push(JSON.parse(options.body));
    return Response.json({ id: "customer-email-1" });
  };
  const payload = {
    id: "CSS-20260910-ABC123",
    quotedPrice: "95",
    paymentStatus: "not-requested",
    paymentLink: "https://pay.example.com/reservation/ABC123",
    driverName: "Assigned Chauffeur",
    customerMessage: "Meet your chauffeur at the agreed pickup point.",
    adminNotes: "Private note",
    notificationRequestId: "notification-1",
  };
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };

  try {
    const firstResponse = await worker.fetch(adminRequest(payload), env);
    const firstBody = await firstResponse.json();
    assert.equal(firstResponse.status, 200);
    assert.equal(firstBody.reservation.status, "confirmed");
    assert.equal(firstBody.reservation.paymentStatus, "not-requested");
    assert.equal(firstBody.email.status, "sent");
    assert.equal(outbound.length, 1);
    assert.deepEqual(outbound[0].to, ["customer@example.com"]);
    assert.match(outbound[0].subject, /CSS-20260910-ABC123/);
    assert.match(outbound[0].text, /Confirmed price: \$95/);
    assert.doesNotMatch(outbound[0].text, /https:\/\/pay\.example\.com\/reservation\/ABC123/);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.lastConfirmationEmail.status, "sent");
    assert.equal(stored.lastConfirmationEmail.messageId, "customer-email-1");
    assert.ok(stored.confirmationEmailSentAt);

    const replayResponse = await worker.fetch(adminRequest(payload), env);
    const replayBody = await replayResponse.json();
    assert.equal(replayBody.alreadySent, true);
    assert.equal(outbound.length, 1);

    const differentRequest = await worker.fetch(
      adminRequest({ ...payload, notificationRequestId: "notification-2" }),
      env
    );
    assert.equal(differentRequest.status, 409);
    assert.match((await differentRequest.json()).error, /sent recently/i);
    assert.equal(outbound.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("payment request endpoint requires owner authentication", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed" }))
  );
  const response = await worker.fetch(
    paymentRequest({ id: "CSS-20260910-ABC123" }, "wrong-token"),
    { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret" }
  );
  assert.equal(response.status, 401);
});

test("Square payment-link endpoint requires owner authentication", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed", quotedPrice: "95" }))
  );
  const response = await worker.fetch(
    squareLinkRequest({ id: "CSS-20260910-ABC123", squareRequestId: "square-1" }, "wrong-token"),
    { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret" }
  );
  assert.equal(response.status, 401);
});

test("Square link requires a confirmed reservation, quote, and server configuration", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const baseEnv = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret" };

  const pending = await worker.fetch(
    squareLinkRequest({ id: "CSS-20260910-ABC123", quotedPrice: "95", squareRequestId: "square-1" }),
    baseEnv
  );
  assert.equal(pending.status, 409);
  assert.match((await pending.json()).error, /confirm the reservation/i);

  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed" }))
  );
  const missingQuote = await worker.fetch(
    squareLinkRequest({ id: "CSS-20260910-ABC123", squareRequestId: "square-2" }),
    baseEnv
  );
  assert.equal(missingQuote.status, 400);
  assert.match((await missingQuote.json()).error, /quoted price/i);

  const missingConfig = await worker.fetch(
    squareLinkRequest({ id: "CSS-20260910-ABC123", quotedPrice: "95", squareRequestId: "square-3" }),
    baseEnv
  );
  assert.equal(missingConfig.status, 503);
  assert.match((await missingConfig.json()).error, /Square is not configured/i);
});

test("owner can create one private Square payment link for the exact quote", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed", quotedPrice: "95.50" }))
  );
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({
      payment_link: {
        id: "PLINK123",
        order_id: "ORDER123",
        url: "https://square.link/u/example",
      },
    });
  };
  const env = {
    RESERVATIONS: kv,
    ADMIN_TOKEN: "owner-secret",
    SQUARE_ACCESS_TOKEN: "square-secret",
    SQUARE_LOCATION_ID: "LOCATION123",
    SQUARE_ENVIRONMENT: "production",
  };
  const payload = {
    id: "CSS-20260910-ABC123",
    quotedPrice: "95.50",
    squareRequestId: "square-request-1",
  };

  try {
    const response = await worker.fetch(squareLinkRequest(payload), env);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.reservation.paymentLink, "https://square.link/u/example");
    assert.equal(body.reservation.paymentStatus, "not-requested");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://connect.squareup.com/v2/online-checkout/payment-links");
    assert.equal(calls[0].options.headers.authorization, "Bearer square-secret");
    assert.equal(calls[0].options.headers["square-version"], "2026-08-19");
    assert.equal(calls[0].body.quick_pay.price_money.amount, 9550);
    assert.equal(calls[0].body.quick_pay.price_money.currency, "USD");
    assert.equal(calls[0].body.quick_pay.location_id, "LOCATION123");
    assert.match(calls[0].body.quick_pay.name, /CSS-20260910-ABC123/);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.paymentProvider, "square");
    assert.equal(stored.squarePaymentLinkId, "PLINK123");
    assert.equal(stored.squareOrderId, "ORDER123");
    assert.equal(stored.notificationLog.at(-1).type, "square-payment-link");

    const publicResponse = await worker.fetch(
      new Request("https://www.carolinasedan.com/api/reservation?id=CSS-20260910-ABC123"),
      env
    );
    assert.equal((await publicResponse.json()).reservation.paymentLink, "");

    const replayResponse = await worker.fetch(squareLinkRequest(payload), env);
    assert.equal((await replayResponse.json()).alreadyCreated, true);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Square API failure does not save a payment link or expose credentials", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed", quotedPrice: "95" }))
  );
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { errors: [{ code: "UNAUTHORIZED", detail: "Access token is invalid." }] },
    { status: 401 }
  );
  const env = {
    RESERVATIONS: kv,
    ADMIN_TOKEN: "owner-secret",
    SQUARE_ACCESS_TOKEN: "never-show-this-token",
    SQUARE_LOCATION_ID: "LOCATION123",
    SQUARE_ENVIRONMENT: "sandbox",
  };

  try {
    const response = await worker.fetch(
      squareLinkRequest({ id: "CSS-20260910-ABC123", quotedPrice: "95", squareRequestId: "square-fail-1" }),
      env
    );
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.match(body.error, /Square could not create/i);
    assert.doesNotMatch(body.error, /never-show-this-token/);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.paymentLink, undefined);
    assert.equal(stored.squareOrderId, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Square link cannot replace a link that was already sent or a paid reservation", async () => {
  const kv = new MemoryKV();
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret" };
  for (const paymentStatus of ["payment-link-sent", "paid"]) {
    await kv.put(
      "reservation:CSS-20260910-ABC123",
      JSON.stringify(sampleReservation({ status: "confirmed", quotedPrice: "95", paymentStatus }))
    );
    const response = await worker.fetch(
      squareLinkRequest({ id: "CSS-20260910-ABC123", quotedPrice: "95", squareRequestId: `square-${paymentStatus}` }),
      env
    );
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, new RegExp(paymentStatus));
  }
});

test("payment request cannot be sent before the ride is confirmed", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const response = await worker.fetch(
    paymentRequest({
      id: "CSS-20260910-ABC123",
      quotedPrice: "95",
      paymentLink: "https://pay.example.com/reservation/ABC123",
      notificationRequestId: "payment-notification-1",
    }),
    { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" }
  );
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /confirm the reservation/i);
});

test("owner can send one payment request and expose the link on customer status", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({
      status: "confirmed",
      confirmedAt: "2026-09-12T12:00:00.000Z",
      quotedPrice: "95",
      paymentLink: "https://pay.example.com/reservation/ABC123",
    }))
  );
  const outbound = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    outbound.push(JSON.parse(options.body));
    return Response.json({ id: "payment-email-1" });
  };
  const payload = {
    id: "CSS-20260910-ABC123",
    quotedPrice: "95",
    paymentLink: "https://pay.example.com/reservation/ABC123",
    customerMessage: "Thank you for choosing Carolina Sedan.",
    adminNotes: "Payment request approved.",
    notificationRequestId: "payment-notification-1",
  };
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };

  try {
    const beforeResponse = await worker.fetch(
      new Request("https://www.carolinasedan.com/api/reservation?id=CSS-20260910-ABC123"),
      env
    );
    assert.equal((await beforeResponse.json()).reservation.paymentLink, "");

    const firstResponse = await worker.fetch(paymentRequest(payload), env);
    const firstBody = await firstResponse.json();
    assert.equal(firstResponse.status, 200);
    assert.equal(firstBody.reservation.paymentStatus, "payment-link-sent");
    assert.equal(firstBody.email.status, "sent");
    assert.equal(outbound.length, 1);
    assert.deepEqual(outbound[0].to, ["customer@example.com"]);
    assert.match(outbound[0].subject, /Payment request.*CSS-20260910-ABC123/);
    assert.match(outbound[0].text, /Amount due: \$95/);
    assert.match(outbound[0].text, /https:\/\/pay\.example\.com\/reservation\/ABC123/);
    assert.match(outbound[0].text, /not marked paid until Carolina Sedan verifies/i);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.lastPaymentRequestEmail.status, "sent");
    assert.equal(stored.lastPaymentRequestEmail.messageId, "payment-email-1");
    assert.equal(stored.notificationLog.at(-1).type, "payment-request-email");
    assert.ok(stored.paymentRequestEmailSentAt);

    const afterResponse = await worker.fetch(
      new Request("https://www.carolinasedan.com/api/reservation?id=CSS-20260910-ABC123"),
      env
    );
    assert.equal(
      (await afterResponse.json()).reservation.paymentLink,
      "https://pay.example.com/reservation/ABC123"
    );

    const replayResponse = await worker.fetch(paymentRequest(payload), env);
    assert.equal((await replayResponse.json()).alreadySent, true);
    assert.equal(outbound.length, 1);

    const cooldownResponse = await worker.fetch(
      paymentRequest({ ...payload, notificationRequestId: "payment-notification-2" }),
      env
    );
    assert.equal(cooldownResponse.status, 409);
    assert.match((await cooldownResponse.json()).error, /sent recently/i);
    assert.equal(outbound.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("payment request requires a final quote and an HTTPS payment link", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed" }))
  );
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };

  const missingQuote = await worker.fetch(
    paymentRequest({
      id: "CSS-20260910-ABC123",
      paymentLink: "https://pay.example.com/reservation/ABC123",
      notificationRequestId: "payment-invalid-1",
    }),
    env
  );
  assert.equal(missingQuote.status, 400);
  assert.match((await missingQuote.json()).error, /quoted price/i);

  const unsafeLink = await worker.fetch(
    paymentRequest({
      id: "CSS-20260910-ABC123",
      quotedPrice: "95",
      paymentLink: "http://pay.example.com/reservation/ABC123",
      notificationRequestId: "payment-invalid-2",
    }),
    env
  );
  assert.equal(unsafeLink.status, 400);
  assert.match((await unsafeLink.json()).error, /https/i);
});

test("failed payment request delivery is recorded without marking payment requested", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ status: "confirmed" }))
  );
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { name: "validation_error", message: "Sender is not verified." },
    { status: 403 }
  );
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };

  try {
    const response = await worker.fetch(
      paymentRequest({
        id: "CSS-20260910-ABC123",
        quotedPrice: "95",
        paymentLink: "https://pay.example.com/reservation/ABC123",
        notificationRequestId: "payment-failure-1",
      }),
      env
    );
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /payment request email failed/i);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.paymentStatus, "not-requested");
    assert.equal(stored.lastPaymentRequestEmail.status, "failed");
    assert.match(stored.lastPaymentRequestEmail.error, /sender is not verified/i);
    assert.equal(stored.notificationLog.at(-1).type, "payment-request-email");
    assert.equal(stored.notificationLog.at(-1).status, "failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("confirmation email requires a valid customer email", async () => {
  const kv = new MemoryKV();
  await kv.put(
    "reservation:CSS-20260910-ABC123",
    JSON.stringify(sampleReservation({ email: "" }))
  );
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };
  const response = await worker.fetch(
    adminRequest({ id: "CSS-20260910-ABC123", quotedPrice: "95", notificationRequestId: "notification-2" }),
    env
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid customer email/i);
});

test("confirmation email requires a final quoted price", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };
  const response = await worker.fetch(
    adminRequest({ id: "CSS-20260910-ABC123", notificationRequestId: "notification-3" }),
    env
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /quoted price/i);
});

test("confirmation email rejects a malformed quoted price", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };
  const response = await worker.fetch(
    adminRequest({
      id: "CSS-20260910-ABC123",
      quotedPrice: "95.00.00",
      notificationRequestId: "notification-invalid-price",
    }),
    env
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid positive amount/i);
});

test("failed customer email delivery is recorded for the owner", async () => {
  const kv = new MemoryKV();
  await kv.put("reservation:CSS-20260910-ABC123", JSON.stringify(sampleReservation()));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { name: "validation_error", message: "Sender is not verified." },
    { status: 403 }
  );
  const env = { RESERVATIONS: kv, ADMIN_TOKEN: "owner-secret", RESEND_API_KEY: "test-key" };

  try {
    const response = await worker.fetch(
      adminRequest({
        id: "CSS-20260910-ABC123",
        quotedPrice: "95",
        notificationRequestId: "notification-4",
      }),
      env
    );
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /customer email failed/i);

    const stored = await kv.get("reservation:CSS-20260910-ABC123", "json");
    assert.equal(stored.lastConfirmationEmail.status, "failed");
    assert.match(stored.lastConfirmationEmail.error, /sender is not verified/i);
    assert.equal(stored.notificationLog.at(-1).type, "confirmation-email");
    assert.equal(stored.notificationLog.at(-1).status, "failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
