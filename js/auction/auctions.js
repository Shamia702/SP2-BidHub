import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser } from "../utils/storage.js";
import { formatTimeRemaining } from "../utils/format.js";

const PAGE_SIZE = 9;

let allListings = [];
let filteredListings = [];
let currentPage = 1;
let currentSearch = "";
let currentSort = "newest";

const gridEl = document.querySelector("#auctions-grid");
const paginationEl = document.querySelector("#auctions-pagination");
const searchForm = document.querySelector("#auctionSearchForm");
const searchInput = document.querySelector("#auctionSearch");
const clearBtn = document.querySelector("#clearSearch");
const sortSelect = document.querySelector("#sortSelect");
const createListingBtn = document.querySelector("#createListingBtn");
const suggestionsEl = document.querySelector("#auctionSearchSuggestions");

function showSkeletons(count = PAGE_SIZE) {
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
  if (paginationEl) paginationEl.innerHTML = "";
}

function getHighestBid(listing) {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  if (!bids.length) return 0;
  return bids.reduce(
    (max, bid) => (bid.amount > max ? bid.amount : max),
    0
  );
}

function buildCard(listing) {
  const images = Array.isArray(listing.media) ? listing.media : [];
  const mainImage = images[0] || null;
  const highestBid = getHighestBid(listing);

  const timeText = listing.endsAt
    ? formatTimeRemaining(listing.endsAt)
    : "No end time";

  return `
    <div class="col-md-6 col-lg-4">
      <article class="bh-card h-100 d-flex flex-column p-3">
        <div class="mb-3">
          ${
            mainImage && mainImage.url
              ? `<img src="${mainImage.url}" alt="${mainImage.alt || listing.title || "Listing image"}" class="img-fluid rounded-3 w-100" style="max-height: 180px; object-fit: cover;" />`
              : `<div class="bh-skeleton-thumb mb-0"></div>`
          }
        </div>
        <h2 class="h6 mb-1">${listing.title}</h2>
        <p class="text-muted small mb-2">
          Current bid: <strong>${highestBid} credits</strong>
        </p>
        <p class="text-muted small mb-3">
          <span class="bh-countdown" data-ends-at="${listing.endsAt || ""}">
            ${timeText}
          </span>
        </p>
        <div class="mt-auto">
          <a
            href="/auction/single-listing-page.html?id=${listing.id}"
            class="bh-btn-primary btn-sm w-100 text-center"
          >
            View listing
          </a>
        </div>
      </article>
    </div>
  `;
}

function renderListingsPage(page = 1) {
  if (!gridEl) return;

  if (!filteredListings.length) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light text-center mb-0" role="alert">
          No auctions found. Try a different search or clear your filters.
        </div>
      </div>
    `;
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }

  const total = filteredListings.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (page > totalPages) page = totalPages || 1;
  currentPage = page;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageListings = filteredListings.slice(start, end);

  gridEl.innerHTML = pageListings.map(buildCard).join("");

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (!paginationEl) return;
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  const prevDisabled = currentPage === 1 ? "disabled" : "";
  const nextDisabled = currentPage === totalPages ? "disabled" : "";

  paginationEl.innerHTML = `
    <ul class="pagination justify-content-center mb-0">
      <li class="page-item ${prevDisabled}">
        <button class="page-link" type="button" data-page="${
          currentPage - 1
        }">Previous</button>
      </li>
      <li class="page-item disabled">
        <span class="page-link">
          Page ${currentPage} of ${totalPages}
        </span>
      </li>
      <li class="page-item ${nextDisabled}">
        <button class="page-link" type="button" data-page="${
          currentPage + 1
        }">Next</button>
      </li>
    </ul>
  `;

  paginationEl
    .querySelectorAll("button[data-page]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        if (!Number.isNaN(page)) {
          renderListingsPage(page);
        }
      });
    });
}

function applyFilters() {
  let list = [...allListings];

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return title.includes(q) || desc.includes(q);
    });
  }

  list.sort((a, b) => {
    if (currentSort === "endingSoon") {
      const aTime = a.endsAt ? new Date(a.endsAt) : new Date(8640000000000000);
      const bTime = b.endsAt ? new Date(b.endsAt) : new Date(8640000000000000);
      return aTime - bTime;
    }

    if (currentSort === "mostBids") {
      const aBids = Array.isArray(a.bids) ? a.bids.length : 0;
      const bBids = Array.isArray(b.bids) ? b.bids.length : 0;
      return bBids - aBids;
    }

    const aCreated = a.created ? new Date(a.created) : 0;
    const bCreated = b.created ? new Date(b.created) : 0;
    return bCreated - aCreated;
  });

  filteredListings = list;
}

function clearSuggestions() {
  if (!suggestionsEl) return;
  suggestionsEl.innerHTML = "";
  suggestionsEl.style.display = "none";
}

function updateSuggestions(term) {
  if (!suggestionsEl) return;

  const q = term.trim().toLowerCase();
  if (!q) {
    clearSuggestions();
    return;
  }

  const matches = allListings
    .filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return title.includes(q) || desc.includes(q);
    })
    .slice(0, 6); 

  if (!matches.length) {
    clearSuggestions();
    return;
  }

  const markup = `
    <ul class="bh-search-suggestions-list">
      ${matches
        .map((item) => {
          const images = Array.isArray(item.media) ? item.media : [];
          const img = images[0] || null;
          const timeText = item.endsAt
            ? formatTimeRemaining(item.endsAt)
            : "No end time";
          const bidsCount = Array.isArray(item.bids)
            ? item.bids.length
            : 0;

          return `
            <li class="bh-search-suggestion-card" data-id="${item.id}">
              <div class="bh-search-suggestion-thumb">
                ${
                  img && img.url
                    ? `<img src="${img.url}" alt="${img.alt || item.title || "Listing image"}" />`
                    : `<span>Image</span>`
                }
              </div>
              <div class="bh-search-suggestion-body">
                <div class="bh-search-suggestion-title">
                  ${item.title}
                </div>
                <div class="bh-search-suggestion-meta">
                  ${timeText} · ${bidsCount} bid${bidsCount === 1 ? "" : "s"}
                </div>
              </div>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;

  suggestionsEl.innerHTML = markup;
  suggestionsEl.style.display = "block";
  suggestionsEl
    .querySelectorAll(".bh-search-suggestion-card")
    .forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        if (id) {
          window.location.href = `/auction/single-listing-page.html?id=${id}`;
        }
      });
    });
}

async function fetchAllListings() {
  const url = `${AUCTION_URL}/listings?_active=true&_bids=true&limit=100`;

  const res = await fetch(url, {
    headers: {
      "X-Noroff-API-Key": API_KEY,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load auctions."
    );
  }

  return json.data || [];
}

async function initAuctionsPage() {
  const user = getUser();
  if (createListingBtn && user) {
    createListingBtn.classList.remove("d-none");
  }

  showSkeletons();

  try {
    allListings = await fetchAllListings();
    applyFilters();
    renderListingsPage(1);
  } catch (error) {
    console.error(error);
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            ${error.message}
          </div>
        </div>
      `;
    }
    if (paginationEl) paginationEl.innerHTML = "";
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      currentSearch = searchInput?.value.trim() || "";
      currentPage = 1;
      applyFilters();
      renderListingsPage(1);
      clearSuggestions();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value;
      updateSuggestions(term);
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        clearSuggestions();
      }, 150);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      currentSearch = "";
      currentPage = 1;
      applyFilters();
      renderListingsPage(1);
      clearSuggestions();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;
      currentPage = 1;
      applyFilters();
      renderListingsPage(1);
    });
  }

  document.addEventListener("click", (event) => {
    if (
      !suggestionsEl ||
      !searchInput ||
      suggestionsEl.contains(event.target) ||
      searchInput.contains(event.target)
    ) {
      return;
    }
    clearSuggestions();
  });
}

document.addEventListener("DOMContentLoaded", initAuctionsPage);
