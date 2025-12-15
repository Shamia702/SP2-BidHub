import { getFeaturedListings } from "../api/listings.js";
import { getHighestBidAmount, formatTimeRemaining } from "../utils/format.js";


// 1) Skeletons while loading
function renderHeroSkeleton() {
  const heroCard = document.querySelector("#hero-featured-card");
  if (!heroCard) return;

  heroCard.innerHTML = `
    <div class="bh-skeleton-hero-img mb-3"></div>
    <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
    <div class="bh-skeleton-line bh-skeleton-line-sm mb-2"></div>
    <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
  `;
}

function renderFeaturedSkeleton(count = 3) {
  const grid = document.querySelector("#featured-auctions-grid");
  if (!grid) return;

  let html = "";
  for (let i = 0; i < count; i++) {
    html += `
      <div class="col-md-4">
        <article class="bh-card p-3 h-100 bh-skeleton-card">
          <div class="bh-skeleton-thumb mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-lg mb-2"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm mb-1"></div>
          <div class="bh-skeleton-line bh-skeleton-line-sm"></div>
        </article>
      </div>
    `;
  }
  grid.innerHTML = html;
}

// 2) Real hero card
function renderHeroListing(listing) {
  const heroCard = document.querySelector("#hero-featured-card");
  if (!heroCard) return;

  const { id, title, media, _count, endsAt } = listing;
  const imageUrl = media?.[0]?.url;
  const imageAlt = media?.[0]?.alt || title || "Listing image";
  const highestBid = getHighestBidAmount(listing);
  const bidsCount = _count?.bids ?? 0;
  const timeText = formatTimeRemaining(endsAt);

  heroCard.innerHTML = `
    <figure class="mb-3">
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="${imageAlt}" class="bh-listing-img" />`
          : `<div class="bh-hero-image-placeholder"><span>Image</span></div>`
      }
    </figure>
    <h2 class="h6 mb-1">${title}</h2>
    <p class="text-muted small mb-1">
      Current bid: ${highestBid} credits
    </p>
    <p class="text-muted small mb-1">
      ${bidsCount} bid${bidsCount === 1 ? "" : "s"} • ${timeText}
    </p>
    <a href="./auction/single-listing-page.html?id=${encodeURIComponent(
      id
    )}" class="bh-btn-primary btn-sm">
      View listing
    </a>
  `;
}


// 3) Real featured cards
function createFeaturedCard(listing) {
  const { id, title, media, _count, endsAt } = listing;

  const imageUrl = media?.[0]?.url;
  const imageAlt = media?.[0]?.alt || title || "Listing image";
  const highestBid = getHighestBidAmount(listing);
  const bidsCount = _count?.bids ?? 0;
  const timeText = formatTimeRemaining(endsAt);

  return `
    <div class="col-md-4">
      <article class="bh-card p-3 h-100">
        <figure class="mb-2">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${imageAlt}" class="bh-listing-img" />`
              : `<div class="bh-listing-thumb"></div>`
          }
        </figure>
        <h3 class="h6 mb-1">${title}</h3>
        <p class="mb-1 small">
          <strong>Current bid:</strong> ${highestBid} credits
        </p>
        <p class="text-muted small mb-3">
          ${bidsCount} bid${bidsCount === 1 ? "" : "s"} • ${timeText}
        </p>
        <a href="./auction/single-listing-page.html?id=${encodeURIComponent(
          id
        )}" class="bh-btn-outline btn-sm">
          View listing
        </a>
      </article>
    </div>
  `;
}


// 4) Main function
async function renderLanding() {
  const grid = document.querySelector("#featured-auctions-grid");
  if (!grid) return;

  // show skeletons while loading
  renderHeroSkeleton();
  renderFeaturedSkeleton(3);

  try {
    const listings = await getFeaturedListings(4);

    if (!listings.length) {
      grid.innerHTML = `<p class="text-muted">No live auctions right now.</p>`;
      return;
    }

    const [heroListing, ...featured] = listings;

    // hero
    renderHeroListing(heroListing);

    // featured cards
    const cardsHtml = featured.map(createFeaturedCard).join("");
    grid.innerHTML = cardsHtml;
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p class="text-danger small">
      Could not load auctions. Please try again later.
    </p>`;
  }
}

document.addEventListener("DOMContentLoaded", renderLanding);
