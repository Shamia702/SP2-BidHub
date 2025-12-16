import { AUCTION_URL } from "./config.js";
export async function getListingById(id) {
  const url = new URL(`${AUCTION_URL}/listings/${id}`);
  url.searchParams.set("_bids", "true");
  url.searchParams.set("_seller", "true");

  const res = await fetch(url.href);
  const json = await res.json();

  if (!res.ok) {
    const message = json?.errors?.[0]?.message || "Failed to fetch listing";
    throw new Error(message);
  }

  return json.data;
}
export async function getActiveListings({ limit = 24, page = 1 } = {}) {
  const url = new URL(`${AUCTION_URL}/listings`);
  url.searchParams.set("_active", "true");
  url.searchParams.set("_bids", "true");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.href);
  const json = await res.json();

  if (!res.ok) {
    const message = json?.errors?.[0]?.message || "Failed to fetch listings";
    throw new Error(message);
  }

  return {
    data: json.data,
    meta: json.meta || {},
  };
}
export async function getFeaturedListings(limit = 4) {
  const { data } = await getActiveListings({ limit, page: 1 });
  return data;
}
