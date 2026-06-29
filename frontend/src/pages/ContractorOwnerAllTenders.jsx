import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getAllTenders } from "../services/tenderApi";

function ContractorOwnerAllTenders() {
  const navigate = useNavigate();
  const { ownerId } = useParams();

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");
const [statusFilterOpen, setStatusFilterOpen] = useState(false);

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
          "Load owner tenders error:",
          error.response?.data || error
        );
        setTenders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId]);

  const filteredTenders = useMemo(() => {
    return tenders
      .filter((tender) => {
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
          !search ||
          tender.title?.toLowerCase().includes(search) ||
          tender.location?.toLowerCase().includes(search) ||
          tender.project_category?.toLowerCase().includes(search) ||
          formatCategory(tender.project_category).toLowerCase().includes(search);

        const displayStatus = getTenderDisplayStatus(tender).toLowerCase();

        const matchesStatus =
          statusFilter === "all" || displayStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline_at || 0);
        const dateB = new Date(b.deadline_at || 0);
        return dateA - dateB;
      });
  }, [tenders, searchTerm, statusFilter]);

  const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "awarded", label: "Awarded" },
];

const selectedStatusLabel =
  statusOptions.find((item) => item.value === statusFilter)?.label ||
  "All Status";

  return (
    <ContractorLayout activePage="dashboard">
      <section className="dashboard-content">
        <div className="dashboard-title">
          <div>
            <h2>All Owner Tenders</h2>
            <p>{filteredTenders.length} tenders found</p>
          </div>

          <button
            className="btn my-profile-btn"
            onClick={() => navigate(`/contractor/owner-profile/${ownerId}`)}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean all-tenders-header">
            <h5>Tenders List</h5>

            <div className="all-tenders-actions">
              <div className="mini-search">
                <i className="bi bi-search"></i>
                <input
                  placeholder="Search tenders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>


              <div className="owner-tenders-filter-wrap">
  <button
    type="button"
    className="owner-tenders-filter-btn"
    onClick={() => setStatusFilterOpen((prev) => !prev)}
  >
    <span>{selectedStatusLabel}</span>
    <i
      className={`bi ${
        statusFilterOpen ? "bi-chevron-up" : "bi-chevron-down"
      }`}
    ></i>
  </button>

  {statusFilterOpen && (
    <div className="owner-tenders-filter-menu">
      {statusOptions.map((option) => (
        <button
          type="button"
          key={option.value}
          className={statusFilter === option.value ? "active" : ""}
          onClick={() => {
            setStatusFilter(option.value);
            setStatusFilterOpen(false);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )}
</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table owner-table align-middle">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      Loading tenders...
                    </td>
                  </tr>
                ) : filteredTenders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No tenders found.
                    </td>
                  </tr>
                ) : (
                  filteredTenders.map((tender) => {
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

                        <td className="fw-bold">
                          <div>{tender.title}</div>
                          <small className="text-muted">
                            {formatCategory(tender.project_category)} ·{" "}
                            {tender.location || "N/A"}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${displayStatus
                              .replaceAll(" ", "-")
                              .toLowerCase()}`}
                          >
                            {displayStatus}
                          </span>
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
    </ContractorLayout>
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

export default ContractorOwnerAllTenders;