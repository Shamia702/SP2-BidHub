// js/auth/register.js

const API_BASE_URL = "https://v2.api.noroff.dev";

function showRegisterError(message) {
  const alert = document.querySelector("#registerAlert");
  const success = document.querySelector("#registerSuccess");
  if (success) {
    success.classList.add("d-none");
    success.textContent = "";
  }
  if (!alert) return;
  alert.textContent = message;
  alert.classList.remove("d-none");
}

function showRegisterSuccess(message) {
  const alert = document.querySelector("#registerAlert");
  const success = document.querySelector("#registerSuccess");
  if (alert) {
    alert.classList.add("d-none");
    alert.textContent = "";
  }
  if (!success) return;
  success.textContent = message;
  success.classList.remove("d-none");
}

function clearRegisterAlerts() {
  const alert = document.querySelector("#registerAlert");
  const success = document.querySelector("#registerSuccess");
  if (alert) {
    alert.classList.add("d-none");
    alert.textContent = "";
  }
  if (success) {
    success.classList.add("d-none");
    success.textContent = "";
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearRegisterAlerts();

  const form = event.target;
  const name = form.registerName.value.trim();
  const email = form.registerEmail.value.trim();
  const password = form.registerPassword.value.trim();

  if (!name || !email || !password) {
    showRegisterError("Please fill out all fields.");
    return;
  }

  if (!email.endsWith("@stud.noroff.no")) {
    showRegisterError("Email must end with @stud.noroff.no.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message || "Registration failed. Please try again.";
      showRegisterError(message);
      return;
    }

    showRegisterSuccess(
      "Registration successful! You can now log in with your new account."
    );

    setTimeout(() => {
      window.location.href = "/auth/login.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    showRegisterError("Something went wrong. Please try again later.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#registerForm");
  if (!form) return;

  form.addEventListener("submit", handleRegisterSubmit);
});
