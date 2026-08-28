import { configurationReady, supabase } from "./supabase-client.js";

const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");
const configurationError = document.querySelector("#configuration-error");

if (!configurationReady) {
  configurationError.hidden = false;
  configurationError.textContent = "Complete assets/js/config.js before signing in.";
  form.querySelector("button").disabled = true;
} else {
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.replace("dashboard.html");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Signing in...";
  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: document.querySelector("#email").value.trim(),
    password: document.querySelector("#password").value,
  });
  if (error) {
    message.textContent = "Sign-in failed. Check your email and password.";
    submitButton.disabled = false;
    return;
  }
  window.location.replace("dashboard.html");
});
