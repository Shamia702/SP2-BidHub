// js/profile/profile.js
import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken, updateUser} from "../utils/storage.js";
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

async function fetchProfile(name) {
  const token = getToken();

  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(
      name
    )}?_listings=true&_bids=true`,
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

/* ---------- RENDER HEADER CARD ---------- */

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
        <div class="row align-items-center gy-3">
          <div class="col-md-8 d-flex align-items-center">
            <div class="bh-profile-avatar-wrap me-3">
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
                <strong>Credits: ${credits}</strong>
              </p>
            </div>
          </div>
          <div class="col-md-4 text-md-end">
            <a href="/profile/edit-profile.html" class="bh-btn-primary">
              Edit profile
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* ---------- RENDER BIO CARD ---------- */

function renderProfileBio(profile) {
  const container = document.querySelector("#profile-bio");
  if (!container) return;

  const bioText = profile.bio || "No bio added yet.";

  container.innerHTML = `
    <article class="bh-card p-3 p-lg-4">
      <h2 class="h6 mb-2">Bio</h2>
      <p class="text-muted small mb-0">
        ${bioText}
      </p>
    </article>
  `;
}

/* ---------- RENDER RECENT LISTING + BIDS (with Create listing button) ---------- */

function renderProfileActivity(profile) {
  const container = document.querySelector("#profile-activity");
  if (!container) return;

  const listings = Array.isArray(profile.listings) ? profile.listings : [];
  const bids = Array.isArray(profile.bids) ? profile.bids : [];

  const recentListing = listings
    .slice()
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];

  const recentBid = bids
    .slice()
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];

  const getBidListingTitle = (bid) => {
    if (!bid) return "";
    if (bid.listing && bid.listing.title) return bid.listing.title;
    if (bid.listingTitle) return bid.listingTitle;
    return "a listing";
  };

  container.innerHTML = `
    <div class="row gy-3">
      <!-- Recent listing -->
      <div class="col-12">
        <article class="bh-card p-3 p-lg-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h2 class="h6 mb-0">Recent listing</h2>
              <p class="text-muted small mb-0">
                A quick view of your latest listings.
              </p>
            </div>
            <div class="d-flex flex-column align-items-end gap-1">
              <a href="/profile/my-listings.html" class="bh-link-muted small">
                View all listings →
              </a>
              <a href="/auction/create-listing.html" class="bh-btn-primary btn-sm">
                Create listing
              </a>
            </div>
          </div>

          ${
            recentListing
              ? `
            <div class="bh-profile-item-row">
              <div class="bh-profile-thumb">
                <span class="small">Image</span>
              </div>
              <div>
                <p class="mb-1 small">
                  <a
                    href="/auction/single-listing-page.html?id=${recentListing.id}"
                    class="bh-link-muted"
                  >
                    <strong>${recentListing.title}</strong>
                  </a>
                </p>
                <p class="text-muted small mb-0">
                  ${
                    recentListing.endsAt
                      ? formatTimeRemaining(recentListing.endsAt)
                      : "No end time"
                  }
                </p>
              </div>
            </div>
          `
              : `
            <p class="text-muted small mb-0 mt-2">
              You haven't created any listings yet.
            </p>
          `
          }
        </article>
      </div>

      <!-- Recent bids -->
      <div class="col-12">
        <article class="bh-card p-3 p-lg-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h2 class="h6 mb-0">Recent bids</h2>
              <p class="text-muted small mb-0">
                Auctions you've recently bid on.
              </p>
            </div>
            <a href="/profile/my-bids.html" class="bh-link-muted small">
              View all bids →
            </a>
          </div>

          ${
            recentBid
              ? `
            <div class="bh-profile-item-row">
              <div class="bh-profile-thumb">
                <span class="small">Image</span>
              </div>
              <div>
                <p class="mb-1 small">
                  <strong>${getBidListingTitle(recentBid)}</strong>
                </p>
                <p class="text-muted small mb-0">
                  Your bid: ${recentBid.amount} credits
                </p>
              </div>
            </div>
          `
              : `
            <p class="text-muted small mb-0 mt-2">
              You haven't placed any bids yet.
            </p>
          `
          }
        </article>
      </div>
    </div>
  `;
}

/* ---------- LOAD PROFILE ---------- */

async function loadProfile() {
  const user = requireAuth();
  if (!user) return;

  try {
    const profile = await fetchProfile(user.name);

    // 1) sync localStorage with the fresh profile data
    updateUser({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      banner: profile.banner,
      credits: profile.credits,
      bio: profile.bio,
    });

    // 2) re-render header so credits update immediately
    renderHeader();

    // 3) render the profile cards
    renderProfileHeader(profile);
    renderProfileBio(profile);
    renderProfileActivity(profile);
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
    const bioSection = document.querySelector("#profile-bio");
    if (bioSection) bioSection.innerHTML = "";
    const activitySection = document.querySelector("#profile-activity");
    if (activitySection) activitySection.innerHTML = "";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
