// js/profile/my-bids.js

import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";

const alertEl = document.querySelector("#myBidsAlert");
const contentEl = document.querySelector("#my-bids-content");

/* ---------- helpers ---------- */

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

function buildSkeleton() {
  return `
    <div class="bh-listing-skeleton">
      <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
      <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
      <div class="bh-skeleton-line bh-skeleton-line-sm mb-1"></div>
      <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
    </div>
  `;
}

function getListingIdFromBid(bid) {
  if (bid.listingId) return bid.listingId;
  if (bid.listing && bid.listing.id) return bid.listing.id;
  return null;
}

function getListingTitleFromBid(bid) {
  if (bid.listing && bid.listing.title) return bid.listing.title;
  if (bid.listingTitle) return bid.listingTitle;
  return "Listing";
}

function getListingEndsAtFromBid(bid) {
  if (bid.listing && bid.listing.endsAt) return bid.listing.endsAt;
  return null;
}

/* ---------- API ---------- */

async function fetchMyProfileWithBids(name) {
  const token = getToken();

  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(name)}?_bids=true`,
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
      json?.errors?.[0]?.message || "Could not load your bids."
    );
  }

  return json.data;
}

/* ---------- render ---------- */

// group bids so we show latest bid per listing
function getLatestBidsByListing(bids) {
  const map = new Map();

  for (const bid of bids) {
    const listingId = getListingIdFromBid(bid) || `unknown-${bid.id}`;
    const existing = map.get(listingId);

    if (!existing) {
      map.set(listingId, bid);
      continue;
    }

    const currentDate = bid.created ? new Date(bid.created) : 0;
    const existingDate = existing.created ? new Date(existing.created) : 0;

    if (currentDate > existingDate) {
      map.set(listingId, bid);
    }
  }

  return Array.from(map.values());
}

function renderBids(profile) {
  if (!contentEl) return;

  const bids = Array.isArray(profile.bids) ? profile.bids : [];
  if (!bids.length) {
    contentEl.innerHTML = `
      <p class="text-muted small mb-0">
        You haven't placed any bids yet.
      </p>
    `;
    return;
  }

  const latestBids = getLatestBidsByListing(bids).sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  const itemsMarkup = latestBids
    .map((bid) => {
      const listingId = getListingIdFromBid(bid);
      const listingTitle = getListingTitleFromBid(bid);
      const endsAt = getListingEndsAtFromBid(bid);

      const timeText = endsAt ? formatTimeRemaining(endsAt) : "No end time";

      return `
        <li class="list-group-item d-flex justify-content-between align-items-start">
          <div class="me-3">
            <div class="fw-semibold small mb-1">
              ${listingTitle}
            </div>
            <div class="text-muted small mb-1">
              Your bid: <strong>${bid.amount} credits</strong>
            </div>
            <div class="text-muted small">
              ${
                bid.created
                  ? new Date(bid.created).toLocaleString()
                  : ""
              }
            </div>
          </div>
          <div class="text-end small">
            ${
              endsAt
                ? `<div class="mb-1">
                    <span class="bh-countdown" data-ends-at="${endsAt}">
                      ${timeText}
                    </span>
                  </div>`
                : ""
            }
            ${
              listingId
                ? `<a href="/auction/listing.html?id=${listingId}" class="bh-link-muted">
                     View listing
                   </a>`
                : ""
            }
          </div>
        </li>
      `;
    })
    .join("");

  contentEl.innerHTML = `
    <ul class="list-group list-group-flush bh-bids-list">
      ${itemsMarkup}
    </ul>
  `;
}

/* ---------- init ---------- */

async function initMyBids() {
  const user = requireAuth();
  if (!user) return;

  if (contentEl) {
    contentEl.innerHTML = buildSkeleton();
  }

  try {
    const profile = await fetchMyProfileWithBids(user.name);
    clearAlert();
    renderBids(profile);
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
    if (contentEl) {
      contentEl.innerHTML = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", initMyBids);
