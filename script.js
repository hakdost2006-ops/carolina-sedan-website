const serviceContent = {
  airport: {
    tag: "Airport Transfers",
    title: "Make catching a flight feel boring again.",
    copy:
      "Schedule direct service between Chapel Hill, Carrboro, Durham, Raleigh, and RDU with planned pickup times and room for luggage.",
  },
  medical: {
    tag: "Medical & Senior Rides",
    title: "Give families a dependable appointment ride.",
    copy:
      "Reserved pickup windows, patient drivers, clean cars, and direct communication help families plan appointments with less stress.",
  },
  campus: {
    tag: "University Travel",
    title: "Reliable rides for UNC and Duke visitors.",
    copy:
      "Parents, speakers, faculty, hotel guests, and campus visitors can schedule professional transportation for airport and local trips.",
  },
  corporate: {
    tag: "Corporate & Event Service",
    title: "Professional ground transportation for busy days.",
    copy:
      "Executive rides, dinners, meetings, conferences, and hourly service are handled with clear communication and professional drivers.",
  },
};

const routeContent = {
  "Chapel Hill to RDU":
    "Reserve a Chapel Hill to RDU ride ahead of time for early flights, luggage, and a pickup window planned around your departure.",
  "Carrboro to RDU":
    "Carrboro airport passengers can schedule pickup in advance instead of waiting to see whether a ride app driver is nearby.",
  "UNC to RDU":
    "UNC parents, students, faculty, guest speakers, and departments can book professional transportation between campus and the airport.",
  "Duke to Chapel Hill":
    "Travel between Durham and Chapel Hill with a scheduled driver for medical visits, university travel, meetings, and events.",
};

const reliableRouteImage =
  "/assets/chauffeur-hero.jpg";

const serviceCards = document.querySelectorAll(".service-card");
const serviceDetail = document.querySelector("#service-detail");

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    serviceCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    const selected = serviceContent[card.dataset.service];
    if (serviceDetail && selected) {
      serviceDetail.innerHTML = `
        <p class="tag">${selected.tag}</p>
        <h3>${selected.title}</h3>
        <p>${selected.copy}</p>
      `;
    }
  });
});

const routeTabs = document.querySelectorAll(".route-tab");
const routeTitle = document.querySelector("#route-title");
const routeCopy = document.querySelector("#route-copy");

routeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    routeTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    if (routeTitle) routeTitle.textContent = tab.dataset.route;
    if (routeCopy) routeCopy.textContent = routeContent[tab.dataset.route];
  });
});

const estimateForm = document.querySelector("#estimate-form");
const pickup = document.querySelector("#pickup");
const rideType = document.querySelector("#ride-type");
const passengers = document.querySelector("#passengers");
const early = document.querySelector("#early");
const output = document.querySelector("#estimate-output");

const baseRates = {
  "chapel-hill": { rdu: 75, local: 45, hourly: 95 },
  carrboro: { rdu: 90, local: 45, hourly: 95 },
  durham: { rdu: 80, local: 50, hourly: 100 },
  raleigh: { rdu: 70, local: 55, hourly: 105 },
};

function updateEstimate() {
  if (!pickup || !rideType || !passengers || !early || !output) return;
  const area = pickup.value;
  const type = rideType.value;
  const passengerCount = Number(passengers.value || 1);
  let estimate = baseRates[area][type];

  if (passengerCount > 3) estimate += 15;
  if (early.checked) estimate += 20;

  const label = type === "hourly" ? "starting hourly estimate" : "starting estimate";
  output.textContent = `$${estimate} ${label}`;
}

estimateForm?.addEventListener("input", updateEstimate);
updateEstimate();

const reservationEmail = "booking@carolinasedan.com";
const reservationSms = "+19199240568";
const reservationForm = document.querySelector("#reservation-form");
const reservationStatus = document.querySelector("#reservation-status");

function trackEvent(name, details = {}) {
  const payload = {
    event: name,
    page: window.location.pathname,
    ...details,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", name, details);
  }

  if (window.zaraz?.track) {
    window.zaraz.track(name, details);
  }

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function addTrackingHooks() {
  document.querySelectorAll('a[href="#book"], a[href="/#book"], .button.primary').forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("booking_cta_click", {
        label: link.textContent.trim(),
        href: link.getAttribute("href") || "",
      });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("phone_click", {
        label: link.textContent.trim(),
        href: link.getAttribute("href") || "",
      });
    });
  });

  document.querySelector("#estimate-form .button.primary")?.addEventListener("click", () => {
    trackEvent("estimate_to_booking_click", {
      estimate: output?.textContent || "",
      pickup: pickup?.value || "",
      rideType: rideType?.value || "",
    });
  });
}

const newsLinks = [
  "unc-health-championship-raleigh-ride-tips-2026.html",
  "durham-duke-street-closure-detours-2026.html",
  "rdu-parking-time-tips-may-2026.html",
  "news.html#chapel-hill-attractions",
  "news.html#airport-chauffeur",
  "news.html#chapel-hill-culture",
  "news.html#special-events",
  "news.html#restaurants",
  "news.html#hidden-gems",
  "news.html#walking-trails",
  "news.html#hotels",
  "news.html#ride-hailing",
  "news.html#black-car-service",
  "news.html#cabby-with-compassion",
];

function addLiveStyles() {
  if (document.querySelector("#carolina-live-styles")) return;
  const style = document.createElement("style");
  style.id = "carolina-live-styles";
  style.textContent = `
    .faq{padding-top:clamp(70px,9vw,116px)}
    .faq-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:28px}
    .faq-grid article{padding:24px;border:1px solid var(--line);border-radius:8px;background:var(--white)}
    .faq-grid p{color:var(--muted)}
    .news-lead{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(28px,6vw,70px);align-items:center}
    .news-photo{margin:0;overflow:hidden;border-radius:8px;box-shadow:0 18px 52px rgba(0,0,0,.28)}
    .news-photo img{display:block;width:100%;aspect-ratio:1.55/1;object-fit:cover}
    .news-lead+.news-grid{margin-top:44px}
    .footer-links{display:flex;flex-wrap:wrap;gap:16px}
    .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .form-grid .wide{grid-column:1/-1}
    .reservation-summary{display:grid;gap:8px;padding:16px;border:1px solid rgba(47,107,70,.25);border-radius:8px;color:var(--forest);background:var(--soft)}
    .reservation-summary strong,.reservation-summary span,.reservation-summary a,.reservation-summary small{display:block}
    .reservation-summary span{font-size:1.2rem;font-weight:900}
    .reservation-summary a{color:var(--brick);font-weight:900;text-decoration:underline}
    @media(max-width:860px){.faq-grid,.news-lead,.form-grid{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

function upgradeReservationForm() {
  if (!reservationForm || reservationForm.dataset.engine === "stage-one") return;
  reservationForm.dataset.engine = "stage-one";
  reservationForm.classList.add("reservation-engine-form");
  reservationForm.setAttribute("action", "/api/reservation");
  reservationForm.setAttribute("method", "post");
  reservationForm.innerHTML = `
    <input class="hidden-field" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
    <div class="form-grid">
      <label>Name<input type="text" name="name" autocomplete="name" placeholder="Your name" required /></label>
      <label>Phone<input type="tel" name="phone" autocomplete="tel" placeholder="Best phone number" required /></label>
      <label>Email<input type="email" name="email" autocomplete="email" placeholder="Email for confirmation" /></label>
      <label>Ride type<select name="ride-type" required><option value="RDU airport transfer">RDU airport transfer</option><option value="Local point-to-point">Local point-to-point</option><option value="Medical appointment">Medical appointment</option><option value="UNC or Duke travel">UNC or Duke travel</option><option value="Corporate or event">Corporate or event</option><option value="Hourly service">Hourly service</option></select></label>
      <label>Pickup date and time<input type="datetime-local" name="pickup-time" required /></label>
      <label>Passengers<input type="number" name="passengers" min="1" max="14" value="1" required /></label>
      <label class="wide">Pickup address<input type="text" name="pickup-address" autocomplete="street-address" placeholder="Street, hotel, campus building, airport terminal" required /></label>
      <label class="wide">Destination<input type="text" name="destination-address" placeholder="Where are you going?" required /></label>
      <label>Luggage<input type="text" name="luggage" placeholder="Example: 2 checked bags" /></label>
      <label>Flight number<input type="text" name="flight-number" placeholder="Optional" /></label>
      <label class="wide">How did you hear about us?<select name="lead-source" required><option value="">Select one</option><option value="Google Search">Google Search</option><option value="Google Maps / Google Business Profile">Google Maps / Google Business Profile</option><option value="UNC or Duke department">UNC or Duke department</option><option value="Hotel or concierge">Hotel or concierge</option><option value="Friend or repeat customer">Friend or repeat customer</option><option value="Facebook">Facebook</option><option value="X / Twitter">X / Twitter</option><option value="Other">Other</option></select></label>
      <input type="hidden" name="campaign" value="" />
    </div>
    <label>Notes<textarea name="details" rows="5" placeholder="Car seat, extra stops, exact entrance, accessibility needs, or anything else we should know"></textarea></label>
    <div class="reservation-summary" id="reservation-summary" hidden></div>
    <button class="button primary full" type="submit">Request reservation</button>
    <p class="form-note" id="reservation-status">Requests are sent to booking@carolinasedan.com. This is a reservation request, not an instant confirmation. Carolina Sedan will confirm availability, final price, and payment details.</p>
  `;
  const campaign = new URLSearchParams(window.location.search).get("campaign");
  const campaignField = reservationForm.elements.namedItem("campaign");
  if (campaign && campaignField) campaignField.setAttribute("value", campaign.slice(0, 100));
}

function polishLiveContent() {
  addLiveStyles();
  document
    .querySelectorAll('img[src="assets/airport-service.png"], img[src$="/assets/airport-service.png"]')
    .forEach((image) => {
      image.src = reliableRouteImage;
    });

  const heroButton = document.querySelector(".hero .button.primary");
  if (heroButton) heroButton.textContent = "Book RDU Airport Ride";

  const routeEyebrow = document.querySelector(".local-routes .eyebrow");
  if (routeEyebrow) routeEyebrow.textContent = "Popular Routes";

  const routeHeading = document.querySelector("#routes-title");
  if (routeHeading) routeHeading.textContent = "Reserve reliable transportation on the routes local travelers use most.";

  const newsHeading = document.querySelector("#news-title");
  if (newsHeading) newsHeading.textContent = "Helpful Chapel Hill travel articles for planning local rides.";

  const newsSection = document.querySelector("#news");
  const newsSectionHeading = newsSection?.querySelector(".section-heading");
  const newsGrid = newsSection?.querySelector(".news-grid");

  if (newsSection && newsSectionHeading && newsGrid && !newsSection.querySelector(".news-lead")) {
    const lead = document.createElement("div");
    lead.className = "news-lead";
    newsSection.insertBefore(lead, newsGrid);
    lead.append(newsSectionHeading);

    const figure = document.createElement("figure");
    figure.className = "news-photo";
    figure.innerHTML = `<img src="${reliableRouteImage}" alt="Carolina Sedan scheduled airport and local transportation" />`;
    lead.append(figure);
  }

  const homepageNews = document.querySelector("#news");
  homepageNews?.querySelectorAll(".news-card a").forEach((link, index) => {
    if (newsLinks[index]) link.href = newsLinks[index];
  });

  document.querySelectorAll(".site-footer").forEach((footer) => {
    let links = footer.querySelector(".footer-links");
    const phone = footer.querySelector("a[href^='tel:']");
    if (!links) {
      links = document.createElement("div");
      links.className = "footer-links";
      if (phone) links.append(phone);
      footer.append(links);
    }
    if (!links.querySelector("a[href*='share.google/Iwb4OepB3fCjH3ejG']")) {
      const google = document.createElement("a");
      google.href = "https://share.google/Iwb4OepB3fCjH3ejG";
      google.target = "_blank";
      google.rel = "noopener";
      google.textContent = "Google";
      links.prepend(google);
    }
    if (!links.querySelector("a[href*='facebook.com']")) {
      const facebook = document.createElement("a");
      facebook.href = "https://www.facebook.com/share/17hQheN4bK/?mibextid=wwXIfr";
      facebook.target = "_blank";
      facebook.rel = "noopener";
      facebook.textContent = "Facebook";
      links.append(facebook);
    }
    if (!links.querySelector("a[href*='x.com/carolinasedan36']")) {
      const x = document.createElement("a");
      x.href = "https://x.com/carolinasedan36?s=21&t=4jFG8iXkR-U6dBxISFHjPA";
      x.target = "_blank";
      x.rel = "noopener";
      x.textContent = "X";
      links.append(x);
    }
  });

  upgradeReservationForm();
}

polishLiveContent();
addTrackingHooks();

function formatPickupTime(value) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFormValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function buildReservationMessage(formData) {
  return [
    "New Carolina Sedan reservation request",
    "",
    `Name: ${getFormValue(formData, "name")}`,
    `Phone: ${getFormValue(formData, "phone") || getFormValue(formData, "contact")}`,
    `Email: ${getFormValue(formData, "email") || "Not provided"}`,
    `Ride type: ${getFormValue(formData, "ride-type")}`,
    `Pickup date/time: ${formatPickupTime(getFormValue(formData, "pickup-time"))}`,
    `Pickup: ${getFormValue(formData, "pickup-address")}`,
    `Destination: ${getFormValue(formData, "destination-address")}`,
    `Passengers: ${getFormValue(formData, "passengers")}`,
    `Luggage: ${getFormValue(formData, "luggage") || "Not provided"}`,
    `Flight: ${getFormValue(formData, "flight-number") || "Not provided"}`,
    `Lead source: ${getFormValue(formData, "lead-source") || "Not provided"}`,
    `Campaign: ${getFormValue(formData, "campaign") || "Direct / not tagged"}`,
    "",
    "Notes:",
    getFormValue(formData, "details") || "None",
  ].join("\n");
}

function showReservationSuccess(result, form) {
  const currentStatus = document.querySelector("#reservation-status");
  const summary = document.querySelector("#reservation-summary");
  const reservationId = result.reservationId || result.id;
  const statusUrl = result.statusUrl || (reservationId ? `/reservation?id=${encodeURIComponent(reservationId)}` : "");

  if (currentStatus) {
    currentStatus.textContent = reservationId
      ? `Thank you. Reservation request ${reservationId} was sent to Carolina Sedan. We will follow up to confirm final price and driver availability.`
      : "Thank you. Your request was sent to Carolina Sedan. We will follow up to confirm your ride.";
  }

  if (summary && reservationId) {
    summary.hidden = false;
    summary.innerHTML = `
      <strong>Reservation request received</strong>
      <span>${reservationId}</span>
      ${statusUrl ? `<a href="${statusUrl}">View reservation status</a>` : "<small>Status tracking will be available after storage is connected.</small>"}
    `;
  }

  trackEvent("reservation_submit_success", {
    reservationId,
    rideType: getFormValue(new FormData(form), "ride-type"),
  });
  form.reset();
}

reservationForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const message = buildReservationMessage(formData);
  const emailUrl = `mailto:${reservationEmail}?subject=${encodeURIComponent(
    "New Carolina Sedan reservation request"
  )}&body=${encodeURIComponent(message)}`;
  const smsUrl = `sms:${reservationSms}?&body=${encodeURIComponent(message)}`;
  const submit = form.querySelector('button[type="submit"]');
  const currentStatus = document.querySelector("#reservation-status");
  const summary = document.querySelector("#reservation-summary");

  if (submit) submit.disabled = true;
  if (currentStatus) currentStatus.textContent = "Sending your reservation request...";
  trackEvent("reservation_submit_attempt", {
    rideType: getFormValue(formData, "ride-type"),
    leadSource: getFormValue(formData, "lead-source"),
    campaign: getFormValue(formData, "campaign"),
  });
  if (summary) {
    summary.hidden = true;
    summary.textContent = "";
  }

  fetch("/api/reservation", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverDetails = [result.error, result.email?.error, result.email?.reason, result.sms?.error, result.sms?.reason]
          .filter(Boolean)
          .join(" ");
        throw new Error(serverDetails || "Unable to send reservation request.");
      }
      showReservationSuccess(result, form);
    })
    .catch((error) => {
      trackEvent("reservation_submit_error", {
        message: error.message,
        rideType: getFormValue(formData, "ride-type"),
      });
      const status = document.querySelector("#reservation-status");
      if (status) {
        status.innerHTML = `
          Online sending is not connected yet. Reason: ${error.message}. Please
          <a href="${emailUrl}">email this request to booking@carolinasedan.com</a>,
          <a href="${smsUrl}">text it to 919-924-0568</a>,
          or call <a href="tel:+19199240568">919-924-0568</a>.
        `;
      }
      console.warn("Reservation submission failed", error);
    })
    .finally(() => {
      if (submit) submit.disabled = false;
    });
});
