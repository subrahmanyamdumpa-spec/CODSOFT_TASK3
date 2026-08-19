/* ============================================================
   Shared helpers used by every page:
   - initializes the Supabase JS client (using the public anon key,
     fetched from our own backend so nothing is hard-coded)
   - wraps fetch() to attach the user's Supabase auth token
   - small UI helpers (toast, nav chip, date formatting)
   ============================================================ */

let _supabaseClientPromise = null;

function getSupabaseClient() {
  if (!_supabaseClientPromise) {
    _supabaseClientPromise = fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
  }
  return _supabaseClientPromise;
}

async function getSession() {
  const sb = await getSupabaseClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

/** Redirects to /login if nobody is signed in. Returns the session otherwise. */
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = "/login";
    return null;
  }
  return session;
}

/** fetch() wrapper that attaches the Supabase access token and parses JSON errors. */
async function apiFetch(path, options = {}) {
  const session = await getSession();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

  const res = await fetch(path, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return body;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "show" + (type ? " " + type : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = "";
  }, 3500);
}

/** Fills in the header: shows the user's email + sign-out when logged in. */
async function renderUserChip() {
  const chip = document.getElementById("userChip");
  const session = await getSession();

  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const authGatedLinks = document.querySelectorAll(".requires-auth-link");

  if (session) {
    if (chip) {
      chip.textContent = session.user.email;
      chip.style.display = "inline";
    }
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "inline";
      logoutBtn.onclick = async () => {
        const sb = await getSupabaseClient();
        await sb.auth.signOut();
        window.location.href = "/login";
      };
    }
    authGatedLinks.forEach((el) => (el.style.display = "inline"));
  } else {
    if (chip) chip.style.display = "none";
    if (loginLink) loginLink.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "none";
    authGatedLinks.forEach((el) => (el.style.display = "none"));
  }
}

document.addEventListener("DOMContentLoaded", renderUserChip);
