import { getUser } from "../utils/storage.js";

export function renderFooter() {
  const footer = document.querySelector("#site-footer");
  if (!footer) return;

  const user = getUser();
  const isLoggedIn = !!user;
  const accountLinks = isLoggedIn
    ? `
      <li><a class="bh-footer-link" href="/profile/profile.html">Profile</a></li>
      <li><a class="bh-footer-link" href="/profile/my-listings.html">My listings</a></li>
      <li><a class="bh-footer-link" href="/profile/my-bids.html">My bids</a></li>
    `
    : `
      <li><a class="bh-footer-link" href="/auth/login.html">Log in</a></li>
      <li><a class="bh-footer-link" href="/auth/register.html">Register</a></li>
    `;

  footer.innerHTML = `
    <div class="container py-4">
      <div class="row gy-4 pb-2">
        <!-- Brand -->
        <div class="col-md-3">
          <h2 class="h5 mb-2 bh-footer-title">BidHub</h2>
          <p class="small mb-0 bh-footer-text">
            A student-focused auction platform for buying and selling with
            credits.
          </p>
        </div>

        <div class="col-md-3">
          <h3 class="small text-uppercase mb-2 bh-footer-title">Explore</h3>
          <ul class="list-unstyled small mb-0">
            <li><a class="bh-footer-link" href="/auction/auctions.html">Auctions</a></li>
          </ul>
        </div>

        <div class="col-md-3">
          <h3 class="small text-uppercase mb-2 bh-footer-title">Account</h3>
          <ul class="list-unstyled small mb-0">
            ${accountLinks}
          </ul>
        </div>

        <div class="col-md-3">
          <h3 class="small text-uppercase mb-2 bh-footer-title">Help</h3>
          <ul class="list-unstyled small mb-0">
            <li><a class="bh-footer-link" href="#">Support</a></li>
            <li><a class="bh-footer-link" href="#">Terms</a></li>
            <li><a class="bh-footer-link" href="#">Privacy</a></li>
          </ul>
        </div>
      </div>

      <p class="small mb-0 bh-footer-text">© 2025 BidHub.</p>
    </div>
  `;
}
