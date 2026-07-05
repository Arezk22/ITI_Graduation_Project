// AI Analysis & Risk Center: presents the AI evaluation results for a tender.
// Data fetching uses reportService (same shaped report as Reports/Evaluation);
// all derivation logic lives in aiAnalysisService.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { StatusBanner } from "../components/ReportBadges";
import {
  AIMetric,
  ValidationRow,
  RiskIssue,
  DecisionCard,
} from "../components/AiAnalysisCards";
import { getAllTenders } from "../services/tenderApi";
import {
  fetchTenderReport,
  formatTenderId,
  formatCategory,
} from "../services/reportService";
import {
  buildAiAnalysis,
  formatAnalyzedAt,
  getInitial,
  getFileName,
} from "../services/aiAnalysisService";

function AIAnalysis() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

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

  useEffect(() => {
    if (!selectedTenderId) return;

    let cancelled = false;

    setLoadingReport(true);

    fetchTenderReport(selectedTenderId)
      .then((shaped) => {
        if (!cancelled) setReport(shaped);
      })
      .catch((error) => {
        console.error(
          "Load tender evaluation error:",
          error.response?.data || error,
        );
        if (!cancelled) {
          setReport({
            status: "failed",
            isCompleted: false,
            message: error.response?.data?.message || "",
            tender: null,
            submissions: [],
            winner: null,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReport(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTenderId]);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const selectedTenderTitle = selectedTender?.title || "Select Tender";

  const isCompleted = report?.isCompleted || false;

  const analysis = useMemo(() => {
    if (!isCompleted) return null;
    return buildAiAnalysis(report.submissions);
  }, [report, isCompleted]);

  const analyzedAt = formatAnalyzedAt(report?.tender?.analyzed_at);

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
              AI Analysis & Risk Center
              {analyzedAt ? ` · Analyzed ${analyzedAt}` : ""}
            </p>
          </div>

          <span className="ai-version">
            <i className="bi bi-cpu"></i>
            BuildTender AI
          </span>
        </div>

        {loadingReport ? (
          <div className="report-state-banner loading mt-4">
            <i className="bi bi-arrow-repeat spin"></i>
            Loading evaluation…
          </div>
        ) : !isCompleted ? (
          <div className="mt-4">
            <StatusBanner status={report?.status} message={report?.message} />
          </div>
        ) : (
          <>
            <div className="row g-4 ai-metrics-row">
              <AIMetric
                icon="bi-shield-check"
                title="Validation Checks"
                {...analysis.metrics.validationChecks}
              />

              <AIMetric
                icon="bi-exclamation-triangle"
                title="Critical Flags"
                {...analysis.metrics.criticalFlags}
              />

              <AIMetric
                icon="bi-exclamation-circle"
                title="Medium Risks"
                {...analysis.metrics.mediumRisks}
              />

              <AIMetric
                icon="bi-file-earmark-x"
                title="Missing Documents"
                {...analysis.metrics.missingDocuments}
              />

              <AIMetric
                icon="bi-file-earmark-check"
                title="Need Review Documents"
                {...analysis.metrics.needReview}
              />
            </div>

            <div className="ai-card mt-4">
              <h5>
                <i className="bi bi-lightning-charge text-primary"></i>
                Automated Validation Results
              </h5>

              <div className="validation-list">
                {analysis.validationRows.map((row) => (
                  <ValidationRow key={row.id} {...row} />
                ))}
              </div>
            </div>

            <h5 className="section-title">Risk Analysis — Flagged Issues</h5>

            {analysis.riskIssues.length === 0 ? (
              <div className="ai-card">
                <p className="text-muted mb-0">
                  No significant risks flagged. All contractors are rated low
                  risk.
                </p>
              </div>
            ) : (
              analysis.riskIssues.map((issue) => (
                <RiskIssue key={issue.id} {...issue} />
              ))
            )}

            <div className="ai-card mt-4">
              <h5>
                <i className="bi bi-file-earmark-x text-purple"></i>
                Missing Document Alerts
              </h5>

              {analysis.missingDocAlerts.length === 0 ? (
                <div className="text-muted py-3">
                  No missing documents detected.
                </div>
              ) : (
                analysis.missingDocAlerts.map((alert) => (
                  <div className="missing-doc-row" key={alert.id}>
                    <div className="doc-avatar">{getInitial(alert.name)}</div>

                    <div>
                      <strong>{alert.name}</strong>
                      <p>
                        {alert.items.map((item, index) => (
                          <span key={index}>{item}</span>
                        ))}
                      </p>
                    </div>

                    {alert.email && (
                      <a
                        href={`mailto:${alert.email}?subject=${encodeURIComponent(
                          `Missing documents for tender ${formatTenderId(
                            selectedTenderId,
                          )}`,
                        )}`}
                      >
                        Request →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="ai-card mt-4">
              <h5>
                <i className="bi bi-file-earmark-check text-primary"></i>
                Documents Need Review
              </h5>

              {analysis.needReviewSubmissions.length === 0 ? (
                <div className="text-muted py-3 px-3">
                  No documents flagged for manual review.
                </div>
              ) : (
                analysis.needReviewSubmissions.map((submission) => (
                  <div
                    className="missing-doc-row review-doc-row"
                    key={submission.id}
                  >
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
                            <span key={file.id}>
                              {getFileName(file.file_url)}
                            </span>
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
                          `/owner/proposal-details/${selectedTenderId}/${submission.id}`,
                        )
                      }
                    >
                      Review →
                    </button>
                  </div>
                ))
              )}
            </div>

            {analysis.decisions.length > 0 && (
              <div className="row g-4 mt-1">
                {analysis.decisions.map((decision) => (
                  <DecisionCard key={decision.type} {...decision} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </OwnerLayout>
  );
}

export default AIAnalysis;
