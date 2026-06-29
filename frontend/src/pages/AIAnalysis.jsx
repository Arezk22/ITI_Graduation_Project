
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { getAllTenders } from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function AIAnalysis() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);

  const [reviewSubmissions, setReviewSubmissions] = useState([]);
  const [loadingReviewDocs, setLoadingReviewDocs] = useState(false);

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        setTenders(list);

        if (list.length > 0) {
          setSelectedTenderId(String(list[0].id));
        }
      })
      .catch((error) => {
        console.error("Load tenders error:", error.response?.data || error);
        setTenders([]);
      })
      .finally(() => {
        setLoadingTenders(false);
      });
  }, []);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const selectedTenderTitle = selectedTender?.title || "Select Tender";

  useEffect(() => {
    if (!selectedTenderId) return;

    setLoadingReviewDocs(true);

    getTenderSubmissions(selectedTenderId)
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setReviewSubmissions(list);
      })
      .catch((error) => {
        console.error(
          "Load review submissions error:",
          error.response?.data || error
        );
        setReviewSubmissions([]);
      })
      .finally(() => {
        setLoadingReviewDocs(false);
      });
  }, [selectedTenderId]);

  const checks = [
    [
      "bi-check-circle",
      "BOQ completeness check",
      "All 247 line items accounted for",
      "Pass",
      "pass",
    ],
    [
      "bi-check-circle",
      "Document authenticity verification",
      "No tampering indicators detected",
      "Pass",
      "pass",
    ],
    [
      "bi-exclamation-circle",
      "License validity check",
      "1 of 5 contractors has expiring license",
      "Warning",
      "warning",
    ],
    [
      "bi-x-circle",
      "Price reasonableness analysis",
      "1 bid flagged as anomalously low (>30% below avg)",
      "Fail",
      "fail",
    ],
    [
      "bi-check-circle",
      "Previous performance scan",
      "Cross-referenced 28 public project records",
      "Pass",
      "pass",
    ],
    [
      "bi-check-circle",
      "Compliance requirements check",
      "All contractors meet minimum requirements",
      "Pass",
      "pass",
    ],
    [
      "bi-exclamation-circle",
      "Insurance coverage verification",
      "2 contractors need updated insurance docs",
      "Warning",
      "warning",
    ],
    [
      "bi-check-circle",
      "Financial capacity assessment",
      "4 of 5 contractors meet financial threshold",
      "Pass",
      "pass",
    ],
  ];

  return (
    <OwnerLayout activePage="ai-analysis">
      <section className="ai-analysis-content">
        <div className="ai-analysis-header ai-analysis-header-with-dropdown">
          <div>
            <div className="ai-tender-dropdown-wrap">
              <button
                type="button"
                className="ai-tender-dropdown-btn"
                onClick={() => setTenderDropdownOpen((prev) => !prev)}
              >
                <span>
                  {loadingTenders ? "Loading tenders..." : selectedTenderTitle}
                </span>

                <i
                  className={`bi ${
                    tenderDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"
                  }`}
                ></i>
              </button>

              {tenderDropdownOpen && (
                <div className="ai-tender-dropdown-menu">
                  {tenders.length === 0 ? (
                    <div className="ai-tender-empty">No tenders found</div>
                  ) : (
                    tenders.map((tender) => (
                      <button
                        type="button"
                        key={tender.id}
                        className={
                          String(tender.id) === selectedTenderId ? "active" : ""
                        }
                        onClick={() => {
                          setSelectedTenderId(String(tender.id));
                          setTenderDropdownOpen(false);
                        }}
                      >
                        <strong>{tender.title}</strong>
                        <span>
                          {formatTenderId(tender.id)} ·{" "}
                          {formatCategory(tender.project_category)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <p>
              AI Analysis & Risk Center · Analyzed Jun 10, 2026 at 08:15 AM
            </p>
          </div>

          <span className="ai-version">
            <i className="bi bi-cpu"></i>
            BuildTender AI v3.2
          </span>
        </div>

        <div className="row g-4 ai-metrics-row">
          <AIMetric
            icon="bi-shield-check"
            value="8/8"
            title="Validation Checks"
            note="All passed/reviewed"
            color="green"
          />

          <AIMetric
            icon="bi-exclamation-triangle"
            value="1"
            title="Critical Flags"
            note="Requires action"
            color="red"
          />

          <AIMetric
            icon="bi-exclamation-circle"
            value="3"
            title="Medium Risks"
            note="Monitor closely"
            color="orange"
          />

          <AIMetric
            icon="bi-file-earmark-x"
            value="4"
            title="Missing Documents"
            note="Across 2 contractors"
            color="purple"
          />

          <AIMetric
            icon="bi-file-earmark-check"
            value={reviewSubmissions.length}
            title="Need Review Documents"
            note="Manual review required"
            color="blue"
          />
        </div>

        <div className="ai-card mt-4">
          <h5>
            <i className="bi bi-lightning-charge text-primary"></i>
            Automated Validation Results
          </h5>

          <div className="validation-list">
            {checks.map((item, index) => (
              <div className="validation-row" key={index}>
                <i className={`bi ${item[0]} ${item[4]}`}></i>
                <span>{item[1]}</span>
                <p>{item[2]}</p>
                <b className={item[4]}>{item[3]}</b>
              </div>
            ))}
          </div>
        </div>

        <h5 className="section-title">Risk Analysis — Flagged Issues</h5>

        <RiskIssue
          type="danger"
          icon="bi-exclamation-triangle"
          title="Anomalous Pricing"
          severity="Critical Severity"
          impact="High Impact"
          contractor="Peak Contracting LLC"
          text="Total bid of $2.78M is 34% below the market average ($4.15M). BOQ line items for structural steel and MEP are priced significantly below cost."
          details="Steel: $85/ton (market: $142/ton) · MEP: $180k (market: $310k) · Foundation: $320k (market: $480k)"
          recommendation="Request detailed cost justification before shortlisting. High risk of cost overruns or contract abandonment."
        />

        <RiskIssue
          type="warning"
          icon="bi-exclamation-triangle"
          title="Incomplete Documentation"
          severity="Medium Severity"
          impact="Medium Impact"
          contractor="Meridian Builders Ltd"
          text="ISO 9001 certification expired 3 months ago. Trade license renewal pending. Previous project references show one unresolved dispute."
          details="Missing: Valid ISO 9001 · Renewal: Trade License expires Jul 2026 · Flagged: 1 dispute (2022)"
          recommendation="Request updated certifications. Conditional shortlisting pending document refresh."
        />

        <RiskIssue
          type="info"
          icon="bi-exclamation-triangle"
          title="Experience Gap"
          severity="Low Severity"
          impact="Low Impact"
          contractor="Vertex Construction"
          text="No documented projects above $3M in value. This tender is valued at $8.4M — 2.8× their maximum declared project value."
          details="Max declared project: $2.9M · Relevant experience: 7 years · Similar projects: 2 of 5"
          recommendation="Request financial capacity letter and insurance coverage confirmation for large-scale projects."
        />

        <div className="ai-card mt-4">
          <h5>
            <i className="bi bi-file-earmark-x text-purple"></i>
            Missing Document Alerts
          </h5>

          <div className="missing-doc-row">
            <div className="doc-avatar">M</div>

            <div>
              <strong>Meridian Builders Ltd</strong>
              <p>
                <span>Missing: ISO 9001 current certificate</span>
                <span>Missing: Updated insurance certificate</span>
              </p>
            </div>

            <a href="#">Request →</a>
          </div>

          <div className="missing-doc-row">
            <div className="doc-avatar">A</div>

            <div>
              <strong>Arcline Infrastructure</strong>
              <p>
                <span>Missing: Company financial statement 2025</span>
                <span>Missing: Bank guarantee letter</span>
              </p>
            </div>

            <a href="#">Request →</a>
          </div>
        </div>

        <div className="ai-card mt-4">
          <h5>
            <i className="bi bi-file-earmark-check text-primary"></i>
            Documents Need Review
          </h5>

          {loadingReviewDocs ? (
            <div className="text-muted py-3">
              Loading contractor documents...
            </div>
          ) : reviewSubmissions.length === 0 ? (
            <div className="text-muted py-3">
              No submitted documents found.
            </div>
          ) : (
            reviewSubmissions.slice(0, 2).map((submission) => (
              <div className="missing-doc-row review-doc-row" key={submission.id}>
                <div className="doc-avatar">
                  {getInitial(submission.contractor_company_name)}
                </div>

                <div>
                  <strong>
                    {submission.contractor_company_name ||
                      `Contractor ${submission.contractor || ""}`}
                  </strong>

                  <p>
                    {submission.files && submission.files.length > 0 ? (
                      submission.files.map((file) => (
                        <span key={file.id}>{getFileName(file.file_url)}</span>
                      ))
                    ) : (
                      <span>No files uploaded</span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="review-link-btn"
                  onClick={() =>
                    navigate(
                      `/owner/proposal-details/${selectedTenderId}/${submission.id}`
                    )
                  }
                >
                  Review →
                </button>
              </div>
            ))
          )}
        </div>

        <div className="row g-4 mt-1">
          <DecisionCard
            type="success"
            title="Proceed with Award"
            text="AlSalam Construction meets all criteria. Recommend proceeding to contract negotiation."
          />

          <DecisionCard
            type="warning"
            title="Request Clarifications"
            text="2 contractors need updated documentation before final ranking can be confirmed."
          />

          <DecisionCard
            type="danger"
            title="Disqualify Peak Contracting"
            text="Anomalous pricing warrants disqualification unless credible cost justification is provided."
          />
        </div>
      </section>
    </OwnerLayout>
  );
}

function AIMetric({ icon, value, title, note, color }) {
  return (
    <div className="col-xl col-lg-4 col-md-6">
      <div className="ai-metric-card">
        <div className={`ai-metric-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>

        <h3 className={color}>{value}</h3>
        <h6>{title}</h6>
        <p>{note}</p>
      </div>
    </div>
  );
}

function RiskIssue({
  type,
  icon,
  title,
  severity,
  impact,
  contractor,
  text,
  details,
  recommendation,
}) {
  return (
    <div className={`risk-issue ${type}`}>
      <div className="risk-issue-header">
        <div>
          <h5>
            <i className={`bi ${icon}`}></i>
            {title}
            <span>{severity}</span>
          </h5>

          <p>{contractor}</p>
        </div>

        <b>{impact}</b>
      </div>

      <p className="risk-main-text">{text}</p>

      <div className="risk-code">{details}</div>

      <div className="risk-recommendation">
        <i className="bi bi-info-circle"></i>
        <strong>Recommendation:</strong> {recommendation}
      </div>
    </div>
  );
}

function DecisionCard({ type, title, text }) {
  return (
    <div className="col-lg-4">
      <div className={`decision-card ${type}`}>
        <i
          className={`bi ${
            type === "success"
              ? "bi-check-circle"
              : type === "warning"
              ? "bi-exclamation-circle"
              : "bi-x-circle"
          }`}
        ></i>

        <h5>{title}</h5>
        <p>{text}</p>
      </div>
    </div>
  );
}

function formatTenderId(id) {
  return `T-${String(id).padStart(4, "0")}`;
}

function formatCategory(category) {
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

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "C";
}

function getFileName(url = "") {
  if (!url) return "Uploaded file";

  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return "Uploaded file";
  }
}

export default AIAnalysis;