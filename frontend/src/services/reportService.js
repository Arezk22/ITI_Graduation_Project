// Report service: fetches a tender evaluation (via axios) and shapes it into a
// ready-to-render report. Keeps all business logic (ranking, pros/cons,
// formatting) out of the Reports page component.
import { getTenderEvaluation } from "./tenderApi";

/**
 * Fetch the evaluation for a tender and return a fully shaped report object:
 * { status, isCompleted, message, tender, submissions (ranked + pros/cons), winner }
 */
export async function fetchTenderReport(tenderId) {
  const { data } = await getTenderEvaluation(tenderId);
  return buildTenderReport(data);
}

/** Shape a raw /evaluate payload into the report model used by the UI. */
export function buildTenderReport(data) {
  const status = data?.status || null;
  const isCompleted = status === "completed";

  const submissions =
    isCompleted && Array.isArray(data?.submissions)
      ? data.submissions
          .map((sub) => ({ ...sub, ...deriveProsCons(sub) }))
          .sort(compareSubmissions)
      : [];

  return {
    status,
    isCompleted,
    message: data?.message || "",
    tender: data?.tender || null,
    submissions,
    winner: submissions[0] || null,
  };
}

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

// Build pros/cons lists for a submission from the AI result blocks.
export function deriveProsCons(sub) {
  const tech = asObject(sub.technical_result);
  const fin = asObject(sub.financial_result);
  const risk = asObject(sub.risk_result);
  const val = asObject(sub.validation_result);

  const pros = [];
  const cons = [];

  arr(tech.strengths).forEach((s) => pros.push(s));
  arr(fin.strengths).forEach((s) => pros.push(s));
  if (fin.budget_compliance === true) pros.push("Bid is within the tender budget.");

  arr(tech.weaknesses).forEach((w) => cons.push(w));
  arr(fin.weaknesses).forEach((w) => cons.push(w));
  if (fin.budget_compliance === false) cons.push("Bid exceeds the tender budget.");
  arr(risk.top_risks).forEach((r) => cons.push(`Risk: ${r}`));

  arr(val.missing_documents).forEach((d) => cons.push(`Missing document: ${d}`));
  arr(val.missing_certificates).forEach((c) =>
    cons.push(`Missing certificate: ${c}`),
  );
  arr(val.missing_licenses).forEach((l) => cons.push(`Missing license: ${l}`));
  arr(val.technical_gaps).forEach((g) => cons.push(`Technical gap: ${g}`));

  return {
    pros: dedupe(pros),
    cons: dedupe(cons),
    technical_result: tech,
    financial_result: fin,
    risk_result: risk,
    validation_result: val,
    _mandatoryPassed: val.mandatory_passed !== false,
  };
}

// Best -> worst ordering: disqualified last, then by overall/final score,
// then by explicit rank as a tiebreaker.
export function compareSubmissions(a, b) {
  if (a._mandatoryPassed !== b._mandatoryPassed) {
    return a._mandatoryPassed ? -1 : 1;
  }

  const scoreA = Number(a.final_score);
  const scoreB = Number(b.final_score);
  const hasA = Number.isFinite(scoreA);
  const hasB = Number.isFinite(scoreB);
  if (hasA && hasB && scoreA !== scoreB) return scoreB - scoreA;
  if (hasA !== hasB) return hasA ? -1 : 1;

  const rankA = Number(a.rank);
  const rankB = Number(b.rank);
  if (Number.isFinite(rankA) && Number.isFinite(rankB)) return rankA - rankB;

  return 0;
}

export function contractorName(sub) {
  return (
    sub.contractor_company_name ||
    (sub.contractor ? `Contractor #${sub.contractor}` : "Unknown contractor")
  );
}

export function recommendationText(sub) {
  return (
    sub.recommendation || (sub._mandatoryPassed ? "Acceptable" : "Disqualified")
  );
}

/* ------------------------------------------------------------------ */
/* Formatting + tone helpers                                          */
/* ------------------------------------------------------------------ */

export function formatScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}`;
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "—";
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function scoreTone(score, invert = false) {
  const s = invert ? 100 - score : score;
  if (s >= 75) return "good";
  if (s >= 50) return "mid";
  return "bad";
}

export function riskTone(level) {
  const l = String(level).toLowerCase();
  if (l.includes("very low") || l === "low") return "good";
  if (l.includes("moderate")) return "mid";
  return "bad";
}

export function recommendationTone(level) {
  const l = String(level).toLowerCase();
  if (l.includes("highly") || l === "recommended") return "good";
  if (l.includes("acceptable")) return "mid";
  return "bad";
}

export function formatTenderId(id) {
  return `T-${String(id).padStart(4, "0")}`;
}

export function formatCategory(category) {
  const map = {
    construction: "Construction",
    roads: "Roads & Infrastructure",
    buildings: "Buildings",
    electrical: "Electrical",
    mechanical: "Mechanical",
    water: "Water & Sewage",
    it: "IT & Telecom",
    consulting: "Consulting",
    supplies: "Supplies & Procurement",
    maintenance: "Maintenance",
    other: "Other",
  };

  return map[category] || category || "Other";
}

/* ------------------------------------------------------------------ */
/* Internal utilities                                                 */
/* ------------------------------------------------------------------ */

function asObject(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) || {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? value : {};
}

function arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function dedupe(list) {
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
}
