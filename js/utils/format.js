export function getHighestBidAmount(listing) {
  const bids = listing.bids || [];
  if (!bids.length) return 0;
  return bids.reduce((max, bid) => (bid.amount > max ? bid.amount : max), 0);
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

export function formatTimeRemaining(iso) {
  if (!iso) return "No end time";

  const end = new Date(iso);
  const now = new Date();

  if (Number.isNaN(end.getTime())) return "No end time";

  const diffMs = end - now;

  if (diffMs <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
