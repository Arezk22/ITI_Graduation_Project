// Evaluation service: business logic for the Evaluation page (trust score,
// contractor lookup, bid-price chart shaping). Keeps the page component
// presentational, mirroring how reportService backs the Reports page.
import { contractorName } from "./reportService";

// Silent re-fetch interval while the AI analysis is still processing.
export const PROCESSING_POLL_MS = 15000;

export function getContractorId(submission) {
  return (
    submission.contractor_id ||
    submission.contractor?.id ||
    submission.contractor ||
    submission.user?.id ||
    submission.id
  );
}

// Trust = inverse of the AI risk score (higher is better).
// A missing risk score means no trust can be established.
export function trustScore(sub) {
  const provided =
    sub.risk_score !== null &&
    sub.risk_score !== undefined &&
    sub.risk_score !== "";
  const risk = Number(sub.risk_score);

  if (!provided || !Number.isFinite(risk)) return "—";

  return `${Math.round(100 - risk)}`;
}

/* ------------------------------------------------------------------ */
/* Bid price chart                                                     */
/* ------------------------------------------------------------------ */

export function buildBidChartData(submissions) {
  return submissions
    .map((sub) => ({
      name: contractorName(sub),
      price: Number(sub.financial_result?.total_bid_price || 0),
    }))
    .filter((item) => item.price > 0);
}

export function getBidBarHeight(price, allItems) {
  if (!price || Number(price) <= 0) return 2;

  const maxPrice = Math.max(...allItems.map((item) => Number(item.price || 0)));

  if (!maxPrice) return 2;

  return Math.max((Number(price) / maxPrice) * 100, 4);
}

export function shortName(name) {
  if (!name) return "—";

  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 1) return parts[0];

  return parts.slice(0, 2).join(" ");
}

export function getPriceAxisLabels(chartSubmissions) {
  if (chartSubmissions.length === 0) {
    return [formatAxisPrice(0)];
  }

  const maxPrice = Math.max(...chartSubmissions.map((item) => item.price));

  if (maxPrice === 0) {
    return [formatAxisPrice(0)];
  }

  const labels = [];
  const step = maxPrice / 5;

  for (let i = 5; i >= 0; i--) {
    const value = Math.round(step * i);
    labels.push(formatAxisPrice(value));
  }

  return labels;
}

// Compact EGP labels for the chart axis (matches the table's currency).
export function formatAxisPrice(value) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}
