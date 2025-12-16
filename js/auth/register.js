import { API_BASE, AUCTION_URL, API_KEY } from "../api/config.js";
import { saveAuth, updateUser } from "../utils/storage.js";

const form = document.querySelector("#registerForm");
const alertBox = document.querySelector("#registerAlert");
const submitBtn = document.querySelector("#registerSubmit");

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

function isValidStudentEmail(email) {
  return email.toLowerCase().endsWith("@stud.noroff.no");
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
      json?.errors?.[0]?.message || "Could not load profile after register."
    );
  }

  return json.data;
}

async function handleRegister(event) {
  event.preventDefault();
  clearAlert();

  if (!form || !submitBtn) return;

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const confirmPassword = form.confirmPassword.value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showAlert("warning", "Please fill out all the fields.");
    return;
  }

  if (!isValidStudentEmail(email)) {
    showAlert("warning", "You must use a @stud.noroff.no email address.");
    return;
  }

  if (password.length < 8) {
    showAlert("warning", "Password must be at least 8 characters.");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("warning", "Passwords do not match.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Noroff-API-Key": API_KEY,
      },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        "Could not register. Please check your details and try again.";
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

    showAlert("success", "Registration successful! Redirecting…");

    setTimeout(() => {
      window.location.href = "/auction/auctions.html";
    }, 900);
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while registering. Please try again."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (form) {
    form.addEventListener("submit", handleRegister);
  }
});
