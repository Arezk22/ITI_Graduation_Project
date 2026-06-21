import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";

function ContractorDashboard() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  const tenders = [
    {
      title: "Eastfield Tower Complex",
      category: "Commercial",
      location: "Dubai, UAE",
      budget: "$8.4M",
      deadline: "Deadline Jun 28, 2026",
      bids: "12 bids",
      match: "94%",
    },
    {
      title: "Greenview Residential Phase 3",
      category: "Residential",
      location: "Abu Dhabi, UAE",
      budget: "$3.1M",
      deadline: "Deadline Jul 10, 2026",
      bids: "6 bids",
      match: "87%",
    },
    {
      title: "Harbor Industrial Park",
      category: "Industrial",
      location: "Sharjah, UAE",
      budget: "$5.8M",
      deadline: "Deadline Jul 20, 2026",
      bids: "9 bids",
      match: "72%",
      warning: true,
    },
    {
      title: "Downtown Metro Station",
      category: "Infrastructure",
      location: "Dubai, UAE",
      budget: "$12.2M",
      deadline: "Deadline Aug 5, 2026",
      bids: "4 bids",
      match: "65%",
      muted: true,
    },
  ];

  const filteredTenders =
    activeCategory === "All"
      ? tenders
      : tenders.filter((tender) => tender.category === activeCategory);

  return (
    <ContractorLayout activePage="dashboard">
      <section className="contractor-dashboard-content">
        <div className="contractor-dashboard-header">
          <div>
            <h2>Contractor Dashboard</h2>
            <p>AlSalam Construction · Trust Score: 88/100</p>
          </div>

          <button
            className="btn my-profile-btn"
            onClick={() => navigate("/contractor/profile")}
          >
            <i className="bi bi-star"></i>
            My Profile
          </button>
        </div>

        <div className="row g-4">
          <StatCard
            icon="bi-star"
            value="88/100"
            title="Trust Score"
            note="+2 this month"
            color="orange"
          />
          <StatCard
            icon="bi-file-earmark-check"
            value="3"
            title="Active Proposals"
            note="2 under review"
            color="blue"
          />
          <StatCard
            icon="bi-graph-up-arrow"
            value="64%"
            title="Win Rate"
            note="7 of 11 tenders"
            color="green"
          />
          <StatCard
            icon="bi-arrow-up-right"
            value="86"
            title="Avg AI Score"
            note="Top 15% nationally"
            color="purple"
          />
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <div className="contractor-card">
              <div className="card-header-clean">
                <h5>My Proposals</h5>
                <p className="mb-0 text-muted">4 total submissions</p>
              </div>

              <ProposalRow
                title="Riverside Commercial Park"
                date="Submitted May 22, 2026"
                status="Under Review"
              />

              <ProposalRow
                title="Central Station Retrofit"
                date="Submitted May 8, 2026"
                score="91/100"
                status="Awarded"
                trophy
              />

              <ProposalRow
                title="Al Noor Medical Extension"
                date="Submitted Apr 30, 2026"
                score="88/100"
                status="Shortlisted"
                rank="Top 3"
              />

              <ProposalRow
                title="Westside Logistics Hub"
                date="Submitted Mar 15, 2026"
                score="74/100"
                status="Not Selected"
                rank="4th"
              />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="contractor-card performance-card">
              <h5>Performance Profile</h5>
              <p>Based on last 5 tender evaluations</p>

              <div className="radar-placeholder contractor-radar">
                <div className="radar-shape shape-blue"></div>
                <span className="radar-label top">Technical</span>
                <span className="radar-label right">Financial</span>
                <span className="radar-label bottom-right">Experience</span>
                <span className="radar-label bottom-left">Compliance</span>
                <span className="radar-label left">Delivery</span>
              </div>

              <div className="profile-link-row">
                <span>
                  Overall: <strong>88/100</strong>
                </span>

                <button
                  className="full-profile-link"
                  onClick={() => navigate("/contractor/profile")}
                >
                  Full Profile <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="contractor-card mt-4">
          <div className="available-tenders-header">
            <h5>Available Tenders</h5>

            <div className="available-filters">
              <div className="mini-search">
                <i className="bi bi-search"></i>
                <input placeholder="Search tenders..." />
              </div>

              {["All", "Commercial", "Residential", "Infrastructure", "Industrial"].map(
                (category) => (
                  <button
                    key={category}
                    className={activeCategory === category ? "active" : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                )
              )}
            </div>
          </div>

          {filteredTenders.map((tender) => (
            <TenderRow
              key={tender.title}
              title={tender.title}
              category={tender.category}
              location={tender.location}
              budget={tender.budget}
              deadline={tender.deadline}
              bids={tender.bids}
              match={tender.match}
              warning={tender.warning}
              muted={tender.muted}
            />
          ))}
        </div>
      </section>
    </ContractorLayout>
  );
}

function StatCard({ icon, value, title, note, color }) {
  return (
    <div className="col-lg-3 col-md-6">
      <div className="contractor-stat-card">
        <div className={`contractor-stat-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h3>{value}</h3>
        <p>{title}</p>
        <small className={color}>{note}</small>
      </div>
    </div>
  );
}

function ProposalRow({ title, date, score, status, rank, trophy }) {
  return (
    <div className="proposal-row">
      <div>
        <h6>{title}</h6>
        <p>{date}</p>
      </div>

      {score && (
        <div className="proposal-score">
          <strong>{score}</strong>
          <span>AI Score</span>
        </div>
      )}

      <span
        className={`proposal-status ${status
          .toLowerCase()
          .replaceAll(" ", "-")}`}
      >
        {status}
      </span>

      {rank && <b className="proposal-rank">{rank}</b>}
      {trophy && <i className="bi bi-trophy-fill trophy-icon"></i>}
    </div>
  );
}

function TenderRow({
  title,
  category,
  location,
  budget,
  deadline,
  bids,
  match,
  warning,
  muted,
}) {
  const navigate = useNavigate();

  return (
    <div className="available-tender-row">
      <div>
        <h6>
          {title}
          <span>{category}</span>
        </h6>

        <p>
          <i className="bi bi-geo-alt"></i> {location}
          <i className="bi bi-currency-dollar ms-3"></i> {budget}
          <i className="bi bi-clock ms-3"></i> {deadline}
          <span className="ms-3">{bids}</span>
        </p>
      </div>

      <div className="match-box">
        <strong className={warning ? "warning" : muted ? "muted" : ""}>
          {match}
        </strong>
        <p>Match</p>
      </div>

      <button
        className="submit-bid-btn"
        onClick={() => navigate("/contractor/submit-proposal")}
      >
        Submit Bid <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

export default ContractorDashboard;