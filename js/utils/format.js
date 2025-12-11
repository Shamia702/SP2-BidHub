// js/utils/format.js

export function getHighestBidAmount(listing) {
  const bids = listing.bids || [];
  if (!bids.length) return 0;
  return bids.reduce(
    (max, bid) => (bid.amount > max ? bid.amount : max),
    0
  );
}

export function formatEndsAt(isoString) {
  if (!isoString) return "No end date";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "No end date";

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatTimeRemaining(isoString) {
  if (!isoString) return "No end time";
  const now = new Date();
  const end = new Date(isoString);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Ended";

  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours <= 0) return `Ends in ${minutes} min`;
  return `Ends in ${hours}h ${minutes}m`;
}
