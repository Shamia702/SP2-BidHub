import { API_BASE, AUCTION_URL, API_KEY } from "../api/config.js";
import { saveAuth, updateUser } from "../utils/storage.js";

const form = document.querySelector("#loginForm");
const alertBox = document.querySelector("#loginAlert");
const submitBtn = document.querySelector("#loginSubmit");

function showAlert(type, message) {
  if (!alertBox) return;
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

function clearAlert() {
  if (!alertBox) return;
  alertBox.classList.add("d-none");
  alertBox.textContent = "";
}

async function fetchProfile(name, token) {
  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(name)}`,
    {
      headers: {
        "X-Noroff-API-Key": API_KEY,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load profile after login."
    );
  }

  return json.data;
}

function isValidStudentEmail(email) {
  return email.toLowerCase().endsWith("@stud.noroff.no");
}

async function handleLogin(event) {
  event.preventDefault();
  clearAlert();

  if (!form || !submitBtn) return;

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  if (!email || !password) {
    showAlert("warning", "Please enter both email and password.");
    return;
  }

  if (!isValidStudentEmail(email)) {
    showAlert("warning", "You must use a @stud.noroff.no email address.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": API_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message || "Could not log in. Please try again.";
      showAlert("danger", message);
      return;
    }

    const authData = json.data;
    saveAuth(authData);
    const profile = await fetchProfile(authData.name, authData.accessToken);

    updateUser({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      banner: profile.banner,
      credits: profile.credits,
      bio: profile.bio,
    });

    showAlert("success", "Login successful! Redirecting…");
    setTimeout(() => {
      window.location.href = "/auction/auctions.html";
    }, 900);
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while logging in. Please try again."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log in";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (form) {
    form.addEventListener("submit", handleLogin);
  }
});
