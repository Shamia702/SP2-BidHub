import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { getUser } from "./utils/storage.js";
import { formatTimeRemaining } from "./utils/format.js";

function updateCountdowns() {
  const elements = document.querySelectorAll(".bh-countdown");

  elements.forEach((el) => {
    const iso = el.getAttribute("data-ends-at");
    if (!iso) return;
    el.textContent = formatTimeRemaining(iso);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();

  const user = getUser();
  console.log("Current user object:", user);
  
  updateCountdowns();
  setInterval(updateCountdowns, 60_000);
});
