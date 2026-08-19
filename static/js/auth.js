/* ============================================================
   Powers login.html and signup.html. Talks to Supabase Auth
   directly from the browser using the anon key — Flask is never
   involved in the sign-in/sign-up step itself.
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // If already signed in, no need to see the auth screen.
  const session = await getSession();
  if (session) {
    window.location.href = "/";
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const msg = document.getElementById("formMsg");

  function setMsg(text, type) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "form-msg show " + type;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const btn = loginForm.querySelector("button[type=submit]");

      btn.disabled = true;
      btn.textContent = "Signing in…";
      const sb = await getSupabaseClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      btn.disabled = false;
      btn.textContent = "Log in";

      if (error) {
        setMsg(error.message, "error");
        return;
      }
      window.location.href = "/";
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirmPassword").value;
      const btn = signupForm.querySelector("button[type=submit]");

      if (password.length < 6) {
        setMsg("Password must be at least 6 characters.", "error");
        return;
      }
      if (password !== confirm) {
        setMsg("Passwords don't match.", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Creating account…";
      const sb = await getSupabaseClient();
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      btn.disabled = false;
      btn.textContent = "Create account";

      if (error) {
        setMsg(error.message, "error");
        return;
      }

      // If email confirmation is enabled on the Supabase project,
      // there won't be a session yet — send them to log in instead.
      if (data.session) {
        window.location.href = "/";
      } else {
        setMsg("Account created! Check your email to confirm, then log in.", "ok");
        setTimeout(() => (window.location.href = "/login"), 2200);
      }
    });
  }
});
