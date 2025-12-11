// js/auction/auctions.js
import { getActiveListings } from "../api/listings.js";
import { getHighestBidAmount } from "../utils/format.js";

let allListings = [];
let currentPage = 1;
let totalPages = 1;

// ---------- skeleton (loading placeholders) ----------

function renderSkeletons(count = 6) {
  const grid = document.querySelector("#auctions-grid");
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

// ---------- render cards ----------

function createListingCard(listing) {
  const { id, title, media, _count } = listing;
  const imageUrl = media?.[0]?.url;
  const imageAlt = media?.[0]?.alt || title || "Listing image";

  const highestBid = getHighestBidAmount(listing);
  const bidsCount = _count?.bids ?? 0;

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
        <h2 class="h6 mb-1">${title}</h2>
        <p class="mb-1 small">
          <strong>Current bid:</strong> ${highestBid} credits
        </p>
        <p class="text-muted small mb-3">${bidsCount} bids</p>
        <a href="./single-listing-page.html?id=${encodeURIComponent(
          id
        )}" class="bh-btn-primary btn-sm">
          View listing
        </a>
      </article>
    </div>
  `;
}

function renderListings(listings) {
  const grid = document.querySelector("#auctions-grid");
  if (!grid) return;

  if (!listings.length) {
    grid.innerHTML = `<p class="text-muted">No auctions match your search.</p>`;
    return;
  }

  grid.innerHTML = listings.map(createListingCard).join("");
}

// ---------- pagination UI ----------

function renderPagination() {
  const container = document.querySelector("#auctions-pagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <button
        class="bh-btn-outline btn-sm"
        data-page-action="prev"
        ${isFirst ? "disabled" : ""}
      >
        Previous
      </button>
      <span class="small text-muted">
        Page ${currentPage} of ${totalPages}
      </span>
      <button
        class="bh-btn-outline btn-sm"
        data-page-action="next"
        ${isLast ? "disabled" : ""}
      >
        Next
      </button>
    </div>
  `;
}

function setupPaginationEvents() {
  const container = document.querySelector("#auctions-pagination");
  if (!container) return;

  container.addEventListener("click", (event) => {
    const action = event.target.getAttribute("data-page-action");
    if (!action) return;

    if (action === "prev" && currentPage > 1) {
      loadPage(currentPage - 1);
    } else if (action === "next" && currentPage < totalPages) {
      loadPage(currentPage + 1);
    }
  });
}

// ---------- search + sort (same logic, just works on current page) ----------

function getFilteredAndSortedListings() {
  const input = document.querySelector("#auctionSearch");
  const sortSelect = document.querySelector("#sortSelect");

  let results = [...allListings];

  // filter by search query
  const query = input?.value.trim().toLowerCase() || "";
  if (query) {
    results = results.filter((listing) => {
      const title = listing.title?.toLowerCase() || "";
      const description = listing.description?.toLowerCase() || "";
      return title.includes(query) || description.includes(query);
    });
  }

  // sort
  const sortValue = sortSelect?.value || "newest";

  if (sortValue === "newest") {
    results.sort((a, b) => {
      const da = new Date(a.created);
      const db = new Date(b.created);
      return db - da; // newest first
    });
  } else if (sortValue === "endingSoon") {
    results.sort((a, b) => {
      const ea = a.endsAt ? new Date(a.endsAt) : null;
      const eb = b.endsAt ? new Date(b.endsAt) : null;

      if (!ea && !eb) return 0;
      if (!ea) return 1;
      if (!eb) return -1;
      return ea - eb;
    });
  } else if (sortValue === "mostBids") {
    results.sort((a, b) => {
      const ca = a._count?.bids ?? 0;
      const cb = b._count?.bids ?? 0;
      return cb - ca;
    });
  }

  return results;
}

function applyFiltersAndRender() {
  const finalList = getFilteredAndSortedListings();
  renderListings(finalList);
}

// ---------- load a page from the API ----------

async function loadPage(page = 1) {
  const grid = document.querySelector("#auctions-grid");
  if (!grid) return;

  renderSkeletons(6);

  try {
    const { data, meta } = await getActiveListings({ limit: 24, page });
    allListings = data;
    currentPage = meta?.currentPage ?? page;
    totalPages = meta?.pageCount ?? 1;

    applyFiltersAndRender();
    renderPagination();
  } catch (error) {
    console.error(error);
    grid.innerHTML = `<p class="text-danger small">
      Could not load auctions. Please try again later.
    </p>`;
    const paginationContainer = document.querySelector("#auctions-pagination");
    if (paginationContainer) {
      paginationContainer.innerHTML = "";
    }
  }
}

// ---------- init ----------

async function initAuctionsPage() {
  await loadPage(1);

  const form = document.querySelector("#auctionSearchForm");
  const input = document.querySelector("#auctionSearch");
  const clearBtn = document.querySelector("#clearSearch");
  const sortSelect = document.querySelector("#sortSelect");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFiltersAndRender();
    });
  }

  if (input) {
    input.addEventListener("input", () => {
      applyFiltersAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applyFiltersAndRender();
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      applyFiltersAndRender();
    });
  }

  setupPaginationEvents();
}

document.addEventListener("DOMContentLoaded", initAuctionsPage);
