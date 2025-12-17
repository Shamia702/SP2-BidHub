import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

const form = document.querySelector("#editListingForm");
const alertBox = document.querySelector("#editListingAlert");
const submitBtn = document.querySelector("#editListingSubmit");
const deleteBtn = document.querySelector("#deleteListingBtn");
const endsAtInput = document.querySelector("#endsAt");

function requireAuth() {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    window.location.href = "/auth/login.html";
    return null;
  }

  return user;
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

function isoToLocalInput(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function fetchListing() {
  const res = await fetch(
    `${AUCTION_URL}/listings/${listingId}?_seller=true&_bids=true`,
    {
      headers: {
        "X-Noroff-API-Key": API_KEY,
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || "Could not load listing.");
  }

  return json.data;
}

async function updateListing(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to edit a listing.");
  }

  const res = await fetch(`${AUCTION_URL}/listings/${listingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || "Could not update listing.");
  }

  return json.data;
}

async function deleteListing() {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to delete a listing.");
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this listing? This cannot be undone."
  );
  if (!confirmDelete) return;

  const res = await fetch(`${AUCTION_URL}/listings/${listingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Noroff-API-Key": API_KEY,
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message = json?.errors?.[0]?.message || "Could not delete listing.";
    throw new Error(message);
  }

  showAlert("success", "Listing deleted. Redirecting…");
  setTimeout(() => {
    window.location.href = "/profile/my-listings.html";
  }, 900);
}

function fillForm(listing) {
  if (!form) return;

  form.title.value = listing.title || "";
  form.description.value = listing.description || "";

  if (listing.endsAt && endsAtInput) {
    endsAtInput.value = isoToLocalInput(listing.endsAt);
  }

  const media = Array.isArray(listing.media) ? listing.media : [];
  const img1 = media[0] || null;
  const img2 = media[1] || null;

  if (img1 && form.imageUrl1) {
    form.imageUrl1.value = img1.url || "";
  }
  if (img2 && form.imageUrl2) {
    form.imageUrl2.value = img2.url || "";
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearAlert();

  const user = requireAuth();
  if (!user) return;
  if (!form || !submitBtn) return;

  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const endsAtRaw = form.endsAt.value;

  const imageUrl1 = form.imageUrl1?.value.trim() || "";
  const imageUrl2 = form.imageUrl2?.value.trim() || "";

  if (!title) {
    showAlert("warning", "Please enter a title.");
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

  const media = [];
  if (imageUrl1) {
    media.push({
      url: imageUrl1,
      alt: title,
    });
  }
  if (imageUrl2) {
    media.push({
      url: imageUrl2,
      alt: title,
    });
  }

  payload.media = media;

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const updatedListing = await updateListing(payload);
    showAlert("success", "Listing updated successfully! Redirecting…");

    if (updatedListing && updatedListing.id) {
      setTimeout(() => {
        window.location.href = `/auction/single-listing-page.html?id=${updatedListing.id}`;
      }, 900);
    }
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save changes";
  }
}

async function initEditListing() {
  if (!listingId) {
    showAlert(
      "danger",
      "No listing specified. Go back to My listings and choose one to edit."
    );
    if (form) form.classList.add("d-none");
    return;
  }

  const user = requireAuth();
  if (!user) return;

  try {
    const listing = await fetchListing();
    const sellerName = listing.seller?.name || listing.seller?.username || "";
    if (sellerName && sellerName !== user.name) {
      showAlert("danger", "You can only edit listings that you created.");
      if (form) form.classList.add("d-none");
      return;
    }

    fillForm(listing);
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
    if (form) form.classList.add("d-none");
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      try {
        await deleteListing();
      } catch (error) {
        console.error(error);
        showAlert("danger", error.message);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initEditListing);
