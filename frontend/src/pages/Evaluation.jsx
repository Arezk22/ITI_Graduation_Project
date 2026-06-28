import { useEffect, useMemo, useState } from "react";
import OwnerLayout from "../components/OwnerLayout";
import { useNavigate } from "react-router-dom";
import { getAllTenders } from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function Evaluation() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
          setLoadingSubmissions(true);
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

    getTenderSubmissions(selectedTenderId)
      .then((response) => {
        if (cancelled) return;

        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        console.log("TENDER SUBMISSIONS:", list);

        setSubmissions(list);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error(
          "Load tender submissions error:",
          error.response?.data || error
        );

        setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSubmissions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTenderId]);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const chartSubmissions = useMemo(() => {
    return submissions.map((submission, index) => ({
      name: getContractorName(submission, index),
      price: Number(
        submission.bid_price ||
          submission.price ||
          submission.financial_value ||
          submission.total_price ||
          0
      ),
    }));
  }, [submissions]);

  return (
    <OwnerLayout activePage="evaluation">
      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Tender Evaluation</h2>

            <p className="evaluation-project-subtitle">
              {selectedTender?.title || "Select tender"} · {submissions.length}{" "}
              submissions
            </p>

            <div className="tender-dropdown-wrapper small-dropdown">
              <button
                type="button"
                className="tender-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div>
                  <strong>
                    {loadingTenders ? "Loading tenders..." : "Change Project"}
                  </strong>
                  <span>{selectedTender?.title || "Select tender"}</span>
                </div>

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
                          setLoadingSubmissions(true);
                          setSelectedTenderId(String(tender.id));
                          setDropdownOpen(false);
                        }}
                      >
                        <strong>{tender.title || `Tender ${tender.id}`}</strong>
                        <span>
                          {formatCategory(tender.project_category)} ·{" "}
                          {tender.location || "N/A"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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

        <div className="ai-recommendation">
          <div className="ai-icon">
            <i className="bi bi-cpu"></i>
          </div>

          <div>
            <h5>
              AI Recommendation <span>Pending</span>
            </h5>
            <p>
              AI evaluation will appear here after proposal analysis is completed.
              Contractor scores, risks, and recommendation will be generated based
              on submitted proposal documents.
            </p>
          </div>

          <div className="rank-badge muted-rank">
            <i className="bi bi-hourglass-split"></i>
            Pending
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Contractor Comparison</h5>
          </div>

          <div className="evaluation-table-wrap">
            <table className="table evaluation-table align-middle">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Contractor</th>
                  <th>Bid Price</th>
                  <th>Technical</th>
                  <th>Experience</th>
                  <th>Compliance</th>
                  <th>Trust</th>
                  <th>Risk</th>
                  <th>Final Score</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingSubmissions ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      Loading submissions...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      No submissions yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission, index) => (
                    <tr key={submission.id || index}>
                      <td>
                        <span className="eval-rank">{index + 1}</span>
                      </td>

                      <td>
                        <strong>{getContractorName(submission, index)}</strong>
                      </td>

                      <td>{formatBidPrice(submission)}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>

                      <td>
                        <div className="evaluation-row-actions">
                          <button
                            className="proposal-btn"
                            onClick={() =>
                              navigate(
                                `/owner/proposal-details/${selectedTenderId}/${submission.id}`
                              )
                            }
                          >
                            Bid
                          </button>

                          <button
                            className="profile-btn"
                            onClick={() =>
                              navigate(
                                `/owner/contractor-profile/${getContractorId(
                                  submission
                                )}`
                              )
                            }
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-12">
            <div className="dashboard-card eval-chart-card">
              <h5>Bid Price Comparison</h5>

              <div className="contractor-score-chart">
                <div className="score-axis">
                  {[100, 80, 60, 40, 20, 0].map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>

                <div className="score-chart-bars">
                  {chartSubmissions.length === 0 ? (
                    <div className="empty-chart-message">
                      No bid prices available yet.
                    </div>
                  ) : (
                    chartSubmissions.map((item, index) => (
                      <div className="score-bar-group" key={`${item.name}-${index}`}>
                        <div className="score-bar-area">
                          <span
                            className="score-bar"
                            style={{
                              height: `${getBidBarHeight(
                                item.price,
                                chartSubmissions
                              )}%`,
                            }}
                          ></span>
                        </div>
                        <p title={item.name}>{shortName(item.name)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <p className="chart-note">
                Bid price values will appear after financial proposal analysis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

function getContractorName(submission, index) {
  return (
    submission.contractor_company_name ||
    submission.contractor?.company_name ||
    submission.company_name ||
    submission.contractor_name ||
    submission.user?.company_name ||
    submission.user?.first_name ||
    `Contractor ${index + 1}`
  );
}

function getContractorId(submission) {
  return (
    submission.contractor_id ||
    submission.contractor?.id ||
    submission.contractor ||
    submission.user?.id ||
    submission.id
  );
}

function formatBidPrice(submission) {
  const value =
    submission.bid_price ||
    submission.price ||
    submission.financial_value ||
    submission.total_price;

  if (!value) return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function getBidBarHeight(price, allItems) {
  if (!price || Number(price) <= 0) return 2;

  const maxPrice = Math.max(...allItems.map((item) => Number(item.price || 0)));

  if (!maxPrice) return 2;

  return Math.max((Number(price) / maxPrice) * 100, 4);
}

function shortName(name) {
  if (!name) return "—";

  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 1) return parts[0];

  return parts.slice(0, 2).join(" ");
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

export default Evaluation;