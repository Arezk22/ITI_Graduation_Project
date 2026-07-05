// AI Analysis service: derives everything the AI Analysis & Risk Center page
// shows (metrics, validation rows, flagged risks, missing documents, decision
// cards) from the shaped evaluation report. Keeps the page presentational,
// mirroring how reportService backs the Reports page.
import { contractorName, formatScore } from "./reportService";

const RISK_ORDER = {
  "very low": 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

function riskLevel(sub) {
  return String(sub.risk_result?.overall_risk || "").toLowerCase();
}

function arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

/**
 * Build the full AI Analysis view model from ranked submissions
 * (report.submissions from reportService, already parsed and sorted).
 */
export function buildAiAnalysis(submissions) {
  const missingDocAlerts = buildMissingDocAlerts(submissions);
  const needReviewSubmissions = submissions.filter((sub) => sub.need_review);

  return {
    metrics: buildMetrics(submissions, missingDocAlerts, needReviewSubmissions),
    validationRows: buildValidationRows(submissions),
    riskIssues: buildRiskIssues(submissions),
    missingDocAlerts,
    needReviewSubmissions,
    decisions: buildDecisions(submissions, missingDocAlerts),
  };
}

/* ------------------------------------------------------------------ */
/* Metrics row                                                         */
/* ------------------------------------------------------------------ */

function buildMetrics(submissions, missingDocAlerts, needReviewSubmissions) {
  const total = submissions.length;
  const passed = submissions.filter((sub) => sub._mandatoryPassed).length;

  const criticalFlags = submissions.filter((sub) =>
    ["high", "critical"].includes(riskLevel(sub)),
  ).length;

  const mediumRisks = submissions.filter(
    (sub) => riskLevel(sub) === "moderate",
  ).length;

  const missingDocuments = missingDocAlerts.reduce(
    (sum, alert) => sum + alert.items.length,
    0,
  );

  return {
    validationChecks: {
      value: `${passed}/${total}`,
      note:
        passed === total
          ? "All mandatory checks passed"
          : `${total - passed} failed mandatory checks`,
      color: passed === total ? "green" : "red",
    },
    criticalFlags: {
      value: criticalFlags,
      note: criticalFlags > 0 ? "Requires action" : "None detected",
      color: criticalFlags > 0 ? "red" : "green",
    },
    mediumRisks: {
      value: mediumRisks,
      note: mediumRisks > 0 ? "Monitor closely" : "None detected",
      color: "orange",
    },
    missingDocuments: {
      value: missingDocuments,
      note:
        missingDocAlerts.length > 0
          ? `Across ${missingDocAlerts.length} contractor${
              missingDocAlerts.length > 1 ? "s" : ""
            }`
          : "All documents provided",
      color: "purple",
    },
    needReview: {
      value: needReviewSubmissions.length,
      note:
        needReviewSubmissions.length > 0
          ? "Manual review required"
          : "Nothing flagged",
      color: "blue",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Automated validation results (one row per contractor)               */
/* ------------------------------------------------------------------ */

function buildValidationRows(submissions) {
  return submissions.map((sub) => {
    const val = sub.validation_result || {};
    const failed = val.mandatory_passed === false;
    const warnings = arr(val.warnings);
    const missingCount =
      arr(val.missing_documents).length +
      arr(val.missing_certificates).length +
      arr(val.missing_licenses).length;

    const tone = failed
      ? "fail"
      : warnings.length > 0 || missingCount > 0
        ? "warning"
        : "pass";

    const icon =
      tone === "fail"
        ? "bi-x-circle"
        : tone === "warning"
          ? "bi-exclamation-circle"
          : "bi-check-circle";

    const compliance = Number(val.compliance_score);
    const complianceText = Number.isFinite(compliance)
      ? `Compliance score ${formatScore(compliance)}/100.`
      : "";

    return {
      id: sub.id,
      icon,
      tone,
      label: tone === "fail" ? "Fail" : tone === "warning" ? "Warning" : "Pass",
      name: contractorName(sub),
      text: val.summary || complianceText || "No validation details provided.",
    };
  });
}

/* ------------------------------------------------------------------ */
/* Flagged risk issues (Moderate risk and above)                       */
/* ------------------------------------------------------------------ */

function buildRiskIssues(submissions) {
  return submissions
    .filter((sub) => (RISK_ORDER[riskLevel(sub)] ?? 0) >= RISK_ORDER.moderate)
    .sort(
      (a, b) => (RISK_ORDER[riskLevel(b)] ?? 0) - (RISK_ORDER[riskLevel(a)] ?? 0),
    )
    .map((sub) => {
      const risk = sub.risk_result || {};
      const level = riskLevel(sub);
      const topRisks = arr(risk.top_risks);

      const type =
        level === "critical" ? "danger" : level === "high" ? "warning" : "info";

      const impact =
        level === "critical"
          ? "High Impact"
          : level === "high"
            ? "Medium Impact"
            : "Low Impact";

      return {
        id: sub.id,
        type,
        title: topRisks[0]?.risk_type || "Execution Risk",
        severity: `${risk.overall_risk} Severity`,
        impact,
        contractor: contractorName(sub),
        text: risk.summary || "No risk summary provided.",
        details: topRisks
          .map((item) => `${item.risk_type}: ${item.description}`)
          .join(" · "),
        recommendation: sub.justification || "",
      };
    });
}

/* ------------------------------------------------------------------ */
/* Missing document alerts                                             */
/* ------------------------------------------------------------------ */

function buildMissingDocAlerts(submissions) {
  return submissions
    .map((sub) => {
      const val = sub.validation_result || {};
      const items = [
        ...arr(val.missing_documents).map((d) => `Missing document: ${d}`),
        ...arr(val.missing_certificates).map((c) => `Missing certificate: ${c}`),
        ...arr(val.missing_licenses).map((l) => `Missing license: ${l}`),
      ];

      return {
        id: sub.id,
        name: contractorName(sub),
        email: sub.contractor_email || "",
        items,
      };
    })
    .filter((alert) => alert.items.length > 0);
}

/* ------------------------------------------------------------------ */
/* Decision cards                                                      */
/* ------------------------------------------------------------------ */

function buildDecisions(submissions, missingDocAlerts) {
  const decisions = [];

  const winner = submissions[0];
  if (winner && winner._mandatoryPassed && winner.recommendation !== "Disqualified") {
    decisions.push({
      type: "success",
      title: "Proceed with Award",
      text: `${contractorName(winner)} ranked #1 with an overall score of ${formatScore(
        winner.final_score,
      )}. Recommend proceeding to contract negotiation.`,
    });
  }

  if (missingDocAlerts.length > 0) {
    decisions.push({
      type: "warning",
      title: "Request Clarifications",
      text: `${missingDocAlerts.length} contractor${
        missingDocAlerts.length > 1 ? "s" : ""
      } need${missingDocAlerts.length > 1 ? "" : "s"} updated documentation before final ranking can be confirmed.`,
    });
  }

  const disqualified = submissions.filter(
    (sub) =>
      !sub._mandatoryPassed ||
      sub.recommendation === "Disqualified" ||
      riskLevel(sub) === "critical",
  );
  if (disqualified.length > 0) {
    decisions.push({
      type: "danger",
      title: "High-Risk Contractors",
      text: `${disqualified
        .map((sub) => contractorName(sub))
        .join(", ")} flagged for disqualification or critical risk. Review before shortlisting.`,
    });
  }

  return decisions;
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatAnalyzedAt(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day} at ${time}`;
}

export function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "C";
}

export function getFileName(url = "") {
  if (!url) return "Uploaded file";

  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return "Uploaded file";
  }
}
