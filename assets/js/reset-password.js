import { configurationReady, supabase } from "./supabase-client.js";

const requestSection = document.querySelector("#request-section");
const updateSection = document.querySelector("#update-section");
const requestForm = document.querySelector("#request-form");
const updateForm = document.querySelector("#update-form");
const message = document.querySelector("#recovery-message");
const configurationError = document.querySelector("#configuration-error");

if (!configurationReady) {
  configurationError.hidden = false;
  configurationError.textContent = "Complete assets/js/config.js before resetting the password.";
  requestForm.querySelector("button").disabled = true;
} else {
  const recoveryLink =
    window.location.hash.includes("type=recovery") ||
    new URLSearchParams(window.location.search).has("code");

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || (recoveryLink && session)) showPasswordForm();
  });

  const { data } = await supabase.auth.getSession();
  if (recoveryLink && data.session) showPasswordForm();
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = requestForm.querySelector("button");
  button.disabled = true;
  message.textContent = "Sending recovery email...";

  const redirectTo = new URL("reset-password.html", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(
    document.querySelector("#recovery-email").value.trim(),
    { redirectTo }
  );

  if (error) {
    message.textContent = error.message;
    button.disabled = false;
    return;
  }

  message.textContent = "Recovery link sent. Check your inbox and spam folder.";
});

updateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.querySelector("#new-password").value;
  const confirmation = document.querySelector("#confirm-password").value;
  const button = updateForm.querySelector("button");

  if (password !== confirmation) {
    message.textContent = "The passwords do not match.";
    return;
  }

  button.disabled = true;
  message.textContent = "Updating password...";
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    message.textContent = error.message;
    button.disabled = false;
    return;
  }

  await supabase.auth.signOut();
  history.replaceState(null, "", "reset-password.html");
  updateForm.hidden = true;
  message.textContent = "Password updated successfully. You can now return to sign in.";
});

function showPasswordForm() {
  requestSection.hidden = true;
  updateSection.hidden = false;
  message.textContent = "Recovery link verified. Choose your new password.";
}
