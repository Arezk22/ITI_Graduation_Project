import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";
import { getMySubmissions } from "../services/proposalApi";

function ContractorDashboard() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [tenders, setTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);

  const companyName =
    localStorage.getItem("companyName") || "Contractor Company";

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setTenders(list);
      })
      .catch((error) => {
        console.error(
          "Load available tenders error:",
          error.response?.data || error,
        );
      })
      .finally(() => {
        setLoadingTenders(false);
      });
  }, []);

  useEffect(() => {
    getMySubmissions()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setProposals(list);
      })
      .catch((error) => {
        console.error(
          "Load my proposals error:",
          error.response?.data || error,
        );
      })
      .finally(() => {
        setLoadingProposals(false);
      });

    const syncSearch = () => {
      setSearchTerm(localStorage.getItem("contractorTenderSearch") || "");
    };

    syncSearch();

    window.addEventListener("contractorTenderSearchChanged", syncSearch);

    return () => {
      window.removeEventListener("contractorTenderSearchChanged", syncSearch);
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        tenders.map((tender) => tender.project_category).filter(Boolean),
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [tenders]);

  const filteredTenders = useMemo(() => {
    return tenders.filter((tender) => {
      const matchesCategory =
        activeCategory === "All" || tender.project_category === activeCategory;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        tender.title?.toLowerCase().includes(search) ||
        tender.description?.toLowerCase().includes(search) ||
        tender.location?.toLowerCase().includes(search) ||
        tender.project_category?.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [tenders, activeCategory, searchTerm]);

  const hasNoTendersAvailable = !loadingTenders && tenders.length === 0;
  const hasNoMatchingTenders =
    !loadingTenders && tenders.length > 0 && filteredTenders.length === 0;

  const submittedTenderIds = useMemo(() => {
    return new Set(
      proposals
        .map((proposal) => proposal.tender?.id)
        .filter((id) => id != null),
    );
  }, [proposals]);

  return (
    <ContractorLayout activePage="dashboard">
      <section className="contractor-dashboard-content">
        <div className="contractor-dashboard-header">
          <div>
            <h2>Contractor Dashboard</h2>
            <p>{companyName}</p>
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
            value={proposals.length}
            title="Active Proposals"
            note={`${proposals.filter(p => p.status === 'under_review').length} under review`}
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
          <div className="col-lg-12">
            <div className="contractor-card">
              <div className="card-header-clean">
                <h5>My Proposals</h5>
                <p className="mb-0 text-muted">
                  {loadingProposals
                    ? "Loading submissions..."
                    : `${proposals.length} total submissions`}
                </p>
              </div>

              {loadingProposals ? (
                <div className="empty-tenders-message">
                  Loading proposals...
                </div>
              ) : proposals.length === 0 ? (
                <div className="empty-tenders-message">
                  You have not submitted any proposals yet. Submit a tender to
                  see it here.
                </div>
              ) : (
                proposals.map((proposal) => (
                  <ProposalRow
                    key={proposal.id}
                    title={proposal.tender?.title || "Untitled Tender"}
                    date={`Submitted ${formatDate(proposal.submitted_at)}`}
                    score={
                      proposal.final_score != null
                        ? `${Math.round(proposal.final_score)}/100`
                        : null
                    }
                    status={formatProposalStatus(proposal.status)}
                    rank={proposal.rank ? `Rank ${proposal.rank}` : null}
                    trophy={proposal.rank === 1}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="contractor-card mt-4">
          <div className="available-tenders-header">
            <h5>Available Tenders</h5>

            <div className="available-filters">
              <div className="mini-search">
                <i className="bi bi-search"></i>
                <input
                  placeholder="Search tenders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-dropdown">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "Filter" : formatCategory(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingTenders ? (
            <div className="empty-tenders-message">Loading tenders...</div>
          ) : hasNoTendersAvailable ? (
            <div className="empty-tenders-message">
              There are no tenders available for submission right now. Please
              check again later.
            </div>
          ) : hasNoMatchingTenders ? (
            <div className="empty-tenders-message">
              No tenders match your current search or filter.
            </div>
          ) : (
            <div className="available-tenders-scroll">
              {filteredTenders.map((tender) => (
                <TenderRow
                  key={tender.id}
                  tender={tender}
                  isAlreadySubmitted={submittedTenderIds.has(tender.id)}
                  onOpen={() =>
                    navigate(`/contractor/tender-details/${tender.id}`)
                  }
                />
              ))}
            </div>
          )}
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

function TenderRow({ tender, onOpen, isAlreadySubmitted = false }) {
  const navigate = useNavigate();

  const daysLeft = getDaysLeft(tender.deadline_at);

  return (
    <div
      className="available-tender-row clickable-tender-row justify-content-between align-items-center"
      onClick={onOpen}
    >
      <div className="flex-grow-1">
        <h6>
          {tender.title}
          <span>{formatCategory(tender.project_category)}</span>
        </h6>

        <p>
          <i className="bi bi-geo-alt"></i> {tender.location || "N/A"}
          <i className="bi bi-clock ms-3"></i> Deadline{" "}
          {formatDate(tender.deadline_at)}
          <span className={`ms-3 days-left ${daysLeft <= 3 ? "danger" : ""}`}>
            {daysLeft >= 0 ? `${daysLeft} days left` : "Expired"}
          </span>
        </p>
      </div>

      <div className="d-flex flex-column align-items-end gap-2 ms-5">
        {isAlreadySubmitted && (
          <span className="badge bg-success-subtle text-success">
            Already Submitted
          </span>
        )}

        <button
          className="submit-bid-btn"
          disabled={isAlreadySubmitted}
          onClick={(e) => {
            e.stopPropagation();
            if (isAlreadySubmitted) return;
            navigate(`/contractor/submit-proposal/${tender.id}`);
          }}
        >
          {isAlreadySubmitted ? "Submitted" : "Submit Bid"}
          {!isAlreadySubmitted && <i className="bi bi-chevron-right"></i>}
        </button>
      </div>
    </div>
  );
}

function getDaysLeft(deadline) {
  if (!deadline) return 0;

  const today = new Date();
  const deadlineDate = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diff = deadlineDate - today;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatProposalStatus(status) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\w/g, (char) => char.toUpperCase());
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

export default ContractorDashboard;
