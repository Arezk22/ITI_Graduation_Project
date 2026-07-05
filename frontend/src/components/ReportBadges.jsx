// Shared report UI: status banner + risk/recommendation pills.
// Used by the Reports page and the Evaluation page so both render
// evaluation states and tones identically.
import {
  formatScore,
  recommendationText,
  recommendationTone,
  riskTone,
} from "../services/reportService";

export function RiskPill({ sub }) {
  const level = sub.risk_result?.overall_risk;

  // No risk level: fall back to the numeric score, or — when not provided.
  if (!level) {
    const provided =
      sub.risk_score !== null &&
      sub.risk_score !== undefined &&
      sub.risk_score !== "";
    return <span>{provided ? formatScore(sub.risk_score) : "—"}</span>;
  }

  return <span className={`rp-pill ${riskTone(level)}`}>{level}</span>;
}

export function RecommendationPill({ sub }) {
  const level = recommendationText(sub);
  return <span className={`rp-pill ${recommendationTone(level)}`}>{level}</span>;
}

export function StatusBanner({ status, message }) {
  const map = {
    pending: {
      icon: "bi-hourglass",
      cls: "pending",
      text: message || "Analysis has not started yet.",
    },
    processing: {
      icon: "bi-arrow-repeat",
      cls: "processing",
      text: message || "Analysis is in progress. Check back shortly.",
    },
    failed: {
      icon: "bi-x-octagon",
      cls: "error",
      text: message || "Analysis failed for this tender.",
    },
    "Invalid Documents": {
      icon: "bi-file-earmark-break",
      cls: "warning",
      text:
        message ||
        "One or more uploaded documents had low extraction confidence. Please re-upload clearer files.",
    },
  };
  const cfg = map[status] || {
    icon: "bi-info-circle",
    cls: "pending",
    text: message || "Report is not available yet.",
  };

  return (
    <div className={`report-state-banner ${cfg.cls}`}>
      <i className={`bi ${cfg.icon}`}></i>
      {cfg.text}
    </div>
  );
}
