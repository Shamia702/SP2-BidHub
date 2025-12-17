import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get("listingId");

const alertEl = document.querySelector("#editBidAlert");
const listingInfoEl = document.querySelector("#editBidListingInfo");
const formEl = document.querySelector("#editBidForm");
const amountInput = document.querySelector("#newBidAmount");
const helpTextEl = document.querySelector("#editBidHelpText");
const submitBtn = document.querySelector("#editBidSubmit");

let listingData = null;
let minAllowedBid = 1;

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

function getHighestBid(bids = []) {
  if (!Array.isArray(bids) || !bids.length) return 0;
  return bids.reduce((max, bid) => (bid.amount > max ? bid.amount : max), 0);
}

function getUserHighestBid(bids = [], userName) {
  const userBids = bids.filter((b) => {
    if (b.bidder && b.bidder.name) return b.bidder.name === userName;
    if (b.bidderName) return b.bidderName === userName;
    return false;
  });

  if (!userBids.length) return 0;

  return userBids.reduce(
    (max, bid) => (bid.amount > max ? bid.amount : max),
    0
  );
}

async function fetchListing(id) {
  const res = await fetch(
    `${AUCTION_URL}/listings/${id}?_bids=true&_seller=true`,
    {
      headers: {
        "X-Noroff-API-Key": API_KEY,
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load listing details."
    );
  }

  return json.data;
}

function renderListingInfo(listing, userName) {
  if (!listingInfoEl) return;

  const images = Array.isArray(listing.media) ? listing.media : [];
  const img = images[0] || null;

  const highestBid = getHighestBid(listing.bids);
  const userHighestBid = getUserHighestBid(listing.bids, userName);
  const endsAt = listing.endsAt || null;
  const timeText = endsAt ? formatTimeRemaining(endsAt) : "No end time";
  minAllowedBid = Math.max(highestBid, userHighestBid) + 1;

  listingInfoEl.innerHTML = `
    <div class="d-flex flex-column flex-md-row gap-3 align-items-start">
      <div class="flex-shrink-0" style="width: 140px;">
        ${
          img && img.url
            ? `<img src="${img.url}" alt="${img.alt || listing.title || "Listing image"}"
                 class="img-fluid rounded-3 w-100"
                 style="height: 100px; object-fit: cover;" />`
            : `<div class="bh-skeleton-thumb mb-0" style="height: 100px;"></div>`
        }
      </div>
      <div class="flex-grow-1">
        <h2 class="h6 mb-1">${listing.title}</h2>
        <p class="text-muted small mb-1">
          ${
            listing.seller && listing.seller.name
              ? `Seller: @${listing.seller.name}`
              : ""
          }
        </p>
        <p class="text-muted small mb-1">
          Current highest bid: <strong>${highestBid} credits</strong>
        </p>
        <p class="text-muted small mb-0">
          ${
            endsAt
              ? `<span class="bh-countdown" data-ends-at="${endsAt}">
                   ${timeText}
                 </span>`
              : "No end time"
          }
        </p>
        ${
          userHighestBid > 0
            ? `<p class="small mb-0 mt-2">
                 Your current highest bid on this listing is
                 <strong>${userHighestBid} credits</strong>.
               </p>`
            : `<p class="small mb-0 mt-2">
                 You haven't placed a bid on this listing yet from this page.
               </p>`
        }
      </div>
    </div>
  `;

  if (amountInput && helpTextEl && formEl) {
    amountInput.min = String(minAllowedBid);
    amountInput.value = String(minAllowedBid);
    helpTextEl.textContent = `Enter at least ${minAllowedBid} credits. You can only increase your bid.`;
    formEl.classList.remove("d-none");
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearAlert();

  const user = getUser();
  const token = getToken();
  if (!user || !token || !listingId) {
    showAlert("warning", "You must be logged in and have a valid listing.");
    return;
  }

  if (!amountInput) return;

  const raw = amountInput.value.trim();
  const amount = Number(raw);

  if (!raw || Number.isNaN(amount) || amount < minAllowedBid) {
    showAlert("warning", `Your bid must be at least ${minAllowedBid} credits.`);
    return;
  }

  if (!submitBtn) return;
  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  try {
    const res = await fetch(`${AUCTION_URL}/listings/${listingId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Noroff-API-Key": API_KEY,
      },
      body: JSON.stringify({ amount }),
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        "Could not update your bid. Please try again.";
      showAlert("danger", message);
      return;
    }

    showAlert("success", "Bid updated successfully! Redirecting...");

    setTimeout(() => {
      window.location.href = `/auction/single-listing-page.html?id=${listingId}`;
    }, 800);
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while updating your bid. Please try again."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Update bid";
  }
}

async function initEditBid() {
  const user = requireAuth();
  if (!user) return;

  if (!listingId) {
    showAlert("danger", "No listing specified. Please go back and try again.");
    if (listingInfoEl) {
      listingInfoEl.innerHTML = "";
    }
    return;
  }

  try {
    listingData = await fetchListing(listingId);
    renderListingInfo(listingData, user.name);
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
    if (listingInfoEl) {
      listingInfoEl.innerHTML = "";
    }
  }

  if (formEl) {
    formEl.addEventListener("submit", handleSubmit);
  }
}

document.addEventListener("DOMContentLoaded", initEditBid);
