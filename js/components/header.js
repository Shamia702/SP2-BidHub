import { getUser, clearAuth } from "../utils/storage.js";

export function renderHeader() {
  const header = document.querySelector("#site-header");
  if (!header) return;

  const user = getUser();
  if (!user) {
    header.innerHTML = `
      <nav class="navbar navbar-expand-lg bh-navbar fixed-top">
        <div class="container">
          <a
            href="/index.html"
            class="navbar-brand d-flex align-items-center bh-navbar-logo"
          >
            <img
              src="/images/bidhub_logo_transparent.png"
              alt="BidHub logo"
              class="bh-logo-img me-2"
            />
            <span class="visually-hidden">BidHub</span>
          </a>

          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="mainNavbar">
            <!-- Center nav links -->
            <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
              <li class="nav-item">
                <a href="/index.html" class="nav-link bh-nav-link">Home</a>
              </li>
              <li class="nav-item">
                <a href="/auction/auctions.html" class="nav-link bh-nav-link">
                  Auctions
                </a>
              </li>
            </ul>

            <div class="d-flex align-items-center gap-2">
              <a href="/auth/login.html" class="bh-btn-outline">Login</a>
              <a href="/auth/register.html" class="bh-btn-primary">Register</a>
            </div>
          </div>
        </div>
      </nav>
    `;
    return;
  }

 const credits = user.credits ?? 0;
const name = user.name ?? "User";

const avatarUrl =
  (user.avatar && typeof user.avatar === "string" && user.avatar) ||
  (user.avatar && typeof user.avatar === "object" && user.avatar.url) ||
  null;

const initials = name?.[0]?.toUpperCase() || "U";


  header.innerHTML = `
    <nav class="navbar navbar-expand-lg bh-navbar fixed-top">
      <div class="container">
        <a
          href="/auction/auctions.html"
          class="navbar-brand d-flex align-items-center bh-navbar-logo"
        >
          <img
            src="/images/bidhub_logo_transparent.png"
            alt="BidHub logo"
            class="bh-logo-img me-2"
          />
          <span class="visually-hidden">BidHub</span>
        </a>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
          <!-- Center nav links -->
          <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-3">
            <li class="nav-item">
              <a href="/auction/auctions.html" class="nav-link bh-nav-link">
                Auctions
              </a>
            </li>
            <li class="nav-item">
              <a href="/profile/my-listings.html" class="nav-link bh-nav-link">
                My listings
              </a>
            </li>
            <li class="nav-item">
              <a href="/profile/my-bids.html" class="nav-link bh-nav-link">
                My bids
              </a>
            </li>
          </ul>

          <!-- Right side: credits + user dropdown -->
          <div class="d-flex align-items-center gap-3">
            <span class="bh-credits text-sm">
              Credits: <strong>${credits}</strong>
            </span>

           <div class="dropdown">
  <button
    class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center"
    type="button"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    <span class="bh-avatar me-2">
      ${
        avatarUrl
          ? `<img src="${avatarUrl}" alt="${name}'s avatar" />`
          : initials
      }
    </span>
    <span class="d-none d-sm-inline">@${name}</span>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
    <li>
      <a class="dropdown-item" href="/profile/profile.html">Profile</a>
    </li>
    <li><hr class="dropdown-divider" /></li>
    <li>
      <button class="dropdown-item" id="bh-logout-btn">Logout</button>
    </li>
  </ul>
</div>

          </div>
        </div>
      </div>
    </nav>
  `;
  const logoutBtn = header.querySelector("#bh-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      clearAuth();
      window.location.href = "/index.html";
    });
  }
}
