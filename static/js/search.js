/* ============================================================
   Powers index.html — the route search / results page.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const results = document.getElementById("results");
  const dateInput = document.getElementById("date");

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch();
  });

  // Show something useful the moment the page loads.
  runSearch();

  async function runSearch() {
    const source = document.getElementById("source").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const date = document.getElementById("date").value;

    results.innerHTML = '<p class="helper-text">Searching…</p>';

    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date);

    try {
      const res = await fetch("/api/routes/search?" + params.toString());
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Search failed");
      renderResults(body.trips || []);
    } catch (err) {
      results.innerHTML = `<div class="empty-state"><h3>Search failed</h3><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  function renderResults(trips) {
    if (trips.length === 0) {
      results.innerHTML = `
        <div class="empty-state">
          <h3>No buses found</h3>
          <p>Try a different city pair or date. New here? Run <code>database/seed.sql</code> in Supabase to load sample routes.</p>
        </div>`;
      return;
    }
    results.innerHTML = trips.map(tripCard).join("");
  }

  function tripCard(t) {
    const low = t.seats_available > 0 && t.seats_available <= 5;
    const soldOut = t.seats_available <= 0;
    return `
      <div class="ticket">
        <div class="ticket-body">
          <div class="ticket-route">
            <span>${escapeHtml(t.source)}</span>
            <span class="arrow">&rarr;</span>
            <span>${escapeHtml(t.destination)}</span>
          </div>
          <div class="ticket-meta">
            <span><strong>${formatDateTime(t.departure_time)}</strong> depart</span>
            <span>${formatTime(t.arrival_time)} arrive</span>
            <span>${escapeHtml(t.bus_name)} · ${escapeHtml(t.bus_number)}</span>
            <span>${escapeHtml(t.bus_type)}</span>
          </div>
          <div class="ticket-badge ${low || soldOut ? "low" : ""}">
            ${soldOut ? "Sold out" : `${t.seats_available} seat${t.seats_available === 1 ? "" : "s"} left`}
          </div>
        </div>
        <div class="ticket-stub">
          <div class="ticket-price">$${Number(t.price).toFixed(2)}<small>per seat</small></div>
          ${
            soldOut
              ? `<button class="btn btn-ghost" disabled>Sold out</button>`
              : `<a class="btn btn-primary" href="/seats?trip_id=${t.id}">Select seats</a>`
          }
        </div>
      </div>`;
  }
});
