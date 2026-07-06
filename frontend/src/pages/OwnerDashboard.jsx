

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { getAllTenders } from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function OwnerDashboard() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenderSubmissions, setTenderSubmissions] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        // const list = Array.isArray(response.data)
        //   ? response.data
        //   : response.data.results || [];
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        setTenders(list);
      })
      .catch((error) => {
        console.error(
          "Load owner tenders error:",
          error.response?.data || error,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!tenders.length) return;

    setSubmissionsLoading(true);
    Promise.allSettled(
      tenders.map((tender) =>
        getTenderSubmissions(tender.id).then((response) => [
          tender.id,
          Array.isArray(response.data)
            ? response.data
            : response.data.submissions || [],
        ]),
      ),
    )
      .then((results) => {
        const submissionsMap = {};
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const [tenderId, submissions] = result.value;
            submissionsMap[tenderId] = submissions;
          }
        });
        setTenderSubmissions(submissionsMap);
      })
      .finally(() => setSubmissionsLoading(false));
  }, [tenders]);

  const today = new Date();

  const totalTenders = tenders.length;

  const tendersThisMonth = tenders.filter((tender) =>
    isSameMonth(tender.created_at, today),
  ).length;

  const activeTenders = tenders.filter((tender) => {
    return getTenderDisplayStatus(tender) === "Active";
  }).length;

  const totalBids = tenders.reduce((sum, tender) => {
    // Prefer submissions fetched in `tenderSubmissions` (if present),
    // otherwise fall back to counts available on the tender object.
    const subs = tenderSubmissions?.[tender.id];
    const count = Array.isArray(subs) ? subs.length : getBidsCount(tender);
    return sum + count;
  }, 0);

  const bidsThisWeek = tenders.reduce((sum, tender) => {
    return sum + getBidsThisWeek(tender, tenderSubmissions);
  }, 0);

  const chartData = useMemo(() => {
    return getMonthlyChartData(tenders, tenderSubmissions);
  }, [tenders, tenderSubmissions]);

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
    <OwnerLayout activePage="dashboard">
      <section className="dashboard-content">
        <div className="dashboard-title">
          <div>
            <h2>Project Overview</h2>
            <p>
              {formatToday()} · {activeTenders} active tenders
            </p>
          </div>

          <button
            className="btn new-tender-btn"
            onClick={() => navigate("/owner/create-tender")}
          >
            <i className="bi bi-plus-circle"></i>
            New Tender
          </button>
        </div>

        <div className="row g-4">
          <StatCard
            icon="bi-file-earmark-text"
            value={totalTenders}
            title="Total Tenders"
            note={`+${tendersThisMonth} this month`}
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
            note={`This week: ${bidsThisWeek}`}
            color="purple"
          />

          <StatCard
            icon="bi-exclamation-triangle"
            value="0"
            title="AI Risk Flags"
            note="No high priority"
            color="red"
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
                  {/* Y axis labels + grid lines */}
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

                  {/* Smooth lines */}
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

                  {/* Hover areas only */}
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
                              index,
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
                      left: `${Math.min(Math.max(hoveredMonth.x - 25, 70), 610)}px`,
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
              onClick={() => navigate("/owner/all-tenders")}
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
                  <th>Budget</th>
                  <th>Deadline</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Loading tenders...
                    </td>
                  </tr>
                ) : recentTenders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No tenders found.
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
                          navigate(`/owner/tender-details/${tender.id}`)
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
                        <td className="fw-bold">
                          {formatBudget(tender.budget)}
                        </td>
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
    </OwnerLayout>
  );
}

function StatCard({ icon, value, title, note, color }) {
  return (
    <div className="col-lg-3 col-md-6">
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

function getBidsThisWeek(tender, tenderSubmissions) {
  const submissions =
    tenderSubmissions?.[tender.id] ||
    tender.submissions ||
    tender.proposals ||
    [];

  if (!Array.isArray(submissions)) return 0;

  return submissions.filter((submission) => {
    const date = submission.created_at || submission.submitted_at;
    return isThisWeek(date);
  }).length;
}

function getMonthlyChartData(tenders, tenderSubmissions = {}) {
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
    ).length;

    const bidsInMonth = tenders.reduce((sum, tender) => {
      const submissions =
        tenderSubmissions?.[tender.id] || tender.submissions || tender.proposals || [];

      if (!Array.isArray(submissions)) return sum;

      const count = submissions.filter((submission) =>
        isInMonth(submission.submitted_at || submission.created_at, month),
      ).length;

      return sum + count;
    }, 0);

    return {
      month: month.label,
      tenders: tendersInMonth,
      bids: bidsInMonth,
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

function isSameMonth(date, today) {
  if (!date) return false;

  const target = new Date(date);

  return (
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}

function isThisWeek(date) {
  if (!date) return false;

  const current = new Date();
  const target = new Date(date);

  const firstDay = new Date(current);
  firstDay.setDate(current.getDate() - current.getDay());
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 7);

  return target >= firstDay && target < lastDay;
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

function formatBudget(value) {
  if (!value) return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  if (number >= 1000000) {
    return `$${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `$${(number / 1000).toFixed(1)}K`;
  }

  return `$${number}`;
}

function formatTenderId(id) {
  return `T-${String(id).padStart(4, "0")}`;
}

export default OwnerDashboard;
