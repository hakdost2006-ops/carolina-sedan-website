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

const serviceCards = document.querySelectorAll(".service-card");
const serviceDetail = document.querySelector("#service-detail");

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    serviceCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    const selected = serviceContent[card.dataset.service];
    serviceDetail.innerHTML = `
      <p class="tag">${selected.tag}</p>
      <h3>${selected.title}</h3>
      <p>${selected.copy}</p>
    `;
  });
});

const routeTabs = document.querySelectorAll(".route-tab");
const routeTitle = document.querySelector("#route-title");
const routeCopy = document.querySelector("#route-copy");

routeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    routeTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    routeTitle.textContent = tab.dataset.route;
    routeCopy.textContent = routeContent[tab.dataset.route];
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
  const area = pickup.value;
  const type = rideType.value;
  const passengerCount = Number(passengers.value || 1);
  let estimate = baseRates[area][type];

  if (passengerCount > 3) {
    estimate += 15;
  }

  if (early.checked) {
    estimate += 20;
  }

  const label = type === "hourly" ? "starting hourly estimate" : "starting estimate";
  output.textContent = `$${estimate} ${label}`;
}

estimateForm.addEventListener("input", updateEstimate);
updateEstimate();

const reservationEmail = "booking@carolinasedan.com";
const reservationSms = "+19199240568";
const reservationForm = document.querySelector("#reservation-form");
const reservationStatus = document.querySelector("#reservation-status");
const reservationSubmit = reservationForm.querySelector('button[type="submit"]');

const newsLinks = [
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

function polishLiveContent() {
  const heroButton = document.querySelector(".hero .button.primary");
  if (heroButton) {
    heroButton.textContent = "Book RDU Airport Ride";
  }

  const routeEyebrow = document.querySelector(".local-routes .eyebrow");
  if (routeEyebrow) {
    routeEyebrow.textContent = "Popular Routes";
  }

  const routeHeading = document.querySelector("#routes-title");
  if (routeHeading) {
    routeHeading.textContent = "Reserve reliable transportation on the routes local travelers use most.";
  }

  const newsHeading = document.querySelector("#news-title");
  if (newsHeading) {
    newsHeading.textContent = "Helpful Chapel Hill travel articles for planning local rides.";
  }

  const quoteEyebrow = document.querySelector(".estimator .eyebrow");
  if (quoteEyebrow) {
    quoteEyebrow.textContent = "Quick Estimate";
  }

  const quoteHeading = document.querySelector("#quote-title");
  if (quoteHeading) {
    quoteHeading.textContent = "Check a starting price before you reserve.";
  }

  const homepageNews = document.querySelector("#news");
  const firstNewsCard = homepageNews?.querySelector(".news-card");
  if (firstNewsCard) {
    const date = firstNewsCard.querySelector("span");
    const title = firstNewsCard.querySelector("h3");
    const copy = firstNewsCard.querySelector("p");

    if (date) {
      date.textContent = "May 24, 2026 | Durham travel alert";
    }

    if (title) {
      title.textContent = "Durham Alert: Duke Street Closure (Trinity Ave-Monmouth Ave)";
    }

    if (copy) {
      copy.textContent =
        "Late-May closure and detours via Washington Street or Buchanan Boulevard may affect downtown, Duke, medical, and RDU trips.";
    }
  }

  homepageNews?.querySelectorAll(".news-card a").forEach((link, index) => {
    if (newsLinks[index]) {
      link.href = newsLinks[index];
    }
  });

  reservationForm?.setAttribute("action", "/api/reservation");
  reservationForm?.setAttribute("method", "post");

  const contactInput = reservationForm?.querySelector('input[name="contact"]');
  if (contactInput) {
    contactInput.placeholder = "Phone number preferred; email optional";
  }

  if (reservationStatus) {
    reservationStatus.textContent =
      "Requests are sent to booking@carolinasedan.com. Phone number is preferred so we can confirm quickly.";
  }

  if (!document.querySelector("#faq")) {
    const booking = document.querySelector("#book");
    const faq = document.createElement("section");
    faq.className = "section faq";
    faq.id = "faq";
    faq.setAttribute("aria-labelledby", "faq-title");
    faq.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">Questions</p>
        <h2 id="faq-title">Good to know before you book.</h2>
      </div>
      <div class="faq-grid">
        <article>
          <h3>How far ahead should I reserve an RDU ride?</h3>
          <p>Book as early as you can, especially for early morning flights, holidays, UNC events, and weekends.</p>
        </article>
        <article>
          <h3>What is the starting rate from Chapel Hill to RDU?</h3>
          <p>Chapel Hill to RDU starts at $75. Final pricing depends on pickup time, passenger count, luggage, and trip details.</p>
        </article>
        <article>
          <h3>Do you offer early morning pickups?</h3>
          <p>Yes. Carolina Sedan takes scheduled airport and local reservations for early morning and late-night trips.</p>
        </article>
        <article>
          <h3>Can I book for medical, hotel, or campus transportation?</h3>
          <p>Yes. We serve medical appointments, hotels, UNC and Duke visitors, business travel, private events, and local rides.</p>
        </article>
      </div>
    `;
    booking?.before(faq);
  }

  document.querySelectorAll(".site-footer").forEach((footer) => {
    let links = footer.querySelector(".footer-links");
    const phone = footer.querySelector("a[href^='tel:']");

    if (!links) {
      links = document.createElement("div");
      links.className = "footer-links";
      if (phone) {
        links.append(phone);
      }
      footer.append(links);
    }

    if (!links.querySelector("a[href*='facebook.com']")) {
      const facebook = document.createElement("a");
      facebook.href = "https://www.facebook.com/share/17hQheN4bK/?mibextid=wwXIfr";
      facebook.target = "_blank";
      facebook.rel = "noopener";
      facebook.textContent = "Facebook";
      links.append(facebook);
    }

    if (!links.querySelector("a[href*='share.google/Iwb4OepB3fCjH3ejG']")) {
      const google = document.createElement("a");
      google.href = "https://share.google/Iwb4OepB3fCjH3ejG";
      google.target = "_blank";
      google.rel = "noopener";
      google.textContent = "Google";
      links.prepend(google);
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

  const style = document.createElement("style");
  style.textContent = `
    .faq{padding-top:clamp(70px,9vw,116px)}
    .faq-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:28px}
    .faq-grid article{padding:24px;border:1px solid var(--line);border-radius:8px;background:var(--white)}
    .faq-grid p{color:var(--muted)}
    .footer-links{display:flex;flex-wrap:wrap;gap:16px}
    @media(max-width:860px){.faq-grid{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

polishLiveContent();

function formatPickupTime(value) {
  if (!value) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildReservationMessage(formData) {
  return [
    "New Carolina Sedan reservation request",
    "",
    `Name: ${formData.get("name")}`,
    `Phone or email: ${formData.get("contact")}`,
    `Pickup date/time: ${formatPickupTime(formData.get("pickup-time"))}`,
    "",
    "Ride details:",
    formData.get("details"),
  ].join("\n");
}

reservationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const message = buildReservationMessage(formData);
  const emailUrl = `mailto:${reservationEmail}?subject=${encodeURIComponent(
    "New Carolina Sedan reservation request"
  )}&body=${encodeURIComponent(message)}`;
  const smsUrl = `sms:${reservationSms}?&body=${encodeURIComponent(message)}`;

  reservationSubmit.disabled = true;
  reservationStatus.textContent = "Sending your reservation request...";

  fetch("/api/reservation", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverDetails = [
          result.error,
          result.email?.error,
          result.email?.reason,
          result.sms?.error,
          result.sms?.reason,
        ]
          .filter(Boolean)
          .join(" ");

        throw new Error(serverDetails || "Unable to send reservation request.");
      }

      reservationStatus.textContent =
        "Thank you. Your request was sent to Carolina Sedan. We will follow up to confirm your ride.";
      form.reset();
    })
    .catch((error) => {
      reservationStatus.innerHTML = `
        Online sending is not connected yet. Reason: ${error.message}. Please
        <a href="${emailUrl}">email this request to booking@carolinasedan.com</a>,
        <a href="${smsUrl}">text it to 919-924-0568</a>,
        or call <a href="tel:+19199240568">919-924-0568</a>.
      `;
      console.warn("Reservation submission failed", error);
    })
    .finally(() => {
      reservationSubmit.disabled = false;
    });
});
