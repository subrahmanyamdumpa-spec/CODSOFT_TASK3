/* ============================================================
   Powers seats.html — seat map + passenger details + booking.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAuth();
  if (!session) return;

  const tripInfoEl = document.getElementById("tripInfo");
  const busShell = document.getElementById("busShell");
  const seatGrid = document.getElementById("seatGrid");
  const passengerForm = document.getElementById("passengerForm");
  const summaryBar = document.getElementById("summaryBar");
  const confirmBtn = document.getElementById("confirmBtn");
  const seatCountEl = document.getElementById("seatCount");
  const totalPriceEl = document.getElementById("totalPrice");

  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("trip_id");

  if (!tripId) {
    tripInfoEl.innerHTML = `<div class="empty-state"><h3>No trip selected</h3><p>Go back and choose a bus first.</p><br/><a class="btn btn-primary" href="/">Search buses</a></div>`;
    busShell.style.display = "none";
    return;
  }

  let trip = null;
  let takenSeats = [];
  let selectedSeats = [];
  const passengerNames = {};

  await loadTrip();

  async function loadTrip() {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Trip not found");
      trip = body.trip;
      takenSeats = body.taken_seats;
      renderTripInfo();
      renderSeatGrid();
    } catch (err) {
      tripInfoEl.innerHTML = `<div class="empty-state"><h3>Couldn't load trip</h3><p>${escapeHtml(err.message)}</p></div>`;
      busShell.style.display = "none";
    }
  }

  function renderTripInfo() {
    tripInfoEl.innerHTML = `
      <div class="ticket-route">
        <span>${escapeHtml(trip.routes.source)}</span>
        <span class="arrow">&rarr;</span>
        <span>${escapeHtml(trip.routes.destination)}</span>
      </div>
      <div class="ticket-meta">
        <span><strong>${formatDateTime(trip.departure_time)}</strong></span>
        <span>${escapeHtml(trip.bus_name)} · ${escapeHtml(trip.bus_number)}</span>
        <span>${escapeHtml(trip.bus_type)}</span>
        <span class="mono">$${Number(trip.price).toFixed(2)} / seat</span>
      </div>`;
  }

  function renderSeatGrid() {
    let html = "";
    for (let n = 1; n <= trip.total_seats; n++) {
      const posInRow = (n - 1) % 4;
      if (posInRow === 2) {
        html += `<div class="seat aisle-gap"></div>`;
      }
      const taken = takenSeats.includes(n);
      const selected = selectedSeats.includes(n);
      html += `<button type="button" class="seat ${taken ? "taken" : ""} ${selected ? "selected" : ""}"
                 data-seat="${n}" ${taken ? "disabled" : ""} aria-label="Seat ${n}">${n}</button>`;
    }
    seatGrid.innerHTML = html;
    seatGrid.querySelectorAll(".seat[data-seat]").forEach((btn) => {
      btn.addEventListener("click", () => toggleSeat(Number(btn.dataset.seat)));
    });
  }

  function toggleSeat(seatNum) {
    const idx = selectedSeats.indexOf(seatNum);
    if (idx >= 0) {
      selectedSeats.splice(idx, 1);
    } else {
      if (selectedSeats.length >= 6) {
        showToast("You can select up to 6 seats per booking", "error");
        return;
      }
      selectedSeats.push(seatNum);
    }
    selectedSeats.sort((a, b) => a - b);
    renderSeatGrid();
    renderPassengerForm();
    renderSummary();
  }

  function renderPassengerForm() {
    if (selectedSeats.length === 0) {
      passengerForm.innerHTML = "";
      return;
    }
    passengerForm.innerHTML = `
      <h3 class="section-title" style="font-size:0.95rem;">Passenger details</h3>
      ${selectedSeats
        .map(
          (seat) => `
        <div class="passenger-row">
          <span class="seat-tag">#${seat}</span>
          <input type="text" placeholder="Passenger full name" data-seat-input="${seat}"
                 value="${escapeHtml(passengerNames[seat] || "")}" />
        </div>`
        )
        .join("")}`;

    passengerForm.querySelectorAll("[data-seat-input]").forEach((input) => {
      input.addEventListener("input", (e) => {
        passengerNames[e.target.dataset.seatInput] = e.target.value;
      });
    });
  }

  function renderSummary() {
    if (selectedSeats.length === 0) {
      summaryBar.style.display = "none";
      return;
    }
    summaryBar.style.display = "flex";
    const total = selectedSeats.length * Number(trip.price);
    seatCountEl.textContent = `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected`;
    totalPriceEl.textContent = `$${total.toFixed(2)}`;
  }

  confirmBtn.addEventListener("click", async () => {
    if (selectedSeats.length === 0) return;

    const seats = selectedSeats.map((seat) => ({
      seat_number: seat,
      passenger_name: (passengerNames[seat] || "").trim(),
    }));

    if (seats.some((s) => !s.passenger_name)) {
      showToast("Please enter a name for every selected seat", "error");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Booking…";

    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ trip_id: Number(tripId), seats }),
      });
      showToast("Booking confirmed!", "ok");
      setTimeout(() => (window.location.href = "/bookings"), 900);
    } catch (err) {
      showToast(err.message, "error");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm booking";

      // Someone may have grabbed a seat first — refresh availability.
      const res = await fetch(`/api/trips/${tripId}`);
      const body = await res.json();
      takenSeats = body.taken_seats;
      selectedSeats = selectedSeats.filter((s) => !takenSeats.includes(s));
      renderSeatGrid();
      renderPassengerForm();
      renderSummary();
    }
  });
});
