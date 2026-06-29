
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function ContractorOwnerProfile() {
  const navigate = useNavigate();
  const { ownerId } = useParams();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenderSubmissions, setTenderSubmissions] = useState({});
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        const ownerTenders = list.filter(
          (tender) => String(tender.owner) === String(ownerId)
        );

        setTenders(ownerTenders);
      })
      .catch((error) => {
        console.error(
          "Load owner profile tenders error:",
          error.response?.data || error
        );
        setTenders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId]);

  useEffect(() => {
    if (!tenders.length) return;

    Promise.allSettled(
      tenders.map((tender) =>
        getTenderSubmissions(tender.id).then((response) => [
          tender.id,
          Array.isArray(response.data)
            ? response.data
            : response.data.submissions || [],
        ])
      )
    ).then((results) => {
      const submissionsMap = {};

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [tenderId, submissions] = result.value;
          submissionsMap[tenderId] = submissions;
        }
      });

      setTenderSubmissions(submissionsMap);
    });
  }, [tenders]);

  const ownerInfo = useMemo(() => {
    return getOwnerInfo(tenders, ownerId);
  }, [tenders, ownerId]);

  const totalTenders = tenders.length;

  const activeTenders = tenders.filter(
    (tender) => getTenderDisplayStatus(tender) === "Active"
  ).length;

  const totalBids = tenders.reduce((sum, tender) => {
    const subs = tenderSubmissions[tender.id];

    if (Array.isArray(subs)) {
      return sum + subs.length;
    }

    return sum + getBidsCount(tender);
  }, 0);

  const chartData = useMemo(() => {
    return getMonthlyChartData(tenders, tenderSubmissions);
  }, [tenders, tenderSubmissions]);

  const recentTenders = useMemo(() => {
    return [...tenders]
      .sort((a, b) => {
        const dateA = new Date(a.deadline_at || 0);
        const dateB = new Date(b.deadline_at || 0);
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [tenders]);

  return (
    <ContractorLayout activePage="dashboard">
      <section className="dashboard-content">
        <div className="dashboard-title owner-profile-title">

          <div>
  <h2>{ownerInfo.company}</h2>

  <p>
    {formatToday()} · {totalTenders} total tenders
  </p>

  {ownerInfo.email ? (
    <a className="owner-email-link" href={`mailto:${ownerInfo.email}`}>
      <i className="bi bi-envelope"></i>
      {ownerInfo.email}
    </a>
  ) : (
    <p className="owner-email-placeholder">
      <i className="bi bi-envelope"></i>
      Email not available
    </p>
  )}
</div>

          <button
            className="btn my-profile-btn"
            onClick={() => navigate("/contractor/dashboard")}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Dashboard
          </button>
        </div>

        <div className="row g-4">
          <StatCard
            icon="bi-file-earmark-text"
            value={totalTenders}
            title="Total Tenders"
            note={`${totalTenders} published tenders`}
            color="blue"
          />

          <StatCard
            icon="bi-graph-up-arrow"
            value={activeTenders}
            title="Active Tenders"
            note={`${activeTenders} open now`}
            color="green"
          />

          <StatCard
            icon="bi-people"
            value={totalBids}
            title="Submitted Bids"
            note={`${totalBids} total bids`}
            color="purple"
          />
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-12">
            <div className="dashboard-card chart-card">
              <div className="card-header-clean">
                <h5>Tender & Bid Activity</h5>

                <div className="chart-legend">
                  <span className="blue-dot"></span> Tenders
                  <span className="orange-dot"></span> Bids
                </div>
              </div>

              <div className="real-chart">
                <svg viewBox="0 0 760 300" preserveAspectRatio="none">
                  {[0, 15, 30, 45, 60].map((value) => {
                    const y = getChartY(value, 60);

                    return (
                      <g key={value}>
                        <text x="10" y={y + 4} className="chart-axis-label">
                          {value}
                        </text>

                        <line
                          x1="45"
                          y1={y}
                          x2="735"
                          y2={y}
                          className="chart-grid-line"
                        />
                      </g>
                    );
                  })}

                  <path
                    d={buildSmoothPath(chartData, "tenders")}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="chart-smooth-line"
                  />

                  <path
                    d={buildSmoothPath(chartData, "bids")}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="chart-smooth-line"
                  />

                  {chartData.map((item, index) => {
                    const x = getChartX(index, chartData.length);

                    return (
                      <g key={item.month}>
                        <rect
                          x={x - 35}
                          y="20"
                          width="70"
                          height="230"
                          fill="transparent"
                          onMouseEnter={() =>
                            setHoveredMonth({
                              ...item,
                              x,
                            })
                          }
                          onMouseLeave={() => setHoveredMonth(null)}
                        />

                        {hoveredMonth?.month === item.month && (
                          <>
                            <line
                              x1={x}
                              y1="35"
                              x2={x}
                              y2="240"
                              className="chart-hover-line"
                            />

                            <circle
                              cx={x}
                              cy={getChartY(item.tenders, 60)}
                              r="6"
                              fill="#2563eb"
                              className="chart-hover-dot"
                            />

                            <circle
                              cx={x}
                              cy={getChartY(item.bids, 60)}
                              r="6"
                              fill="#f97316"
                              className="chart-hover-dot"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {hoveredMonth && (
                  <div
                    className="chart-tooltip"
                    style={{
                      left: `${Math.min(
                        Math.max(hoveredMonth.x - 25, 70),
                        610
                      )}px`,
                    }}
                  >
                    <strong>{hoveredMonth.month}</strong>
                    <span>Tenders: {hoveredMonth.tenders}</span>
                    <span>Bids: {hoveredMonth.bids}</span>
                  </div>
                )}

                <div className="chart-months real-chart-months">
                  {chartData.map((item) => (
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Recent Tenders</h5>

            <button
              type="button"
              className="view-all-link"
              onClick={() => navigate(`/contractor/owner-profile/${ownerId}/tenders`)}
            >
              View all <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table owner-table align-middle">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Bids</th>
                  <th>Deadline</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      Loading tenders...
                    </td>
                  </tr>
                ) : recentTenders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No tenders found for this owner.
                    </td>
                  </tr>
                ) : (
                  recentTenders.map((tender) => {
                    const displayStatus = getTenderDisplayStatus(tender);

                    return (
                      <tr
                        key={tender.id}
                        className="clickable-table-row"
                        onClick={() =>
                          navigate(`/contractor/tender-details/${tender.id}`)
                        }
                      >
                        <td>{formatTenderId(tender.id)}</td>

                        <td className="fw-bold">{tender.title}</td>

                        <td>
                          <span
                            className={`status-badge ${displayStatus
                              .replaceAll(" ", "-")
                              .toLowerCase()}`}
                          >
                            {displayStatus}
                          </span>
                        </td>

                        <td>{getBidsCountFromMap(tender, tenderSubmissions)}</td>

                        <td>
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(tender.deadline_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </ContractorLayout>
  );
}

function StatCard({ icon, value, title, note, color }) {
  return (
    <div className="col-lg-4 col-md-6">
      <div className="owner-stat-card">
        <div className={`stat-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>

        <i className="bi bi-arrow-up-right stat-arrow"></i>

        <h3>{value}</h3>
        <p>{title}</p>
        <small className={color}>{note}</small>
      </div>
    </div>
  );
}



function getOwnerInfo(tenders, ownerId) {
  const firstTender = tenders[0] || {};

  return {
    company:
      firstTender.owner_company_name ||
      `Owner Company #${ownerId}`,
    email: firstTender.owner_email || "",
  };
}

function getTenderDisplayStatus(tender) {
  const deadline = tender.deadline_at ? new Date(tender.deadline_at) : null;
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (tender.status === "awarded") return "Awarded";
  if (deadline && deadline < today) return "Closed";
  if (tender.status === "open") return "Active";

  return tender.status || "Active";
}

function getBidsCount(tender) {
  return (
    tender.total_submissions ||
    tender.submissions_count ||
    tender.bids_count ||
    tender.proposals_count ||
    tender.submissions?.length ||
    tender.proposals?.length ||
    0
  );
}

function getBidsCountFromMap(tender, tenderSubmissions) {
  const subs = tenderSubmissions[tender.id];

  if (Array.isArray(subs)) {
    return subs.length;
  }

  return getBidsCount(tender);
}

function getMonthlyChartData(tenders, tenderSubmissions = {}) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return months.map((month, index) => {
    const tendersInMonth = tenders.filter((tender) => {
      if (!tender.created_at) return false;
      return new Date(tender.created_at).getMonth() === index;
    }).length;

    const bidsInMonth = tenders.reduce((sum, tender) => {
      const submissions =
        tenderSubmissions[tender.id] ||
        tender.submissions ||
        tender.proposals ||
        [];

      if (!Array.isArray(submissions)) return sum;

      const count = submissions.filter((submission) => {
        const date = submission.created_at || submission.submitted_at;

        if (!date) return false;

        return new Date(date).getMonth() === index;
      }).length;

      return sum + count;
    }, 0);

    return {
      month,
      tenders: tendersInMonth,
      bids: bidsInMonth,
    };
  });
}

function getChartX(index, total) {
  if (total <= 1) return 45;
  return 55 + (index * 670) / (total - 1);
}

function getChartY(value, max = 60) {
  const safeValue = Math.min(Number(value || 0), max);
  return 240 - (safeValue / max) * 200;
}

function buildSmoothPath(chartData, key) {
  if (!chartData.length) return "";

  const points = chartData.map((item, index) => ({
    x: getChartX(index, chartData.length),
    y: getChartY(item[key], 60),
  }));

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTenderId(id) {
  return `T-${String(id).padStart(4, "0")}`;
}

export default ContractorOwnerProfile;