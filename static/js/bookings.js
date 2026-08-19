/* ============================================================
   Powers bookings.html — the signed-in user's ticket list.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAuth();
  if (!session) return;

  const list = document.getElementById("bookingsList");
  await loadBookings();

  async function loadBookings() {
    list.innerHTML = '<p class="helper-text">Loading your bookings…</p>';
    try {
      const body = await apiFetch("/api/bookings");
      renderBookings(body.bookings || []);
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><h3>Couldn't load bookings</h3><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  function renderBookings(bookings) {
    if (bookings.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>No bookings yet</h3>
          <p>Search for a route and reserve your seat.</p>
          <br/>
          <a class="btn btn-primary" href="/">Find a bus</a>
        </div>`;
      return;
    }
    // Most recent first (API already orders this way).
    list.innerHTML = bookings.map(bookingCard).join("");
    list.querySelectorAll("[data-cancel]").forEach((btn) => {
      btn.addEventListener("click", () => cancelBooking(btn.dataset.cancel));
    });
  }

  function bookingCard(b) {
    const trip = b.trips;
    const route = trip.routes;
    const cancelled = b.status === "cancelled";
    return `
      <div class="ticket" style="${cancelled ? "opacity:0.55;" : ""}">
        <div class="ticket-body">
          <div class="ticket-route">
            <span>${escapeHtml(route.source)}</span>
            <span class="arrow">&rarr;</span>
            <span>${escapeHtml(route.destination)}</span>
          </div>
          <div class="ticket-meta">
            <span><strong>${formatDateTime(trip.departure_time)}</strong></span>
            <span>${escapeHtml(trip.bus_name)} · ${escapeHtml(trip.bus_number)}</span>
            <span>Seat <strong>#${b.seat_number}</strong> · ${escapeHtml(b.passenger_name)}</span>
          </div>
          <div class="ticket-ref">REF ${escapeHtml(b.booking_ref)}</div>
          <div class="barcode">${barcodeBars()}</div>
        </div>
        <div class="ticket-stub">
          <div class="ticket-price">
            $${Number(trip.price).toFixed(2)}
            <small>${cancelled ? "Cancelled" : "Confirmed"}</small>
          </div>
          ${cancelled ? "" : `<button class="btn btn-danger" data-cancel="${b.id}">Cancel</button>`}
        </div>
      </div>`;
  }

  function barcodeBars() {
    let bars = "";
    for (let i = 0; i < 28; i++) {
      const w = Math.random() > 0.6 ? 2 : 1;
      bars += `<span style="width:${w}px;"></span>`;
    }
    return bars;
  }

  async function cancelBooking(id) {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    try {
      await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
      showToast("Booking cancelled", "ok");
      loadBookings();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
});
