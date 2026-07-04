import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import OwnerLayout from "../components/OwnerLayout";
import { getAllTenders } from "../services/tenderApi";
import {
  fetchTenderReport,
  contractorName,
  recommendationText,
  formatScore,
  formatMoney,
  formatDate,
  scoreTone,
  riskTone,
  recommendationTone,
  formatTenderId,
  formatCategory,
} from "../services/reportService";

function Reports() {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);

  // Shaped report for the currently selected tender (from reportService).
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const reportRef = useRef(null);

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

  // Fetch + shape the report whenever the selected tender changes.
  useEffect(() => {
    if (!selectedTenderId) return;

    let cancelled = false;

    const load = async () => {
      setLoadingReport(true);
      setReportError("");
      try {
        const shaped = await fetchTenderReport(selectedTenderId);
        if (!cancelled) setReport(shaped);
      } catch (error) {
        if (!cancelled) {
          console.error("Load report error:", error.response?.data || error);
          setReport(null);
          setReportError(
            error.response?.data?.message ||
              "Could not load the evaluation for this tender.",
          );
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedTenderId]);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const selectedTenderTitle =
    report?.tender?.title || selectedTender?.title || "Select Tender";

  const isCompleted = report?.isCompleted || false;
  const submissions = report?.submissions || [];

  const handleExport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Tender-Report-${selectedTender ? formatTenderId(selectedTender.id) : "export"}`,
    pageStyle: PRINT_PAGE_STYLE,
  });

  return (
    <OwnerLayout activePage="reports">
      <section className="reports-content">
        <div className="reports-header reports-header-with-dropdown">
          <div className="report-tender-dropdown-wrap">
            <label>REPORT EXPORT</label>

            <button
              type="button"
              className="report-tender-dropdown-btn"
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
              <div className="report-tender-dropdown-menu">
                {tenders.length === 0 ? (
                  <div className="report-tender-empty">No tenders found</div>
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
            AI evaluation report for <strong>{selectedTenderTitle}</strong>
          </p>
        </div>

        {/* Toolbar */}
        <div className="report-toolbar">
          <div className="report-toolbar-info">
            <div className="report-ai-icon">
              <i className="bi bi-stars"></i>
            </div>
            <div>
              <h5>Tender Evaluation Report</h5>
              <p>
                Contractor comparison ranked best to worst · generated{" "}
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          <button
            className="download-main-btn"
            onClick={handleExport}
            disabled={!isCompleted || submissions.length === 0}
            title={
              isCompleted
                ? "Export report as PDF"
                : "Report available once analysis is completed"
            }
          >
            <i className="bi bi-download"></i>
            Export report
          </button>
        </div>

        {/* State banners */}
        {loadingReport && (
          <div className="report-state-banner loading">
            <i className="bi bi-arrow-repeat spin"></i>
            Loading evaluation…
          </div>
        )}

        {!loadingReport && reportError && (
          <div className="report-state-banner error">
            <i className="bi bi-exclamation-octagon"></i>
            {reportError}
          </div>
        )}

        {!loadingReport && !reportError && report?.status && !isCompleted && (
          <StatusBanner status={report.status} message={report.message} />
        )}

        {/* Printable report */}
        {isCompleted && (
          <div className="report-print" ref={reportRef}>
            <ReportDocument
              tender={report.tender}
              submissions={submissions}
              winner={report.winner}
            />
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Printable document                                                  */
/* ------------------------------------------------------------------ */

function ReportDocument({ tender, submissions, winner }) {
  return (
    <>
      <header className="rp-header">
        <div>
          <span className="rp-kicker">
            <i className="bi bi-stars"></i> BuildTender AI · Evaluation Report
          </span>
          <h1>{tender.title}</h1>
          <p className="rp-sub">
            {formatTenderId(tender.id)} · {formatCategory(tender.project_category)}
            {tender.location ? ` · ${tender.location}` : ""}
          </p>
        </div>
        <div className="rp-header-meta">
          <div>
            <span>Budget</span>
            <strong>{formatMoney(tender.budget)}</strong>
          </div>
          <div>
            <span>Submissions</span>
            <strong>{submissions.length}</strong>
          </div>
          <div>
            <span>Generated</span>
            <strong>{formatDate(new Date().toISOString())}</strong>
          </div>
        </div>
      </header>

      {/* Recommendation */}
      {winner && (
        <section className="rp-recommendation">
          <div className="rp-rec-badge">
            <i className="bi bi-award"></i>
          </div>
          <div>
            <span className="rp-rec-label">Recommended award</span>
            <h2>{contractorName(winner)}</h2>
            <p>
              Ranked #1 of {submissions.length} with an overall score of{" "}
              <strong>{formatScore(winner.final_score)}</strong>.{" "}
              {winner.justification || recommendationText(winner)}
            </p>
          </div>
        </section>
      )}

      {/* Ranking table */}
      <section className="rp-section">
        <h3 className="rp-section-title">Ranking Overview</h3>
        <table className="rp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contractor</th>
              <th>Overall</th>
              <th>Technical</th>
              <th>Financial</th>
              <th>Risk</th>
              <th>Bid Price</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, index) => (
              <tr key={sub.id} className={index === 0 ? "rp-row-top" : ""}>
                <td>
                  <span className="rp-rank">{index + 1}</span>
                </td>
                <td className="rp-contractor-cell">{contractorName(sub)}</td>
                <td>
                  <strong>{formatScore(sub.final_score)}</strong>
                </td>
                <td>{formatScore(sub.technical_score)}</td>
                <td>{formatScore(sub.financial_score)}</td>
                <td>
                  <RiskPill sub={sub} />
                </td>
                <td>{formatMoney(sub.financial_result?.total_bid_price)}</td>
                <td>
                  <RecommendationPill sub={sub} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Per-contractor detail */}
      <section className="rp-section">
        <h3 className="rp-section-title">Contractor Analysis</h3>
        {submissions.map((sub, index) => (
          <article className="rp-card" key={sub.id}>
            <div className="rp-card-head">
              <div className="rp-card-rank">{index + 1}</div>
              <div className="rp-card-title">
                <h4>{contractorName(sub)}</h4>
                <span>
                  Overall {formatScore(sub.final_score)} ·{" "}
                  {sub.risk_result?.overall_risk || "Risk n/a"}
                </span>
              </div>
              <RecommendationPill sub={sub} />
            </div>

            <div className="rp-metrics">
              <Metric label="Technical" value={sub.technical_score} />
              <Metric label="Financial" value={sub.financial_score} />
              <Metric
                label="Risk"
                value={sub.risk_score}
                hint={sub.risk_result?.overall_risk}
                invert
              />
              <Metric
                label="Compliance"
                value={sub.validation_result?.compliance_score}
              />
            </div>

            <div className="rp-proscons">
              <div className="rp-pros">
                <h5>
                  <i className="bi bi-plus-circle"></i> Pros
                </h5>
                {sub.pros.length ? (
                  <ul>
                    {sub.pros.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rp-empty">No notable strengths identified.</p>
                )}
              </div>

              <div className="rp-cons">
                <h5>
                  <i className="bi bi-dash-circle"></i> Cons
                </h5>
                {sub.cons.length ? (
                  <ul>
                    {sub.cons.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rp-empty">No significant concerns identified.</p>
                )}
              </div>
            </div>

            {sub.justification && (
              <p className="rp-justification">
                <strong>AI justification:</strong> {sub.justification}
              </p>
            )}
          </article>
        ))}
      </section>

      <footer className="rp-footer">
        Generated by BuildTender AI · {formatDate(new Date().toISOString())} ·
        Confidential — for owner decision-making only
      </footer>
    </>
  );
}

function Metric({ label, value, hint, invert }) {
  const score = Number(value);
  const has = Number.isFinite(score);
  const tone = has ? scoreTone(score, invert) : "muted";
  return (
    <div className={`rp-metric ${tone}`}>
      <span className="rp-metric-label">{label}</span>
      <span className="rp-metric-value">{has ? formatScore(value) : "—"}</span>
      {hint && <span className="rp-metric-hint">{hint}</span>}
    </div>
  );
}

function RiskPill({ sub }) {
  const level = sub.risk_result?.overall_risk;
  if (!level) return <span>{formatScore(sub.risk_score)}</span>;
  return <span className={`rp-pill ${riskTone(level)}`}>{level}</span>;
}

function RecommendationPill({ sub }) {
  const level = recommendationText(sub);
  return <span className={`rp-pill ${recommendationTone(level)}`}>{level}</span>;
}

function StatusBanner({ status, message }) {
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

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .rp-card, .rp-recommendation, .rp-table { break-inside: avoid; }
    .rp-section-title { break-after: avoid; }
  }
`;

export default Reports;
