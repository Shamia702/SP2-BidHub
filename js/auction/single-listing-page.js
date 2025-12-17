import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken, updateUser } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";
import { renderHeader } from "../components/header.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

if (!listingId) {
  console.error("No listing ID in URL");
}

function formatBidDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBidderDisplayName(bid) {
  if (bid.bidder && typeof bid.bidder === "object") {
    return (
      bid.bidder.name || bid.bidder.username || bid.bidder.email || "unknown"
    );
  }

  if (typeof bid.bidder === "string") {
    return bid.bidder;
  }

  if (typeof bid.bidderName === "string") {
    return bid.bidderName;
  }

  return "unknown";
}

// Refresh user credits from API and update header
async function refreshUserCredits() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) return;

  try {
    const res = await fetch(
      `${AUCTION_URL}/profiles/${encodeURIComponent(user.name)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Noroff-API-Key": API_KEY,
        },
      }
    );

    const json = await res.json();
    if (!res.ok) {
      console.warn("Could not refresh user credits:", json);
      return;
    }

    const profile = json.data;

    updateUser({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      banner: profile.banner,
      credits: profile.credits,
      bio: profile.bio,
    });

    // Re-render header with fresh credits
    renderHeader();
  } catch (error) {
    console.error("Error refreshing user credits", error);
  }
}

/* ---------- API calls ---------- */

// Fetch listing with seller + bids
async function fetchListing() {
  const url = `${AUCTION_URL}/listings/${listingId}?_seller=true&_bids=true`;

  const res = await fetch(url, {
    headers: {
      "X-Noroff-API-Key": API_KEY,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load listing details."
    );
  }

  return json.data;
}

/* ---------- render main listing ---------- */

function renderListing(listing) {
  const container = document.querySelector("#single-listing");
  if (!container) return;

  const user = getUser();

  const {
    title,
    description,
    media,
    endsAt,
    seller,
    _count,
    bids = [],
  } = listing;

  const images = Array.isArray(media) && media.length > 0 ? media : [];
  const mainImage = images[0] || null;
  const timeText = formatTimeRemaining(endsAt);
  const bidsCount = _count?.bids ?? bids.length ?? 0;

  const highestBid = bids.length
    ? bids.reduce((max, bid) => (bid.amount > max ? bid.amount : max), 0)
    : 0;

  const sellerName =
    seller?.name || seller?.username || seller?.email || "Unknown seller";

  container.innerHTML = `
    <div class="row gy-4">
      <!-- Left: gallery -->
      <div class="col-lg-7">
        <article>
          ${
            mainImage
              ? `<img src="${mainImage.url}" alt="${
                  mainImage.alt || title || "Listing image"
                }" class="bh-listing-main-img mb-3" />`
              : `<div class="bh-skeleton-hero-img mb-3"></div>`
          }

          ${
            images.length > 1
              ? `
            <div class="d-flex flex-wrap gap-2">
              ${images
                .map(
                  (img, index) => `
                <button
                  type="button"
                  class="btn p-0 border-0 bg-transparent bh-listing-thumb-btn"
                  data-index="${index}"
                >
                  <img
                    src="${img.url}"
                    alt="${img.alt || title || "Listing image"}"
                    class="bh-listing-thumb-img"
                  />
                </button>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </article>
      </div>

      <!-- Right: info + bid box -->
      <div class="col-lg-5">
        <article class="bh-card p-3 p-lg-4 h-100 d-flex flex-column">
          <header class="mb-3">
            <h1 class="h4 mb-2">${title}</h1>
            <p class="text-muted small mb-1">
              Sold by <strong>@${sellerName}</strong>
            </p>
            <p class="text-muted small mb-0">
              <span class="badge bg-light text-muted">
                <span class="bh-countdown" data-ends-at="${endsAt || ""}">
                  ${timeText}
                </span>
              </span>
              <span class="ms-2">
                ${bidsCount} bid${bidsCount === 1 ? "" : "s"}
              </span>
            </p>
          </header>

          <section class="mb-3">
            <h2 class="h6 mb-1">Description</h2>
            <p class="text-muted small mb-0">
              ${description || "No description provided."}
            </p>
          </section>

          <section class="mb-3">
            <h2 class="h6 mb-1">Current highest bid</h2>
            <p class="mb-0">
              <strong>${highestBid} credits</strong>
            </p>
          </section>

          <!-- Bid section goes here -->
          <section id="listing-bid-section" class="mt-auto"></section>
        </article>
      </div>
    </div>
  `;

  // Thumb click → swap main image
  const thumbButtons = container.querySelectorAll(".bh-listing-thumb-btn");
  if (thumbButtons && mainImage) {
    const mainImgEl = container.querySelector(".bh-listing-main-img");
    thumbButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        const img = images[index];
        if (!img || !mainImgEl) return;
        mainImgEl.src = img.url;
        mainImgEl.alt = img.alt || title || "Listing image";
      });
    });
  }

  renderBidSection(listing, user, highestBid);
  renderBidsList(listing);
}

/* ---------- render bid section ---------- */

function renderBidSection(listing, user, highestBid) {
  const bidSection = document.querySelector("#listing-bid-section");
  if (!bidSection) return;

  const isLoggedIn = !!user;
  const isSeller = isLoggedIn && listing.seller?.name === user.name;

  if (!isLoggedIn) {
    bidSection.innerHTML = `
      <div class="alert alert-info small mb-0" role="alert">
        <strong>Want to bid?</strong>
        <a href="/auth/login.html" class="alert-link">Log in</a>
        or
        <a href="/auth/register.html" class="alert-link">create an account</a>
        to place a bid on this listing.
      </div>
    `;
    return;
  }

  if (isSeller) {
    bidSection.innerHTML = `
      <div class="alert alert-warning small mb-2" role="alert">
        You are the seller of this listing and cannot place bids on it.
      </div>
      <p class="small text-muted mb-0">
        Manage this listing from your <a href="/profile/my-listings.html" class="bh-link-muted">My listings</a> page.
      </p>
    `;
    return;
  }

  bidSection.innerHTML = `
    <div
      id="bidAlert"
      class="alert d-none small mb-2"
      role="alert"
    ></div>

    <form id="bidForm">
      <div class="mb-2">
        <label for="bidAmount" class="form-label bh-form-label small">
          Your bid (credits)
        </label>
        <input
          type="number"
          min="${highestBid + 1}"
          step="1"
          class="form-control form-control-sm"
          id="bidAmount"
          name="amount"
          placeholder="Enter at least ${highestBid + 1}"
          required
        />
        <div class="form-text small">
          Your bid must be higher than the current highest bid.
        </div>
      </div>
      <button type="submit" class="bh-btn-primary btn-sm w-100">
        Place bid
      </button>
    </form>
  `;

  const form = bidSection.querySelector("#bidForm");
  if (form) {
    form.addEventListener("submit", (event) =>
      handleBidSubmit(event, listing, highestBid)
    );
  }
}

/* ---------- render bids list ---------- */

function renderBidsList(listing) {
  const container = document.querySelector("#listing-bids");
  if (!container) return;

  const bids = listing.bids ?? [];

  if (!bids.length) {
    container.innerHTML = `
      <section class="mt-4">
        <h2 class="h6 mb-2">Bid history</h2>
        <p class="text-muted small mb-0">
          No bids yet. Be the first to place a bid on this listing.
        </p>
      </section>
    `;
    return;
  }

  const sorted = [...bids].sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  container.innerHTML = `
    <section class="mt-4">
      <h2 class="h6 mb-2">Bid history</h2>
      <ul class="list-group list-group-flush bh-bids-list">
        ${sorted
          .map(
            (bid) => `
          <li class="list-group-item d-flex justify-content-between align-items-center small">
            <div>
              <strong>${bid.amount} credits</strong>
              <span class="text-muted">
                by @${getBidderDisplayName(bid)}
              </span>
            </div>
            <span class="text-muted">${formatBidDate(bid.created)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </section>
  `;
}

/* ---------- alerts ---------- */

function showBidAlert(type, message) {
  const alert = document.querySelector("#bidAlert");
  if (!alert) return;

  alert.className = `alert alert-${type} small mb-2`;
  alert.textContent = message;
  alert.classList.remove("d-none");
}

/* ---------- submit bid ---------- */

async function handleBidSubmit(event, listing, highestBid) {
  event.preventDefault();
  const form = event.target;
  const amountInput = form.bidAmount;
  if (!amountInput) return;

  const raw = amountInput.value.trim();
  const amount = Number(raw);

  if (!raw || Number.isNaN(amount) || amount <= highestBid) {
    showBidAlert(
      "warning",
      `Your bid must be higher than the current highest bid (${highestBid} credits).`
    );
    return;
  }

  const token = getToken();
  if (!token) {
    showBidAlert("warning", "You must be logged in to place a bid.");
    return;
  }

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
        json?.errors?.[0]?.message || "Could not place bid. Please try again.";
      showBidAlert("danger", message);
      return;
    }

    showBidAlert("success", "Bid placed successfully!");
    amountInput.value = "";

    // 1) Refresh credits in header
    await refreshUserCredits();

    // 2) Reload listing to update highest bid + history
    await loadListing();
  } catch (error) {
    console.error(error);
    showBidAlert(
      "danger",
      "Something went wrong while placing your bid. Please try again."
    );
  }
}

/* ---------- load listing ---------- */

async function loadListing() {
  const listingSection = document.querySelector("#single-listing");
  const bidsSection = document.querySelector("#listing-bids");

  if (!listingSection || !bidsSection) return;

  listingSection.classList.add("bh-listing-skeleton");

  try {
    const listing = await fetchListing();
    listingSection.classList.remove("bh-listing-skeleton");
    renderListing(listing);
  } catch (error) {
    console.error(error);
    listingSection.innerHTML = `
      <div class="alert alert-danger" role="alert">
        ${error.message}
      </div>
    `;
    bidsSection.innerHTML = "";
  }
}

/* ---------- init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (!listingId) {
    const section = document.querySelector("#single-listing");
    if (section) {
      section.innerHTML = `
        <div class="alert alert-danger" role="alert">
          No listing specified. Please go back to the auctions page and select a listing.
        </div>
      `;
    }
    return;
  }

  loadListing();
});
