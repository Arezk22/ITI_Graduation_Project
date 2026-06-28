// import OwnerLayout from "../components/OwnerLayout";
// import { useNavigate } from "react-router-dom";

// function Evaluation() {
//     const navigate = useNavigate();
//   const contractors = [
//     { rank: 1, name: "AlSalam Construction", tag: "Recommended", price: "$4.20M", technical: 91, experience: 88, compliance: 96, trust: 88, risk: "Low", score: 91.2 },
//     { rank: 2, name: "Meridian Builders Ltd", price: "$3.95M", technical: 84, experience: 82, compliance: 90, trust: 82, risk: "Medium", score: 84.7 },
//     { rank: 3, name: "Vertex Construction", price: "$4.45M", technical: 88, experience: 79, compliance: 88, trust: 79, risk: "Low", score: 83.1 },
//     { rank: 4, name: "Peak Contracting LLC", price: "$2.78M", note: "Below avg", technical: 76, experience: 68, compliance: 72, trust: 71, risk: "High", score: 70.4 },
//     { rank: 5, name: "Arcline Infrastructure", price: "$5.10M", technical: 72, experience: 74, compliance: 84, trust: 85, risk: "Low", score: 77.2 },
//   ];

//   return (
//     <OwnerLayout activePage="evaluation">
//       <section className="evaluation-content">
//         <div className="evaluation-header">
//           <div>
//             <h2>Tender Evaluation</h2>
//             <p>Eastfield Tower Complex · 12 submissions evaluated by AI</p>
//           </div>

//           <div className="evaluation-actions">
// <button
//   className="btn ai-report-btn"
//   onClick={() => navigate("/owner/ai-analysis")}
// >
//   <i className="bi bi-cpu"></i>
//   AI Risk Report
// </button>

// <button
//   className="btn export-report-btn"
//   onClick={() => navigate("/owner/reports")}
// >
//   <i className="bi bi-download"></i>
//   Export Report
// </button>

//           </div>
//         </div>

//         <div className="ai-recommendation">
//           <div className="ai-icon">
//             <i className="bi bi-cpu"></i>
//           </div>

//           <div>
//             <h5>
//               AI Recommendation <span>92% confidence</span>
//             </h5>
//             <p>
//               <strong>AlSalam Construction</strong> is the recommended contractor.
//               They lead on technical score (91/100), compliance (96/100), and trust
//               (88/100). While not the cheapest bid, their 12-year track record and
//               low risk profile make them the optimal selection for this project's complexity.
//             </p>
//           </div>

//           <div className="rank-badge">
//             <i className="bi bi-trophy"></i>
//             Rank #1
//           </div>
//         </div>

//         <div className="dashboard-card mt-4">
//           <div className="card-header-clean">
//             <h5>Contractor Comparison</h5>
//             <p className="mb-0 text-muted">Select up to 3 for radar comparison</p>
//           </div>

//           <div className="table-responsive">
//             <table className="table evaluation-table align-middle">
//               <thead>
//                 <tr>
//                   <th></th>
//                   <th>Rank</th>
//                   <th>Contractor</th>
//                   <th>Bid Price</th>
//                   <th>Technical</th>
//                   <th>Experience</th>
//                   <th>Compliance</th>
//                   <th>Trust Score</th>
//                   <th>Risk</th>
//                   <th>Final Score</th>
//                   <th></th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {contractors.map((c, index) => (
//                   <tr key={index}>
//                     <td>
//                       <input type="checkbox" defaultChecked={index < 2 || index === 3} />
//                     </td>

//                     <td>
//                       <span className={`eval-rank rank-${c.rank}`}>{c.rank}</span>
//                     </td>

//                     <td>
//                       <strong>{c.name}</strong>
//                       {c.tag && <span className="recommended-tag">{c.tag}</span>}
//                     </td>

//                     <td className={c.note ? "low-bid" : "fw-bold"}>
//                       {c.price}
//                       {c.note && <small>⚠ {c.note}</small>}
//                     </td>

//                     <td><ScoreBar value={c.technical} color="blue" /></td>
//                     <td><ScoreBar value={c.experience} color={c.experience < 75 ? "orange" : "blue"} /></td>
//                     <td><ScoreBar value={c.compliance} color={c.compliance < 80 ? "orange" : "green"} /></td>

//                     <td>{c.trust}</td>

//                     <td>
//                       <span className={`risk-pill ${c.risk.toLowerCase()}`}>
//                         {c.risk}
//                       </span>
//                     </td>

//                     <td className={`final-score ${c.score < 80 ? "orange" : "blue"}`}>
//                       {c.score}
//                     </td>

//                     <td>
// <button
//   className="profile-btn"
//   onClick={() => navigate("/owner/contractor-profile")}
// >
//   Profile
// </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="row g-4 mt-1">
//           <div className="col-lg-6">
//             <div className="dashboard-card eval-chart-card">
//               <h5>Bid Price Comparison (USD M)</h5>

//               <div className="bar-chart">
//                 {["AlSalam", "Meridian", "Vertex", "Peak", "Arcline"].map((name, i) => (
//                   <div className="bar-group" key={name}>
//                     <div className="bars">
//                       <span className="bar blue" style={{ height: `${[52, 48, 56, 35, 64][i]}%` }}></span>
//                       <span className="bar peach" style={{ height: "52%" }}></span>
//                     </div>
//                     <p>{name}</p>
//                   </div>
//                 ))}
//               </div>

//               <div className="chart-legend mt-3">
//                 <span className="blue-dot"></span> Bid Price
//                 <span className="peach-dot"></span> Market Avg ($4.15M)
//               </div>
//             </div>
//           </div>

//           <div className="col-lg-6">
//             <div className="dashboard-card radar-card">
//               <h5>Multi-Criteria Comparison</h5>
//               <p>Selected: AlSalam, Meridian, Peak Contracting</p>

//               <div className="radar-placeholder">
//                 <div className="radar-shape shape-blue"></div>
//                 <div className="radar-shape shape-orange"></div>
//                 <div className="radar-shape shape-red"></div>
//                 <span className="radar-label top">Technical</span>
//                 <span className="radar-label right">Experience</span>
//                 <span className="radar-label bottom-right">Compliance</span>
//                 <span className="radar-label bottom-left">Trust</span>
//                 <span className="radar-label left">Price</span>
//               </div>

//               <div className="chart-legend mt-3">
//                 <span className="blue-dot"></span> AlSalam
//                 <span className="orange-dot"></span> Meridian
//                 <span className="red-dot"></span> Peak
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </OwnerLayout>
//   );
// }

// function ScoreBar({ value, color }) {
//   return (
//     <div className="score-wrap">
//       <div className="score-line">
//         <span className={color} style={{ width: `${value}%` }}></span>
//       </div>
//       <b>{value}</b>
//     </div>
//   );
// }

// export default Evaluation;
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
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

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
        setLoadingTenders(false);
      });
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
      score: submission.final_score || submission.ai_score || 0,
    }));
  }, [submissions]);

  return (
    <OwnerLayout activePage="evaluation">
      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Tender Evaluation</h2>

            <div className="tender-dropdown-wrapper">
              <button
                type="button"
                className="tender-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div>
                  <strong>
                    {loadingTenders
                      ? "Loading tenders..."
                      : selectedTender?.title || "Select tender"}
                  </strong>
                  <span>
                    {selectedTender
                      ? `${submissions.length} submissions`
                      : "Choose project to evaluate"}
                  </span>
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
                        <strong>{tender.title}</strong>
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

                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>

                      <td>
                        <div className="evaluation-row-actions">
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

                          <button
                            className="proposal-btn"
                            onClick={() =>
                              navigate(
                                `/owner/proposal-details/${submission.id}`
                              )
                            }
                          >
                            Proposal
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
              <h5>Contractor Score Comparison</h5>

              <div className="contractor-score-chart">
                <div className="score-axis">
                  {[100, 80, 60, 40, 20, 0].map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>

                <div className="score-chart-bars">
                  {chartSubmissions.length === 0 ? (
                    <div className="empty-chart-message">
                      No proposal scores available yet.
                    </div>
                  ) : (
                    chartSubmissions.map((item) => (
                      <div className="score-bar-group" key={item.name}>
                        <div className="score-bar-area">
                          <span
                            className="score-bar"
                            style={{ height: `${item.score}%` }}
                          ></span>
                        </div>
                        <p title={item.name}>{shortName(item.name)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
    submission.company_name ||
    submission.contractor?.company_name ||
    submission.contractor?.first_name ||
    submission.user?.company_name ||
    submission.user?.first_name ||
    `Contractor ${index + 1}`
  );
}

function getContractorId(submission) {
  return (
    submission.contractor_id ||
    submission.contractor?.id ||
    submission.user?.id ||
    submission.id
  );
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