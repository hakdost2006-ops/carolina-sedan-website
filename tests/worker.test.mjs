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

test("owner can confirm, attach payment, email once, and retain a delivery log", async () => {
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
    assert.equal(firstBody.reservation.paymentStatus, "payment-link-sent");
    assert.equal(firstBody.email.status, "sent");
    assert.equal(outbound.length, 1);
    assert.deepEqual(outbound[0].to, ["customer@example.com"]);
    assert.match(outbound[0].subject, /CSS-20260910-ABC123/);
    assert.match(outbound[0].text, /Confirmed price: \$95/);
    assert.match(outbound[0].text, /https:\/\/pay\.example\.com\/reservation\/ABC123/);

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
