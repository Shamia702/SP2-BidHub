// js/auction/create-listing.js

import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";

const form = document.querySelector("#createListingForm");
const alertBox = document.querySelector("#createListingAlert");
const submitBtn = document.querySelector("#createListingSubmit");
const endsAtInput = document.querySelector("#endsAt");

function requireAuth() {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    // Optionally we could add ?redirect=... but not required
    window.location.href = "/auth/login.html";
    return false;
  }

  return true;
}

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

function setEndsAtMinValue() {
  if (!endsAtInput) return;

  const now = new Date();
  // e.g. minimum 1 hour from now
  now.setHours(now.getHours() + 1);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const minValue = `${year}-${month}-${day}T${hours}:${minutes}`;
  endsAtInput.min = minValue;
}

async function handleCreateListing(event) {
  event.preventDefault();
  clearAlert();

  if (!requireAuth()) return;

  if (!form || !submitBtn) return;

  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const endsAtRaw = form.endsAt.value;
  const imageUrl = form.imageUrl.value.trim();
  const imageAlt = form.imageAlt.value.trim();

  if (!title) {
    showAlert("warning", "Please enter a title for your listing.");
    return;
  }

  if (!endsAtRaw) {
    showAlert("warning", "Please choose when the auction should end.");
    return;
  }

  const endsAtDate = new Date(endsAtRaw);
  const now = new Date();
  if (Number.isNaN(endsAtDate.getTime()) || endsAtDate <= now) {
    showAlert("warning", "The end time must be in the future.");
    return;
  }

  const payload = {
    title,
    description,
    endsAt: endsAtDate.toISOString(),
  };

  if (imageUrl) {
    payload.media = [
      {
        url: imageUrl,
        alt: imageAlt || title,
      },
    ];
  }

  const token = getToken();
  if (!token) {
    showAlert("warning", "You must be logged in to create a listing.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const res = await fetch(`${AUCTION_URL}/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        "Could not create listing. Please check your details and try again.";
      showAlert("danger", message);
      return;
    }

    const newListing = json.data;
    showAlert("success", "Listing created successfully! Redirecting...");

    // Redirect to the new listing page
    if (newListing && newListing.id) {
      setTimeout(() => {
        window.location.href = `/auction/single-listing-page.html?id=${newListing.id}`;
      }, 800);
    }
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while creating your listing. Please try again."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create listing";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  setEndsAtMinValue();

  if (form) {
    form.addEventListener("submit", handleCreateListing);
  }
});
