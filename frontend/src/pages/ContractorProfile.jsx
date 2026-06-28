

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getMySubmissions } from "../services/proposalApi";

function ContractorProfile() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredYear, setHoveredYear] = useState(null);

  const companyName = localStorage.getItem("companyName") || "Company Name";
  const userEmail = localStorage.getItem("userEmail") || "email@example.com";

  useEffect(() => {
    getMySubmissions()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        console.log("MY SUBMISSIONS:", list);
        setSubmissions(list);
      })
      .catch((error) => {
        console.error(
          "Load contractor submissions error:",
          error.response?.data || error
        );
        setSubmissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const acceptedSubmissions = useMemo(() => {
    return submissions.filter((submission) => isAwardedSubmission(submission));
  }, [submissions]);

  const visibleSubmissions = submissions.slice(0, 5);

  const totalProjectValue = useMemo(() => {
    return submissions.reduce((sum, submission) => {
      return sum + Number(submission.tender?.budget || 0);
    }, 0);
  }, [submissions]);

  const winRate = useMemo(() => {
    if (!submissions.length) return 0;
    return Math.round((acceptedSubmissions.length / submissions.length) * 100);
  }, [submissions, acceptedSubmissions]);

  const annualAwardData = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];

    return years.map((year) => {
      const count = acceptedSubmissions.filter((submission) => {
        const dateValue =
          submission.accepted_at ||
          submission.tender?.awarded_at ||
          submission.submitted_at;

        if (!dateValue) return false;

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return false;

        return date.getFullYear() === year;
      }).length;

      return { year, count };
    });
  }, [acceptedSubmissions]);

  return (
    <ContractorLayout activePage="profile">
      <section className="contractor-profile-content">
        <div className="contractor-hero-card">
          <div className="contractor-main-info">
            <div className="contractor-avatar">{getInitial(companyName)}</div>

            <div>
              <h2>{companyName}</h2>



              <div className="contractor-contact">
                <span>
                  <i className="bi bi-envelope"></i> {userEmail}
                                  <span>
                  <i className="bi bi-currency-dollar"></i> $4.2M avg project
                  value
                </span>
                </span>

                {/* <span>
                  <i className="bi bi-telephone"></i> Phone not provided
                </span>

                <span>
                  <i className="bi bi-globe"></i> Website not provided
                </span> */}
              </div>
            </div>
          </div>

          <div className="trust-score-box">
            <h3>
              <i className="bi bi-star-fill"></i> 88 <span>/100</span>
            </h3>
            <p>Trust Score</p>
          </div>

          <div className="contractor-stats">
            <div>
              <h3>{acceptedSubmissions.length}</h3>
              <p>Projects Accepted</p>
            </div>

            <div>
              <h3>{formatShortMoney(totalProjectValue)}</h3>
              <p>Total Project Value</p>
            </div>

            <div>
              <h3>{winRate}%</h3>
              <p>Win Rate</p>
            </div>

            <div>
              <h3>91/100</h3>
              <p>Avg Delivery Score
</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card profile-chart-card mt-4">
          <div className="card-header-clean">
            <h5>Trust Score History</h5>
          </div>

          <div className="trust-chart-full">
            <div className="trust-y-axis">
              {[100, 90, 80, 70].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            <div className="trust-chart-area">
              <svg viewBox="0 0 700 220" preserveAspectRatio="none">
                {[100, 90, 80, 70].map((value) => (
                  <line
                    key={value}
                    x1="0"
                    x2="700"
                    y1={getTrustY(value)}
                    y2={getTrustY(value)}
                    className="trust-grid-line"
                  />
                ))}

                <path
                  d={buildTrustPath()}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {trustData.map((item, index) => (
                  <circle
                    key={item.month}
                    cx={getTrustX(index)}
                    cy={getTrustY(item.value)}
                    r="5"
                    fill="#2563eb"
                  />
                ))}
              </svg>

              <div className="chart-months">
                {trustData.map((item) => (
                  <span key={item.month}>{item.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Previous Projects</h5>

            {submissions.length > 0 && (
              <button
                className="view-all-link"
                onClick={() => navigate("/contractor/proposals")}
              >
                View all
              </button>
            )}
          </div>

          <div className="profile-projects-list">
            {loading ? (
              <div className="text-muted py-3">Loading proposals...</div>
            ) : submissions.length === 0 ? (
              <div className="text-muted py-3">No submitted proposals yet.</div>
            ) : (
              visibleSubmissions.map((submission) => (
                <div
                  className="profile-project-row contractor-proposal-row"
                  key={submission.id}
                >
                  <div className="proposal-project-info">
                    <h5>
                      {submission.tender?.title ||
                        `Tender ${submission.tender_id || ""}`}
                      <span>
                        {formatCategory(submission.tender?.project_category)}
                      </span>
                    </h5>

                    <p>
                      <i className="bi bi-currency-dollar"></i>{" "}
                      {formatMoney(submission.tender?.budget)}{" "}
                      <i className="bi bi-calendar ms-2"></i> Submitted{" "}
                      {formatDate(submission.submitted_at)}
                    </p>
                  </div>

                  <span
                    className={
                      isAwardedSubmission(submission)
                        ? "completed-badge proposal-status-badge"
                        : "submitted-badge proposal-status-badge"
                    }
                  >
                    {isAwardedSubmission(submission) ? "Awarded" : "Submitted"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <h5 className="mb-4 fw-bold">Annual Awarded Projects</h5>

          <div className="annual-award-chart">
            <div className="annual-y-axis">
              {[12, 9, 6, 3, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            <div className="annual-chart-area">
              {annualAwardData.map((item) => (
                <div
                  className="annual-award-group"
                  key={item.year}
                  onMouseEnter={() => setHoveredYear(item)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
                  <div className="annual-award-bar-wrap">
                    <span
                      className="annual-award-bar"
                      style={{
                        height: `${Math.max(
                          (item.count / 12) * 100,
                          item.count ? 6 : 2
                        )}%`,
                      }}
                    ></span>

                    {hoveredYear?.year === item.year && (
                      <div className="annual-tooltip">
                        <strong>{item.year}</strong>
                        <span>{item.count} awarded</span>
                      </div>
                    )}
                  </div>

                  <p>{item.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ContractorLayout>
  );
}

const trustData = [
  { month: "Dec", value: 78 },
  { month: "Jan", value: 80 },
  { month: "Feb", value: 81 },
  { month: "Mar", value: 84 },
  { month: "Apr", value: 82 },
  { month: "May", value: 86 },
  { month: "Jun", value: 88 },
];

function buildTrustPath() {
  const points = trustData.map((item, index) => ({
    x: getTrustX(index),
    y: getTrustY(item.value),
  }));

  if (!points.length) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function getTrustX(index) {
  return 20 + index * 110;
}

function getTrustY(value) {
  const min = 70;
  const max = 100;
  const chartHeight = 180;

  return 190 - ((value - min) / (max - min)) * chartHeight;
}

function isAwardedSubmission(submission) {
  return (
    submission.status === "accepted" ||
    submission.status === "awarded" ||
    submission.tender?.status === "awarded"
  );
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "C";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  if (!value) return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatShortMoney(value) {
  const number = Number(value || 0);

  if (!number) return "$0";

  if (number >= 1000000) {
    return `$${Math.round(number / 1000000)}M+`;
  }

  if (number >= 1000) {
    return `$${Math.round(number / 1000)}K+`;
  }

  return `$${number}`;
}

function formatCategory(category) {
  const map = {
    construction: "Construction",
    roads: "Roads",
    buildings: "Buildings",
    electrical: "Electrical",
    mechanical: "Mechanical",
    water: "Water",
    it: "IT",
    consulting: "Consulting",
    supplies: "Supplies",
    maintenance: "Maintenance",
    other: "Other",
  };

  return map[category] || category || "Other";
}

export default ContractorProfile;