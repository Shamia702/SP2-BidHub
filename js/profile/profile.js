import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken, updateUser } from "../utils/storage.js";
import { renderHeader } from "../components/header.js";
import { formatTimeRemaining } from "../utils/format.js";

function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = "/auth/login.html";
    return null;
  }
  return user;
}

function getAvatarUrlFromProfile(profile) {
  if (profile.avatar && typeof profile.avatar === "string") {
    return profile.avatar;
  }
  if (profile.avatar && typeof profile.avatar === "object") {
    return profile.avatar.url || null;
  }
  return null;
}

function getBannerUrlFromProfile(profile) {
  if (profile.banner && typeof profile.banner === "string") {
    return profile.banner;
  }
  if (profile.banner && typeof profile.banner === "object") {
    return profile.banner.url || null;
  }
  return null;
}

function getThumbnailFromListing(listing) {
  const media = Array.isArray(listing?.media) ? listing.media : [];
  const img = media[0] || null;
  if (!img || !img.url) return null;
  return img;
}

function getRecentListing(listings) {
  if (!Array.isArray(listings) || !listings.length) return null;
  return listings
    .slice()
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];
}

function getLatestBid(bids) {
  if (!Array.isArray(bids) || !bids.length) return null;
  return bids
    .slice()
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];
}

async function fetchProfile(name) {
  const token = getToken();

  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(name)}?_listings=true`,
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
      json?.errors?.[0]?.message || "Could not load profile details."
    );
  }

  return json.data;
}

async function fetchProfileBids(name) {
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

function renderProfileHeader(profile) {
  const container = document.querySelector("#profile-header");
  if (!container) return;

  const avatarUrl = getAvatarUrlFromProfile(profile);
  const bannerUrl = getBannerUrlFromProfile(profile);
  const initials = profile.name?.[0]?.toUpperCase() || "U";
  const credits =
    typeof profile.credits === "number" ? profile.credits : 0;

  const bannerStyle = bannerUrl
    ? `style="background-image:url('${bannerUrl}');"`
    : "";

    container.innerHTML = `
    <article class="bh-card p-0 bh-profile-header-card">
      <div class="bh-profile-banner" ${bannerStyle}></div>
      <div class="bh-profile-header-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <!-- Left: avatar + text -->
          <div class="d-flex align-items-center gap-3">
            <div class="bh-profile-avatar-wrap">
              <div class="bh-avatar-lg">
                ${
                  avatarUrl
                    ? `<img src="${avatarUrl}" alt="${profile.name}'s avatar" />`
                    : initials
                }
              </div>
            </div>
            <div>
              <h2 class="h5 mb-1">${profile.name}</h2>
              <p class="text-muted small mb-1">
                ${profile.email || ""}
              </p>
              <p class="small mb-0">
                <strong>${credits}</strong> credits available
              </p>
            </div>
          </div>

          <!-- Right: Edit profile button -->
          <a href="/profile/edit-profile.html" class="bh-btn-outline btn-sm">
            Edit profile
          </a>
        </div>
      </div>
    </article>
  `;

  }

function renderProfileBio(profile) {
  const container = document.querySelector("#profile-bio");
  if (!container) return;

  const bioText = profile.bio || "No bio added yet.";

  container.innerHTML = `
    <article class="bh-card p-3 p-lg-4">
      <h2 class="h6 mb-2">About</h2>
      <p class="text-muted small mb-0">
        ${bioText}
      </p>
    </article>
  `;
}

function renderProfileSummary(profile, bids) {
  const container = document.querySelector("#profile-summary");
  if (!container) return;

  const listings = Array.isArray(profile.listings) ? profile.listings : [];
  const totalListings = listings.length;
  const totalBids = Array.isArray(bids) ? bids.length : 0;
  const credits =
    typeof profile.credits === "number" ? profile.credits : 0;

  container.innerHTML = `
    <article class="bh-card p-3 p-lg-4">
      <h2 class="h6 mb-2">Summary</h2>

      <div class="mb-2 small">
        <div class="d-flex justify-content-between">
          <span>Credits</span>
          <strong>${credits}</strong>
        </div>
        <div class="d-flex justify-content-between">
          <span>Total listings</span>
          <strong>${totalListings}</strong>
        </div>
        <div class="d-flex justify-content-between">
          <span>Total bids</span>
          <strong>${totalBids}</strong>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-2">
       <a href="/auction/create-listing.html" class="bh-btn-primary">
            Create listing
          </a>
        <a href="/profile/my-listings.html" class="bh-btn-outline btn-sm">
          My listings
        </a>
        <a href="/profile/my-bids.html" class="bh-btn-outline btn-sm">
          My bids
        </a>
      </div>
    </article>
  `;
}

function renderProfileActivity(profile, bids) {
  const container = document.querySelector("#profile-activity");
  if (!container) return;

  const listings = Array.isArray(profile.listings) ? profile.listings : [];
  const recentListing = getRecentListing(listings);
  const recentBid = getLatestBid(bids);

  const getBidListingTitle = (bid) => {
    if (!bid) return "";
    if (bid.listing && bid.listing.title) return bid.listing.title;
    if (bid.listingTitle) return bid.listingTitle;
    return "Listing";
  };

  const getBidListingThumb = (bid) => {
    if (!bid || !bid.listing) return null;
    return getThumbnailFromListing(bid.listing);
  };

  container.innerHTML = `
    <div class="d-flex flex-column gap-3">
      <!-- Recent listing -->
      <article class="bh-card p-3 p-lg-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h2 class="h6 mb-0">Recent listing</h2>
            <p class="text-muted small mb-0">
              Your latest item on BidHub.
            </p>
          </div>
          <a href="/profile/my-listings.html" class="bh-link-muted small">
            View all →
          </a>
        </div>

        ${
          recentListing
            ? (() => {
                const thumb = getThumbnailFromListing(recentListing);
                const endsText = recentListing.endsAt
                  ? formatTimeRemaining(recentListing.endsAt)
                  : "No end time";

                return `
                  <div class="bh-profile-item-row mt-2">
                    <div class="bh-profile-thumb">
                      ${
                        thumb
                          ? `<img src="${thumb.url}" alt="${thumb.alt || recentListing.title || "Listing image"}" class="img-fluid w-100 h-100" style="object-fit:cover;" />`
                          : `<span class="small">Image</span>`
                      }
                    </div>
                    <div>
                      <p class="mb-1 small">
                        <a
                          href="/auction/listing.html?id=${recentListing.id}"
                          class="bh-link-muted"
                        >
                          <strong>${recentListing.title}</strong>
                        </a>
                      </p>
                      <p class="text-muted small mb-0">
                        ${endsText}
                      </p>
                    </div>
                  </div>
                `;
              })()
            : `
              <p class="text-muted small mb-0 mt-2">
                You haven't created any listings yet.
              </p>
            `
        }
      </article>

      <article class="bh-card p-3 p-lg-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h2 class="h6 mb-0">Recent bid</h2>
            <p class="text-muted small mb-0">
              The last auction you bid on.
            </p>
          </div>
          <a href="/profile/my-bids.html" class="bh-link-muted small">
            View all →
          </a>
        </div>

        ${
          recentBid
            ? (() => {
                const thumb = getBidListingThumb(recentBid);
                const listingTitle = getBidListingTitle(recentBid);
                const listingId =
                  recentBid.listing?.id || recentBid.listingId;
                const endsAt =
                  recentBid.listing?.endsAt || null;
                const timeText = endsAt
                  ? formatTimeRemaining(endsAt)
                  : "No end time";

                return `
                  <div class="bh-profile-item-row mt-2">
                    <div class="bh-profile-thumb">
                      ${
                        thumb
                          ? `<img src="${thumb.url}" alt="${thumb.alt || listingTitle || "Listing image"}" class="img-fluid w-100 h-100" style="object-fit:cover;" />`
                          : `<span class="small">Image</span>`
                      }
                    </div>
                    <div>
                      <p class="mb-1 small">
                        ${
                          listingId
                            ? `<a href="/auction/listing.html?id=${listingId}" class="bh-link-muted">
                                 <strong>${listingTitle}</strong>
                               </a>`
                            : `<strong>${listingTitle}</strong>`
                        }
                      </p>
                      <p class="text-muted small mb-0">
                        Your bid: ${recentBid.amount} credits
                        ${
                          endsAt
                            ? ` · <span class="bh-countdown" data-ends-at="${endsAt}">
                                  ${timeText}
                                </span>`
                            : ""
                        }
                      </p>
                    </div>
                  </div>
                `;
              })()
            : `
              <p class="text-muted small mb-0 mt-2">
                You haven't placed any bids yet.
              </p>
            `
        }
      </article>
    </div>
  `;
}

async function loadProfile() {
  const user = requireAuth();
  if (!user) return;

  try {
    const [profile, bids] = await Promise.all([
      fetchProfile(user.name),
      fetchProfileBids(user.name),
    ]);
    updateUser({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      banner: profile.banner,
      credits: profile.credits,
      bio: profile.bio,
    });

    renderHeader();

    renderProfileHeader(profile);
    renderProfileBio(profile);
    renderProfileSummary(profile, bids);
    renderProfileActivity(profile, bids);
  } catch (error) {
    console.error(error);

    const headerSection = document.querySelector("#profile-header");
    if (headerSection) {
      headerSection.innerHTML = `
        <div class="alert alert-danger" role="alert">
          ${error.message}
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
