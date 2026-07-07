
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";

function ContractorOwnerProfile() {
  const navigate = useNavigate();
  const { ownerId } = useParams();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const ownerInfo = useMemo(() => {
    return getOwnerInfo(tenders, ownerId);
  }, [tenders, ownerId]);

  const totalTenders = tenders.length;

  const activeTenders = tenders.filter(
    (tender) => getTenderDisplayStatus(tender) === "Active"
  ).length;

  const totalBids = tenders.reduce((sum, tender) => {
    return sum + getBidsCount(tender);
  }, 0);

  const chartData = useMemo(() => {
    return getMonthlyChartData(tenders);
  }, [tenders]);

  const chartMax = useMemo(() => getChartMax(chartData), [chartData]);

  const chartTicks = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * chartMax),
    [chartMax],
  );

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
                  {chartTicks.map((value) => {
                    const y = getChartY(value, chartMax);

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
                    d={buildSmoothPath(chartData, "tenders", chartMax)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="chart-smooth-line"
                  />

                  <path
                    d={buildSmoothPath(chartData, "bids", chartMax)}
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
                              cy={getChartY(item.tenders, chartMax)}
                              r="6"
                              fill="#2563eb"
                              className="chart-hover-dot"
                            />

                            <circle
                              cx={x}
                              cy={getChartY(item.bids, chartMax)}
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
                    {hoveredMonth.tenderBids?.length ? (
                      hoveredMonth.tenderBids.map((item) => (
                        <span key={item.id}>
                          {item.title}: {item.bids}{" "}
                          {item.bids === 1 ? "bid" : "bids"}
                        </span>
                      ))
                    ) : (
                      <span>Submitted Bids: 0</span>
                    )}
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

                        <td>{getBidsCount(tender)}</td>

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

function getMonthlyChartData(tenders) {
  // Rolling window: last 6 months ending at the current month.
  const now = new Date();
  const months = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    months.push({
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      label: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  const isInMonth = (value, { year, monthIndex }) => {
    if (!value) return false;

    const date = new Date(value);

    return date.getFullYear() === year && date.getMonth() === monthIndex;
  };

  return months.map((month) => {
    const tendersInMonth = tenders.filter((tender) =>
      isInMonth(tender.created_at, month),
    );

    // Contractors cannot fetch per-submission dates (owner-only endpoint),
    // so attribute each tender's bid count to its creation month.
    const tenderBids = tendersInMonth.map((tender) => ({
      id: tender.id,
      title: tender.title,
      bids: getBidsCount(tender),
    }));

    const bidsInMonth = tenderBids.reduce((sum, item) => sum + item.bids, 0);

    return {
      month: month.label,
      tenders: tendersInMonth.length,
      bids: bidsInMonth,
      tenderBids,
    };
  });
}

function getChartMax(chartData) {
  const highest = chartData.reduce(
    (max, item) => Math.max(max, item.tenders, item.bids),
    0,
  );

  // Round up to a multiple of 4 so the 5 axis ticks are whole numbers.
  return Math.max(4, Math.ceil(highest / 4) * 4);
}

function getChartX(index, total) {
  if (total <= 1) return 45;
  return 55 + (index * 670) / (total - 1);
}

function getChartY(value, max = 60) {
  const safeValue = Math.min(Number(value || 0), max);
  return 240 - (safeValue / max) * 200;
}

function buildSmoothPath(chartData, key, max) {
  if (!chartData.length) return "";

  const points = chartData.map((item, index) => ({
    x: getChartX(index, chartData.length),
    y: getChartY(item[key], max),
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