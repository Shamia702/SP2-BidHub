// js/auction/landing.js
import { getFeaturedListings } from "../api/listings.js";
import { getHighestBidAmount } from "../utils/format.js";

function renderHeroListing(listing) {
  const card = document.querySelector("#hero-featured-card");
  if (!card) return;

  const { id, title, media } = listing;
  const imageUrl = media?.[0]?.url;
  const imageAlt = media?.[0]?.alt || title || "Listing image";
  const highestBid = getHighestBidAmount(listing);

  card.innerHTML = `
    <figure class="mb-3">
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="${imageAlt}" class="bh-listing-img" />`
          : `<div class="bh-hero-image-placeholder"><span>Image</span></div>`
      }
    </figure>
    <h2 class="h6 mb-1">${title}</h2>
    <p class="text-muted small mb-3">
      Current bid: ${highestBid} credits
    </p>
    <button class="bh-btn-primary btn-sm" data-listing-id="${id}">
      View listing
    </button>
  `;
}

function createFeaturedCard(listing) {
  const { id, title, media } = listing;

  const imageUrl = media?.[0]?.url;
  const imageAlt = media?.[0]?.alt || title || "Listing image";
  const highestBid = getHighestBidAmount(listing);

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
        <button class="bh-btn-primary btn-sm" data-listing-id="${id}">
          View listing
        </button>
      </article>
    </div>
  `;
}

async function renderLanding() {
  const grid = document.querySelector("#featured-auctions-grid");
  if (!grid) return;

  grid.innerHTML = `<p class="text-muted">Loading featured auctions…</p>`;

  try {
    const listings = await getFeaturedListings(4);

    if (!listings.length) {
      grid.innerHTML = `<p class="text-muted">No live auctions right now.</p>`;
      return;
    }

    const [heroListing, ...featured] = listings;

    // 1) hero card
    renderHeroListing(heroListing);

    // 2) featured cards below
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
