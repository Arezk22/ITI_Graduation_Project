import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";
import { getMySubmissions } from "../services/proposalApi";

const CATEGORIES = [
  { value: "All", label: "Filter" },
  { value: "construction", label: "Construction" },
  { value: "roads", label: "Roads & Infrastructure" },
  { value: "buildings", label: "Buildings" },
  { value: "electrical", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "water", label: "Water & Sewage" },
  { value: "it", label: "IT & Telecom" },
  { value: "consulting", label: "Consulting" },
  { value: "supplies", label: "Supplies & Procurement" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

function ContractorDashboard() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
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
          : response.data.tenders || response.data.results || [];

        setTenders(list);
      })
      .catch((error) => {
        console.error(
          "Load available tenders error:",
          error.response?.data || error,
        );
        setTenders([]);
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
        setProposals([]);
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

  const submittedTenderIds = new Set(
    proposals
      .map((proposal) => proposal.tender?.id || proposal.tender_id)
      .filter((id) => id != null),
  );

  const awardedProposals = proposals.filter((proposal) =>
    isAwardedProposal(proposal),
  );

  const activeProposals = proposals.filter(
    (proposal) => !isAwardedProposal(proposal),
  );

  const visibleProposals = proposals.slice(0, 5);

  const selectedCategoryLabel =
    CATEGORIES.find((item) => item.value === activeCategory)?.label || "Filter";

  const search = searchTerm.toLowerCase().trim();

  const filteredTenders = tenders.filter((tender) => {
    const isSubmitted = submittedTenderIds.has(tender.id);
    const isExpired = isExpiredTender(tender);

    if (isExpired && !isSubmitted) return false;
    if (tender.status === "closed" && !isSubmitted) return false;
    if (tender.status === "awarded" && !isSubmitted) return false;

    const matchesCategory =
      activeCategory === "All" || tender.project_category === activeCategory;

    const matchesSearch =
      !search ||
      tender.title?.toLowerCase().includes(search) ||
      tender.description?.toLowerCase().includes(search) ||
      tender.location?.toLowerCase().includes(search) ||
      formatCategory(tender.project_category).toLowerCase().includes(search) ||
      tender.project_category?.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  const hasNoTendersAvailable = !loadingTenders && tenders.length === 0;

  const hasNoMatchingTenders =
    !loadingTenders && tenders.length > 0 && filteredTenders.length === 0;

  return (
    <ContractorLayout activePage="dashboard">
      <section className="contractor-dashboard-content">
        <div className="contractor-dashboard-header">
          <div>
            <p>{companyName}</p>
            <h6>Contractor Dashboard</h6>
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
            icon="bi-file-earmark-check"
            value={activeProposals.length}
            title="Active Proposals"
            note={`${awardedProposals.length} awarded`}
            color="blue"
          />

          <StatCard
            icon="bi-graph-up-arrow"
            value={getWinRate(proposals)}
            title="Win Rate"
            note={`${awardedProposals.length} of ${proposals.length} bids`}
            color="green"
          />

          <StatCard
            icon="bi-arrow-up-right"
            value={getAvgAiScore(proposals)}
            title="Avg AI Score"
            color="purple"
          />
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-12">
            <div className="contractor-card">
              <div className="card-header-clean">
                <div>
                  <h5>My Proposals</h5>

                  <p className="mb-0 text-muted">
                    {loadingProposals
                      ? "Loading submissions..."
                      : `${proposals.length} Total Submissions`}
                  </p>
                </div>

                {proposals.length > 0 && (
                  <button
                    type="button"
                    className="view-all-link"
                    onClick={() => navigate("/contractor/proposals")}
                  >
                    View all <i className="bi bi-chevron-right"></i>
                  </button>
                )}
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
                visibleProposals.map((proposal) => (
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

        <div className="contractor-card available-tenders-card mt-4">
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

              <div className="contractor-filter-wrap">
                <button
                  type="button"
                  className="contractor-filter-btn"
                  onClick={() => setFilterOpen((prev) => !prev)}
                >
                  <span>{selectedCategoryLabel}</span>

                  <i
                    className={`bi ${
                      filterOpen ? "bi-chevron-up" : "bi-chevron-down"
                    }`}
                  ></i>
                </button>

                {filterOpen && (
                  <div className="contractor-filter-menu">
                    {CATEGORIES.map((category) => (
                      <button
                        type="button"
                        key={category.value}
                        className={
                          activeCategory === category.value ? "active" : ""
                        }
                        onClick={() => {
                          setActiveCategory(category.value);
                          setFilterOpen(false);
                        }}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                )}
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
            <div className="available-tenders-list">
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
    <div className="col-lg-4 col-md-6">
      <div className="contractor-stat-card">
        <div className={`contractor-stat-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>

        <h3>{value}</h3>
        <p>{title}</p>
        {note && <small className={color}>{note}</small>}
      </div>
    </div>
  );
}

function ProposalRow({ title, date, score, status, rank, trophy }) {
  const normalizedStatus = normalizeStatusClass(status);

  return (
    <div className="proposal-row">
      <div className="proposal-main-info">
        <h6>{title}</h6>
        <p>{date}</p>
      </div>

      {score && (
        <div className="proposal-score">
          <strong>{score}</strong>
          <span>AI Score</span>
        </div>
      )}

      <div className="proposal-actions-right">
        <span className={`proposal-status ${normalizedStatus}`}>{status}</span>

        {rank && <b className="proposal-rank">{rank}</b>}
        {trophy && <i className="bi bi-trophy-fill trophy-icon"></i>}
      </div>
    </div>
  );
}

function TenderRow({ tender, isAlreadySubmitted = false, onOpen }) {
  const navigate = useNavigate();
  const daysLeft = getDaysLeft(tender.deadline_at);

  return (
    <div className="available-tender-row clickable-tender-row" onClick={onOpen}>
      <div className="tender-row-left">
        <h6>
          {tender.title}
          <span>{formatCategory(tender.project_category)}</span>
        </h6>

        <p>
          <span>
            <i className="bi bi-geo-alt"></i> {tender.location || "N/A"}
          </span>

          <span>
            <i className="bi bi-clock"></i> Deadline{" "}
            {formatDate(tender.deadline_at)}
          </span>

          <span
            className={`days-left ${
              daysLeft <= 3 || daysLeft < 0 ? "danger" : ""
            }`}
          >
            {getDaysLeftLabel(tender.deadline_at)}
          </span>
        </p>
      </div>

      <div className="tender-row-right">
        <button
          className="owner-profile-small-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/contractor/owner-profile/${tender.owner}`);
          }}
        >
          Owner Profile
        </button>
        <button
          className="submit-bid-btn btn d-inline-flex align-items-center justify-content-center text-nowrap"
          style={{
            width: "160px",
            height: "45px",
            // لو تم التقديم يخلى الخلفية رمادي باهت، ولو لسه يخليها لونها الأصلي (أو شيليه عشان ياخد كلاس البوتستراب)
            backgroundColor: isAlreadySubmitted ? "#6c757d" : "",
            color: isAlreadySubmitted ? "#fff" : "",
            opacity: isAlreadySubmitted ? "0.65" : "1",
            borderColor: isAlreadySubmitted ? "#6c757d" : "",
          }}
          disabled={isAlreadySubmitted}
          onClick={(e) => {
            e.stopPropagation();
            if (isAlreadySubmitted) return;
            navigate(`/contractor/submit-proposal/${tender.id}`);
          }}
        >
          {isAlreadySubmitted ? "Submitted" : "Submit Bid"}
          {!isAlreadySubmitted && <i className="bi bi-chevron-right ms-2"></i>}
        </button>
      </div>
    </div>
  );
}

function isAwardedProposal(proposal) {
  return (
    proposal.status === "accepted" ||
    proposal.status === "awarded" ||
    proposal.tender?.status === "awarded"
  );
}

function normalizeStatusClass(status) {
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");

  if (normalized === "accepted") return "under-review";

  return normalized;
}

function getAvgAiScore(proposals) {
  const scores = proposals
    .map((proposal) => proposal.final_score)
    .filter((score) => score != null);

  if (!scores.length) return "N/A";

  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return `${Math.round(avg)}/100`;
}

function getWinRate(proposals) {
  if (!proposals.length) return "0%";

  const awarded = proposals.filter((proposal) =>
    isAwardedProposal(proposal),
  ).length;

  return `${Math.round((awarded / proposals.length) * 100)}%`;
}

function isExpiredTender(tender) {
  if (!tender?.deadline_at) return false;

  const today = new Date();
  const deadline = new Date(tender.deadline_at);

  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
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

function getDaysLeftLabel(deadline) {
  if (!deadline) return "No deadline";

  const days = getDaysLeft(deadline);

  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";

  return `${days} days left`;
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
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
