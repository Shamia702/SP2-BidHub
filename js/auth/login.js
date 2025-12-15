// js/auth/login.js
import { saveAuth } from "../utils/storage.js";

const API_BASE_URL = "https://v2.api.noroff.dev"; // Noroff API base

function showLoginError(message) {
  const alert = document.querySelector("#loginAlert");
  if (!alert) return;
  alert.textContent = message;
  alert.classList.remove("d-none");
}

function clearLoginError() {
  const alert = document.querySelector("#loginAlert");
  if (!alert) return;
  alert.textContent = "";
  alert.classList.add("d-none");
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  clearLoginError();

  const form = event.target;
  const email = form.loginEmail.value.trim();
  const password = form.loginPassword.value.trim();

  if (!email || !password) {
    showLoginError("Please enter both email and password.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        "Login failed. Please check your email and password.";
      showLoginError(message);
      return;
    }

    // json.data should contain accessToken, name, email, avatar, credits, etc.
    const authData = json.data;
    saveAuth(authData);

    // Redirect after successful login
    window.location.href = "/auction/auctions.html";
  } catch (error) {
    console.error(error);
    showLoginError("Something went wrong. Please try again later.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  if (!form) return;

  form.addEventListener("submit", handleLoginSubmit);
});
