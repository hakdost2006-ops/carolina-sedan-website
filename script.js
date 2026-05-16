const serviceContent = {
  airport: { tag: "Airport Transfers", title: "Make catching a flight feel boring again.", copy: "Promote flight tracking, planned pickup times, help with luggage, and direct service between Chapel Hill, Carrboro, Durham, Raleigh, and RDU." },
  medical: { tag: "Medical & Senior Rides", title: "Give families a dependable appointment ride.", copy: "This is where Carolina Sedan can win: scheduled pickup windows, patient drivers, clean cars, and a direct phone number for family members." },
  campus: { tag: "University Travel", title: "Own the UNC and Duke visitor market.", copy: "Create pages for parents, guest speakers, visiting faculty, hotel pickups, game days, move-in weekends, and RDU transfers." },
  corporate: { tag: "Corporate & Event Service", title: "Position the service as professional ground transportation.", copy: "Feature executive rides, dinners, meetings, conferences, hourly availability, discreet chauffeurs, and invoicing for repeat business clients." },
};

const routeContent = {
  "Chapel Hill to RDU": "A dedicated page for this route can answer pickup timing, flight buffer, luggage, early-morning availability, and reservation expectations.",
  "Carrboro to RDU": "Carrboro clients often need scheduled airport pickups that do not depend on driver availability at odd hours. This route page can focus on reliability and local pickup knowledge.",
  "UNC to RDU": "This page should speak to parents, students, faculty, guest speakers, and departments that need professional transportation between campus and the airport.",
  "Duke to Chapel Hill": "This route can attract medical, university, and event traffic between Durham and Chapel Hill with emphasis on comfort, timing, and professional service.",
};

const serviceCards = document.querySelectorAll(".service-card");
const serviceDetail = document.querySelector("#service-detail");
serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    serviceCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    const selected = serviceContent[card.dataset.service];
    serviceDetail.innerHTML = `<p class="tag">${selected.tag}</p><h3>${selected.title}</h3><p>${selected.copy}</p>`;
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
const baseRates = { "chapel-hill": { rdu: 85, local: 45, hourly: 95 }, carrboro: { rdu: 90, local: 45, hourly: 95 }, durham: { rdu: 80, local: 50, hourly: 100 }, raleigh: { rdu: 70, local: 55, hourly: 105 } };
function updateEstimate() {
  const area = pickup.value;
  const type = rideType.value;
  const passengerCount = Number(passengers.value || 1);
  let estimate = baseRates[area][type];
  if (passengerCount > 3) estimate += 15;
  if (early.checked) estimate += 20;
  const label = type === "hourly" ? "starting hourly estimate" : "starting estimate";
  output.textContent = `$${estimate} ${label}`;
}
estimateForm.addEventListener("input", updateEstimate);
updateEstimate();

const reservationEmail = "booking@carolinasedan.com";
const reservationSms = "+19192594030";
const reservationForm = document.querySelector("#reservation-form");
const reservationStatus = document.querySelector("#reservation-status");
const reservationSubmit = reservationForm.querySelector('button[type="submit"]');
function formatPickupTime(value) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function buildReservationMessage(formData) {
  return ["New Carolina Sedan reservation request", "", `Name: ${formData.get("name")}`, `Phone or email: ${formData.get("contact")}`, `Pickup date/time: ${formatPickupTime(formData.get("pickup-time"))}`, "", "Ride details:", formData.get("details")].join("\n");
}
reservationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const message = buildReservationMessage(formData);
  const emailUrl = `mailto:${reservationEmail}?subject=${encodeURIComponent("New Carolina Sedan reservation request")}&body=${encodeURIComponent(message)}`;
  const smsUrl = `sms:${reservationSms}?&body=${encodeURIComponent(message)}`;
  reservationSubmit.disabled = true;
  reservationStatus.textContent = "Sending your reservation request...";
  fetch(event.currentTarget.action, { method: "POST", body: formData })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to send reservation request.");
      reservationStatus.textContent = "Thank you. Your request was sent to Carolina Sedan. We will follow up to confirm your ride.";
      event.currentTarget.reset();
    })
    .catch(() => {
      reservationStatus.innerHTML = `We could not send automatically from this preview. Please use these backup links: <a href="${emailUrl}">email request</a> or <a href="${smsUrl}">text request</a>.`;
    })
    .finally(() => { reservationSubmit.disabled = false; });
});
