import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";

const gridEl = document.querySelector("#my-listings-grid");
const alertEl = document.querySelector("#myListingsAlert");

let myListings = [];
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
  if (!alertEl) return;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.classList.remove("d-none");
}

function clearAlert() {
  if (!alertEl) return;
  alertEl.classList.add("d-none");
  alertEl.textContent = "";
}

function showSkeletons(count = 6) {
  if (!gridEl) return;

  const skeletons = Array.from({ length: count })
    .map(
      () => `
      <div class="col-md-6 col-lg-4">
        <article class="bh-card p-3 bh-skeleton-card">
          <div class="bh-skeleton-thumb mb-3"></div>
          <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm mb-1"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
        </article>
      </div>
    `
    )
    .join("");

  gridEl.innerHTML = skeletons;
}

function getHighestBid(listing) {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  if (!bids.length) return 0;
  return bids.reduce(
    (max, bid) => (bid.amount > max ? bid.amount : max),
    0
  );
}

function isListingActive(listing) {
  if (!listing.endsAt) return true;
  const now = new Date();
  const end = new Date(listing.endsAt);
  if (Number.isNaN(end.getTime())) return true;
  return end > now;
}


function buildListingCard(listing) {
  const images = Array.isArray(listing.media) ? listing.media : [];
  const mainImage = images[0] || null;

  const highestBid = getHighestBid(listing);
  const bidsCount =
    listing._count?.bids ?? (Array.isArray(listing.bids) ? listing.bids.length : 0);

  const timeText = listing.endsAt
    ? formatTimeRemaining(listing.endsAt)
    : "No end time";

  const active = isListingActive(listing);

  return `
    <div class="col-md-6 col-lg-4">
      <article class="bh-card h-100 d-flex flex-column p-3">
        <div class="mb-3">
          ${
            mainImage && mainImage.url
              ? `<img src="${mainImage.url}" alt="${mainImage.alt || listing.title || "Listing image"}"
                   class="img-fluid rounded-3 w-100"
                   style="max-height: 180px; object-fit: cover;" />`
              : `<div class="bh-skeleton-thumb mb-0"></div>`
          }
        </div>

        <!-- title + meta -->
        <h2 class="h6 mb-1">${listing.title}</h2>
        <p class="text-muted small mb-1">
          ${
            active
              ? `<span class="badge bg-success-subtle text-success border border-success-subtle me-1">Active</span>`
              : `<span class="badge bg-light text-muted border border-secondary-subtle me-1">Ended</span>`
          }
          ${bidsCount} bid${bidsCount === 1 ? "" : "s"}
        </p>
        <p class="text-muted small mb-3">
          Current highest bid: <strong>${highestBid} credits</strong>
          ${
            listing.endsAt
              ? ` · <span class="bh-countdown" data-ends-at="${listing.endsAt}">
                   ${timeText}
                 </span>`
              : ""
          }
        </p>
        <div class="mt-auto d-flex flex-wrap gap-2">
          <a
            href="/auction/single-listing-page.html?id=${listing.id}"
            class="bh-btn-primary btn-sm flex-grow-1 text-center"
          >
            View
          </a>
          <a
            href="/auction/edit-listing.html?id=${listing.id}"
            class="bh-btn-outline btn-sm flex-grow-1 text-center"
          >
            Edit
          </a>
          <button
            type="button"
            class="btn btn-link btn-sm text-danger p-0 text-decoration-none ms-auto bh-delete-listing"
            data-id="${listing.id}"
          >
            Delete
          </button>
        </div>
      </article>
    </div>
  `;
}

async function fetchMyListings(name) {
  const token = getToken();

  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(name)}?_listings=true&_bids=true`,
    {
      headers: {
        "X-Noroff-API-Key": API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load your listings."
    );
  }

  return Array.isArray(json.data.listings) ? json.data.listings : [];
}

async function deleteListing(id) {
  const token = getToken();
  if (!token) {
    showAlert("warning", "You must be logged in to delete a listing.");
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this listing? This action cannot be undone."
  );
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${AUCTION_URL}/listings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const message =
        json?.errors?.[0]?.message || "Could not delete listing.";
      showAlert("danger", message);
      return;
    }

    myListings = myListings.filter((item) => item.id !== id);
    renderListings();
    showAlert("success", "Listing deleted successfully.");
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while deleting the listing. Please try again."
    );
  }
}

function attachDeleteHandlers() {
  const buttons = document.querySelectorAll(".bh-delete-listing");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (id) deleteListing(id);
    });
  });
}

function renderListings() {
  if (!gridEl) return;

  if (!myListings.length) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light mb-0" role="alert">
          You haven't created any listings yet.
        </div>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = myListings
    .slice()
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .map(buildListingCard)
    .join("");

  attachDeleteHandlers();
}

async function initMyListings() {
  const user = requireAuth();
  if (!user) return;

  showSkeletons();

  try {
    myListings = await fetchMyListings(user.name);
    clearAlert();
    renderListings();
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
    if (gridEl) gridEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", initMyListings);
