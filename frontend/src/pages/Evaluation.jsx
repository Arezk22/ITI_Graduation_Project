// Evaluation page: fetches the shaped evaluation report and presents it.
// All business logic lives in reportService / evaluationService; the table,
// chart and banner are standalone components.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import AiRecommendationBanner from "../components/AiRecommendationBanner";
import ContractorComparisonTable from "../components/ContractorComparisonTable";
import BidPriceChart from "../components/BidPriceChart";
import { StatusBanner } from "../components/ReportBadges";
import { getAllTenders } from "../services/tenderApi";
import { fetchTenderReport } from "../services/reportService";
import { PROCESSING_POLL_MS } from "../services/evaluationService";

function Evaluation() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  // Shaped evaluation report (same model as the Reports page): submissions
  // ranked best -> worst, plus status/message/winner.
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getAllTenders()
      .then((response) => {
        if (cancelled) return;

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
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTenders(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTenderId) return;

    let cancelled = false;

    setLoadingEvaluation(true);

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
        if (!cancelled) setLoadingEvaluation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTenderId]);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const analysisStatus = report?.status || null;
  const isCompleted = report?.isCompleted || false;
  const rankedSubmissions = useMemo(() => report?.submissions || [], [report]);
  const winner = report?.winner || null;

  // While the analysis is processing, silently re-fetch so the table appears
  // without a manual refresh (no loading spinner flicker).
  useEffect(() => {
    if (!selectedTenderId || analysisStatus !== "processing") return;

    let cancelled = false;

    const timer = setInterval(() => {
      fetchTenderReport(selectedTenderId)
        .then((shaped) => {
          if (!cancelled) setReport(shaped);
        })
        .catch((error) => {
          console.error(
            "Poll tender evaluation error:",
            error.response?.data || error,
          );
        });
    }, PROCESSING_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedTenderId, analysisStatus]);

  return (
    <OwnerLayout activePage="evaluation">
      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Tender Evaluation</h2>

            <div className="tender-dropdown-wrapper small-dropdown evaluation-project-dropdown">
              <button
                type="button"
                className="tender-dropdown-btn evaluation-tender-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>
                  {loadingTenders
                    ? "Loading tenders..."
                    : selectedTender?.title || "Select tender"}
                </span>

                <i
                  className={`bi ${
                    dropdownOpen ? "bi-chevron-up" : "bi-chevron-down"
                  }`}
                ></i>
              </button>

              {dropdownOpen && (
                <div className="tender-dropdown-menu">
                  {tenders.length === 0 ? (
                    <div className="tender-dropdown-empty">
                      No tenders found
                    </div>
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
                          setDropdownOpen(false);
                        }}
                      >
                        <strong>{tender.title || `Tender ${tender.id}`}</strong>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <p className="evaluation-project-subtitle">
              {loadingEvaluation
                ? "Loading submissions..."
                : `${rankedSubmissions.length} submissions`}
            </p>
          </div>

          <div className="evaluation-actions">
            <button
              className="btn ai-report-btn"
              onClick={() => navigate("/owner/ai-analysis")}
            >
              <i className="bi bi-cpu"></i>
              AI Risk Report
            </button>

            <button
              className="btn export-report-btn"
              onClick={() => navigate("/owner/reports")}
            >
              <i className="bi bi-download"></i>
              Export Report
            </button>
          </div>
        </div>

        <AiRecommendationBanner
          loading={loadingEvaluation}
          status={analysisStatus}
          isCompleted={isCompleted}
          winner={winner}
        />

        {loadingEvaluation ? (
          <div className="report-state-banner loading mt-4">
            <i className="bi bi-arrow-repeat spin"></i>
            Loading evaluation…
          </div>
        ) : !isCompleted ? (
          <div className="mt-4">
            <StatusBanner status={analysisStatus} message={report?.message} />
          </div>
        ) : (
          <>
            <ContractorComparisonTable
              tenderId={selectedTenderId}
              submissions={rankedSubmissions}
            />

            <BidPriceChart submissions={rankedSubmissions} />
          </>
        )}
      </section>
    </OwnerLayout>
  );
}

export default Evaluation;
