

// import { useNavigate } from "react-router-dom";
// import { ownerDashboardData } from "../data/ownerDashboardData";
// import OwnerLayout from "../components/OwnerLayout";

// function OwnerDashboard() {
//   const data = ownerDashboardData;
//   const navigate = useNavigate();

//   return (
//     <OwnerLayout activePage="dashboard">
//       <section className="dashboard-content">
//         <div className="dashboard-title">
//           <div>
//             <h2>Project Overview</h2>
//             <p>
//               {data.overview.date} · {data.overview.activeTenders} active tenders
//             </p>
//           </div>

//           <button
//             className="btn new-tender-btn"
//             onClick={() => navigate("/owner/create-tender")}
//           >
//             <i className="bi bi-plus-circle"></i>
//             New Tender
//           </button>
//         </div>

//         <div className="row g-4">
//           {data.stats.map((stat, index) => (
//             <div className="col-lg-3 col-md-6" key={index}>
//               <div className="owner-stat-card">
//                 <div className={`stat-icon ${stat.color}`}>
//                   <i className={`bi ${stat.icon}`}></i>
//                 </div>

//                 <i className="bi bi-arrow-up-right stat-arrow"></i>

//                 <h3>{stat.value}</h3>
//                 <p>{stat.title}</p>
//                 <small className={stat.color}>{stat.note}</small>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="row g-4 mt-1">
//           <div className="col-lg-8">
//             <div className="dashboard-card chart-card">
//               <div className="card-header-clean">
//                 <h5>Tender & Bid Activity</h5>

//                 <div className="chart-legend">
//                   <span className="blue-dot"></span> Tenders
//                   <span className="orange-dot"></span> Bids
//                 </div>
//               </div>

//               <div className="fake-chart">
//                 <svg viewBox="0 0 700 260" preserveAspectRatio="none">
//                   <polyline
//                     points="20,210 120,195 220,200 320,190 420,175 520,180 680,165"
//                     fill="none"
//                     stroke="#2563eb"
//                     strokeWidth="3"
//                   />
//                   <polyline
//                     points="20,170 120,145 220,150 320,160 420,95 520,110 680,55"
//                     fill="none"
//                     stroke="#f97316"
//                     strokeWidth="3"
//                   />
//                 </svg>

//                 <div className="chart-months">
//                   <span>Jan</span>
//                   <span>Feb</span>
//                   <span>Mar</span>
//                   <span>Apr</span>
//                   <span>May</span>
//                   <span>Jun</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="col-lg-4">
//             <div className="dashboard-card insights-card">
//               <h5>
//                 <i className="bi bi-cpu text-primary"></i>
//                 AI Insights
//               </h5>

//               {data.insights.map((item, index) => (
//                 <div className={`insight-box ${item.type}`} key={index}>
//                   <p>{item.text}</p>
//                   <a href="#">{item.action}</a>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="dashboard-card mt-4">
//           <div className="card-header-clean">
//             <h5>Recent Tenders</h5>
//             <a href="#">
//               View all <i className="bi bi-chevron-right"></i>
//             </a>
//           </div>

//           <div className="table-responsive">
//             <table className="table owner-table align-middle">
//               <thead>
//                 <tr>
//                   <th>Tender ID</th>
//                   <th>Project Name</th>
//                   <th>Status</th>
//                   <th>Bids</th>
//                   <th>Budget</th>
//                   <th>Deadline</th>
//                   <th>Risk</th>
//                   <th></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {data.tenders.map((tender) => (
//                   <tr key={tender.id}>
//                     <td>{tender.id}</td>
//                     <td className="fw-bold">{tender.name}</td>
//                     <td>
//                       <span
//                         className={`status-badge ${tender.status
//                           .replaceAll(" ", "-")
//                           .toLowerCase()}`}
//                       >
//                         {tender.status}
//                       </span>
//                     </td>
//                     <td>{tender.bids}</td>
//                     <td className="fw-bold">{tender.budget}</td>
//                     <td>
//                       <i className="bi bi-clock me-1"></i>
//                       {tender.deadline}
//                     </td>
//                     <td>
//                       <span className={`risk ${tender.risk.toLowerCase()}`}>
//                         {tender.risk}
//                       </span>
//                     </td>
//                     <td>
//                       <button className="table-eye">
//                         <i className="bi bi-eye"></i>
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//     </OwnerLayout>
//   );
// }

// export default OwnerDashboard;



import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { getAllTenders } from "../services/tenderApi";

function OwnerDashboard() {
  const navigate = useNavigate();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setTenders(list);
      })
      .catch((error) => {
        console.error("Load owner tenders error:", error.response?.data || error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const today = new Date();

  const totalTenders = tenders.length;

  const tendersThisMonth = tenders.filter((tender) =>
    isSameMonth(tender.created_at, today)
  ).length;

  const activeTenders = tenders.filter((tender) => {
    return getTenderDisplayStatus(tender) === "Active";
  }).length;

  const totalBids = tenders.reduce((sum, tender) => {
    return sum + getBidsCount(tender);
  }, 0);

  const bidsThisWeek = tenders.reduce((sum, tender) => {
    return sum + getBidsThisWeek(tender);
  }, 0);

  const chartData = useMemo(() => {
    return getMonthlyChartData(tenders);
  }, [tenders]);

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
            note={`${bidsThisWeek} this week`}
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
    {[0, 15, 30, 45, 60].map((value) => {
      const y = getChartY(value, 60);

      return (
        <g key={value}>
          <text
            x="10"
            y={y + 4}
            className="chart-axis-label"
          >
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
                        <td className="fw-bold">{formatBudget(tender.budget)}</td>
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
    tender.submissions_count ||
    tender.bids_count ||
    tender.proposals_count ||
    tender.submissions?.length ||
    tender.proposals?.length ||
    0
  );
}

function getBidsThisWeek(tender) {
  const submissions = tender.submissions || tender.proposals || [];

  if (!Array.isArray(submissions)) return 0;

  return submissions.filter((submission) => {
    const date = submission.created_at || submission.submitted_at;
    return isThisWeek(date);
  }).length;
}

function getMonthlyChartData(tenders) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return months.map((month, index) => {
    const tendersInMonth = tenders.filter((tender) => {
      if (!tender.created_at) return false;
      return new Date(tender.created_at).getMonth() === index;
    }).length;

    const bidsInMonth = tenders.reduce((sum, tender) => {
      const submissions = tender.submissions || tender.proposals || [];

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

// function getMaxChartValue(chartData) {
//   const values = chartData.flatMap((item) => [item.tenders, item.bids]);
//   return Math.max(...values, 1);
// }

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