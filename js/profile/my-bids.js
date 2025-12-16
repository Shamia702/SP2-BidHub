import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";

const alertEl = document.querySelector("#myBidsAlert");
const gridEl = document.querySelector("#my-bids-grid");

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

function getListingIdFromBid(bid) {
  if (bid.listing && bid.listing.id) return bid.listing.id;
  if (bid.listingId) return bid.listingId;
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

function getListingThumbFromBid(bid) {
  if (!bid.listing || !Array.isArray(bid.listing.media)) return null;
  const img = bid.listing.media[0] || null;
  if (!img || !img.url) return null;
  return img;
}

function getHighestBid(bid) {
  const listingBids = Array.isArray(bid.listing?.bids)
    ? bid.listing.bids
    : [];
  if (!listingBids.length) return 0;
  return listingBids.reduce(
    (max, b) => (b.amount > max ? b.amount : max),
    0
  );
}

async function fetchMyBids(name) {
  const token = getToken();

  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(
      name
    )}/bids?_listings=true`,
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

  return Array.isArray(json.data) ? json.data : [];
}

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

function buildBidCard(bid) {
  const listingId = getListingIdFromBid(bid);
  const listingTitle = getListingTitleFromBid(bid);
  const endsAt = getListingEndsAtFromBid(bid);
  const thumb = getListingThumbFromBid(bid);
  const timeText = endsAt ? formatTimeRemaining(endsAt) : "No end time";
  const highestBid = getHighestBid(bid);

  const createdText = bid.created
    ? new Date(bid.created).toLocaleString()
    : "";

  return `
    <div class="col-md-6 col-lg-4">
      <article class="bh-card h-100 d-flex flex-column p-3">
        <!-- image -->
        <div class="mb-3">
          ${
            thumb
              ? `<img src="${thumb.url}" alt="${thumb.alt || listingTitle || "Listing image"}"
                   class="img-fluid rounded-3 w-100"
                   style="max-height: 180px; object-fit: cover;" />`
              : `<div class="bh-skeleton-thumb mb-0"></div>`
          }
        </div>

        <!-- title + meta -->
        <h2 class="h6 mb-1">${listingTitle}</h2>
        <p class="text-muted small mb-1">
          Your bid: <strong>${bid.amount} credits</strong>
        </p>
        <p class="text-muted small mb-1">
          Current highest bid: <strong>${highestBid} credits</strong>
        </p>
        <p class="text-muted small mb-3">
          ${
            endsAt
              ? `<span class="bh-countdown" data-ends-at="${endsAt}">
                   ${timeText}
                 </span>`
              : "No end time"
          }
        </p>
        <p class="text-muted small mb-3">
          Placed: ${createdText}
        </p>

        <!-- buttons -->
        <div class="mt-auto d-flex flex-wrap gap-2">
          ${
            listingId
              ? `
                <a
                  href="/auction/single-listing-page.html?id=${listingId}"
                  class="bh-btn-primary btn-sm flex-grow-1 text-center"
                >
                  View listing
                </a>
                <a
                  href="/profile/edit-bid.html?listingId=${listingId}"
                  class="bh-btn-outline btn-sm flex-grow-1 text-center"
                >
                  Edit bid
                </a>
              `
              : ""
          }
        </div>
      </article>
    </div>
  `;
}

function renderBids(bids) {
  if (!gridEl) return;

  if (!bids.length) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light mb-0" role="alert">
          You haven't placed any bids yet.
        </div>
      </div>
    `;
    return;
  }

  const latestBids = getLatestBidsByListing(bids).sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  gridEl.innerHTML = latestBids.map(buildBidCard).join("");
}

async function initMyBids() {
  const user = requireAuth();
  if (!user) return;

  showSkeletons();

  try {
    const bids = await fetchMyBids(user.name);
    clearAlert();
    renderBids(bids);
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
    if (gridEl) gridEl.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", initMyBids);
