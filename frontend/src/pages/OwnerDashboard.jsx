

import { useNavigate } from "react-router-dom";
import { ownerDashboardData } from "../data/ownerDashboardData";
import OwnerLayout from "../components/OwnerLayout";

function OwnerDashboard() {
  const data = ownerDashboardData;
  const navigate = useNavigate();

  return (
    <OwnerLayout activePage="dashboard">
      <section className="dashboard-content">
        <div className="dashboard-title">
          <div>
            <h2>Project Overview</h2>
            <p>
              {data.overview.date} · {data.overview.activeTenders} active tenders
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
          {data.stats.map((stat, index) => (
            <div className="col-lg-3 col-md-6" key={index}>
              <div className="owner-stat-card">
                <div className={`stat-icon ${stat.color}`}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>

                <i className="bi bi-arrow-up-right stat-arrow"></i>

                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <small className={stat.color}>{stat.note}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <div className="dashboard-card chart-card">
              <div className="card-header-clean">
                <h5>Tender & Bid Activity</h5>

                <div className="chart-legend">
                  <span className="blue-dot"></span> Tenders
                  <span className="orange-dot"></span> Bids
                </div>
              </div>

              <div className="fake-chart">
                <svg viewBox="0 0 700 260" preserveAspectRatio="none">
                  <polyline
                    points="20,210 120,195 220,200 320,190 420,175 520,180 680,165"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <polyline
                    points="20,170 120,145 220,150 320,160 420,95 520,110 680,55"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                  />
                </svg>

                <div className="chart-months">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="dashboard-card insights-card">
              <h5>
                <i className="bi bi-cpu text-primary"></i>
                AI Insights
              </h5>

              {data.insights.map((item, index) => (
                <div className={`insight-box ${item.type}`} key={index}>
                  <p>{item.text}</p>
                  <a href="#">{item.action}</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Recent Tenders</h5>
            <a href="#">
              View all <i className="bi bi-chevron-right"></i>
            </a>
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
                  <th>Risk</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {data.tenders.map((tender) => (
                  <tr key={tender.id}>
                    <td>{tender.id}</td>
                    <td className="fw-bold">{tender.name}</td>
                    <td>
                      <span
                        className={`status-badge ${tender.status
                          .replaceAll(" ", "-")
                          .toLowerCase()}`}
                      >
                        {tender.status}
                      </span>
                    </td>
                    <td>{tender.bids}</td>
                    <td className="fw-bold">{tender.budget}</td>
                    <td>
                      <i className="bi bi-clock me-1"></i>
                      {tender.deadline}
                    </td>
                    <td>
                      <span className={`risk ${tender.risk.toLowerCase()}`}>
                        {tender.risk}
                      </span>
                    </td>
                    <td>
                      <button className="table-eye">
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default OwnerDashboard;