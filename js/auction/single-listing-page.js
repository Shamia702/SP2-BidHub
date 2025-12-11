// js/auction/listing.js
import { getListingById } from "../api/listings.js";
import {
  getHighestBidAmount,
  formatEndsAt,
  formatTimeRemaining,
} from "../utils/format.js";

function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Skeleton while loading
function renderSkeleton() {
  const header = document.querySelector("#listing-header");
  const root = document.querySelector("#single-listing-root");
  if (!header || !root) return;

  header.innerHTML = `
    <h1 class="h4 mb-2">Loading listing…</h1>
    <p class="text-muted small mb-0">
      Please wait while we fetch this auction.
    </p>
  `;

  root.innerHTML = `
    <article class="bh-card p-3 p-lg-4 bh-listing-skeleton">
      <div class="row gy-4">
        <div class="col-lg-7">
          <div class="bh-skeleton-hero-img mb-3"></div>
          <div class="d-flex gap-2">
            <div class="bh-skeleton-thumb-sm"></div>
            <div class="bh-skeleton-thumb-sm"></div>
            <div class="bh-skeleton-thumb-sm"></div>
          </div>
          <div class="mt-4">
            <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
            <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-lg mb-3"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
        </div>
      </div>
    </article>
  `;
}

function renderHeader(listing) {
  const header = document.querySelector("#listing-header");
  if (!header) return;

  const { title, tags = [], seller, endsAt, _count, bids = [] } = listing;
  const tagLabel = tags[0] || "Listing";
  const sellerName = seller?.name || "Unknown seller";
  const timeRemaining = formatTimeRemaining(endsAt);
  const bidsCount = _count?.bids ?? bids.length;

  header.innerHTML = `
    <h1 class="h4 mb-2">${title}</h1>
    <div class="d-flex flex-wrap align-items-center gap-2 small text-muted">
      <span class="bh-tag-pill">${tagLabel}</span>
      <span>Listing by <strong>@${sellerName}</strong></span>
      <span>• ${timeRemaining}</span>
      <span>• ${bidsCount} bid${bidsCount === 1 ? "" : "s"}</span>
    </div>
  `;
}

function renderListing(listing) {
  const root = document.querySelector("#single-listing-root");
  if (!root) return;

  const {
    title,
    description,
    media,
    endsAt,
    seller,
    _count,
    bids = [],
  } = listing;

  const highestBid = getHighestBidAmount(listing);
  const bidsCount = _count?.bids ?? bids.length;
  const minNextBid = highestBid + 1; // simple rule for display

  const mainImage = media?.[0];
  const otherImages = (media || []).slice(1);
  const sellerName = seller?.name || "Unknown seller";

  const endsAtText = formatEndsAt(endsAt);
  const timeRemaining = formatTimeRemaining(endsAt);

  const sortedBids = [...bids].sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  root.innerHTML = `
    <div class="row gy-4">
      <!-- LEFT: images + description -->
      <div class="col-lg-8">
        <article class="bh-card p-3 p-lg-4 mb-3">
          <figure class="mb-3">
            ${
              mainImage?.url
                ? `<img src="${mainImage.url}" alt="${
                    mainImage.alt || title
                  }" class="bh-listing-main-img" />`
                : `<div class="bh-skeleton-hero-img"></div>`
            }
          </figure>

          ${
            otherImages.length
              ? `
            <div class="d-flex flex-wrap gap-2 mb-3">
              ${otherImages
                .map(
                  (img) => `
                <img src="${img.url}" alt="${
                    img.alt || title
                  }" class="bh-listing-thumb-img" />
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          <section class="mt-3">
            <h2 class="h6 mb-2">Description:</h2>
            <p class="text-muted small mb-0">
              ${description || "No description provided for this listing."}
            </p>
          </section>
        </article>

        <section class="mt-3">
          <h2 class="h6 mb-1">
            Bid history (${bidsCount} bid${bidsCount === 1 ? "" : "s"})
          </h2>
          <p class="text-muted small mb-2">
            Most recent bids at the top. All times shown in local time.
          </p>
          ${
            sortedBids.length
              ? `
            <div class="vstack gap-2">
              ${sortedBids
                .slice(0, 5)
                .map(
                  (bid) => `
                <div class="bh-bid-history-item d-flex justify-content-between align-items-center">
                  <span><strong>${bid.amount} credits</strong></span>
                  <span class="text-muted small">
                    @${bid.bidderName || "anonymous"} • ${new Date(
                    bid.created
                  ).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  </span>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `<p class="text-muted small mb-0">
                No bids yet. Log in to be the first to bid.
              </p>`
          }
        </section>
      </div>

      <!-- RIGHT: bid summary card -->
      <div class="col-lg-4">
        <aside class="bh-card p-3 p-lg-4 bh-bid-summary-card">
          <p class="text-muted small mb-1">Current highest bid</p>
          <p class="h5 mb-1">${highestBid} credits</p>
          <p class="text-muted small mb-3">
            ${bidsCount} bid${bidsCount === 1 ? "" : "s"} so far •
            Min next bid: ${minNextBid} credits
          </p>

          <div class="mb-3">
            <span class="bh-time-chip">
              ${timeRemaining} (${endsAtText})
            </span>
          </div>

          <div class="bh-bid-alert mb-3">
            <p class="small mb-2">
              You need an account to place a bid on this listing.
            </p>
            <div class="d-flex gap-2">
              <a href="../auth/login.html" class="bh-btn-outline btn-sm">
                Login
              </a>
              <a href="../auth/register.html" class="bh-btn-primary btn-sm">
                Register
              </a>
            </div>
          </div>

          <p class="text-muted small mb-0">
            Seller: <strong>@${sellerName}</strong>
          </p>
        </aside>
      </div>
    </div>
  `;
}

async function initSingleListingPage() {
  const id = getListingIdFromUrl();
  const root = document.querySelector("#single-listing-root");

  if (!root) return;

  if (!id) {
    root.innerHTML = `
      <p class="text-danger">
        No listing ID provided. Please go back to the auctions page and select a listing.
      </p>
    `;
    return;
  }

  renderSkeleton();

  try {
    const listing = await getListingById(id);
    renderHeader(listing);
    renderListing(listing);
  } catch (error) {
    console.error(error);
    const header = document.querySelector("#listing-header");
    if (header) {
      header.innerHTML = `<h1 class="h4 mb-2">Listing not available</h1>`;
    }
    root.innerHTML = `
      <p class="text-danger">
        Could not load this listing. It may have been removed or an error occurred.
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", initSingleListingPage);
