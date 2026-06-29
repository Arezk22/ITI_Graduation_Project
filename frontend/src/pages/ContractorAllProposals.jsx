import { useEffect, useMemo, useState } from "react";
import ContractorLayout from "../components/ContractorLayout";
import { getMySubmissions } from "../services/proposalApi";

function ContractorAllProposals() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    getMySubmissions()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setSubmissions(list);
      })
      .catch((error) => {
        console.error("Load proposals error:", error.response?.data || error);
        setSubmissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (categoryFilter === "All") return submissions;

    return submissions.filter(
      (submission) => submission.tender?.project_category === categoryFilter
    );
  }, [submissions, categoryFilter]);

  const categories = [
  { value: "All", label: "All Projects" },
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

const selectedCategoryLabel =
  categories.find((item) => item.value === categoryFilter)?.label ||
  "All Projects";
  

  return (
    <ContractorLayout activePage="profile">
      <section className="contractor-profile-content">
        <div className="all-proposals-header">
          <div>
            <h2>All Proposals</h2>
            {/* <p>Review all tenders you submitted proposals for.</p> */}
          </div>

         <div className="proposal-filter-wrap">
  <label>Project Type</label>

  <div className="proposal-filter-dropdown">
    <button
      type="button"
      className="proposal-filter-btn"
      onClick={() => setFilterOpen((prev) => !prev)}
    >
      <span>{selectedCategoryLabel}</span>
      <i className={`bi ${filterOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
    </button>

    {filterOpen && (
      <div className="proposal-filter-menu">
        {categories.map((category) => (
          <button
            type="button"
            key={category.value}
            className={categoryFilter === category.value ? "active" : ""}
            onClick={() => {
              setCategoryFilter(category.value);
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

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Submitted Proposals</h5>
          </div>

          <div className="all-proposals-table-wrap">
            <table className="table all-proposals-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Deadline</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Loading proposals...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No proposals found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <strong>
                          {submission.tender?.title ||
                            `Tender ${submission.tender_id || ""}`}
                        </strong>
                      </td>

                      <td>{formatCategory(submission.tender?.project_category)}</td>
                      <td>{formatMoney(submission.tender?.budget)}</td>
                      <td>{formatDate(submission.tender?.deadline_at)}</td>
                      <td>{formatDate(submission.submitted_at)}</td>

                      <td>
                        <span
                          className={
                            isAwardedSubmission(submission)
                              ? "completed-badge proposal-status-badge"
                              : "submitted-badge proposal-status-badge"
                          }
                        >
                          {isAwardedSubmission(submission)
                            ? "Awarded"
                            : "Submitted"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </ContractorLayout>
  );
}

function isAwardedSubmission(submission) {
  return (
    submission.status === "accepted" ||
    submission.status === "awarded" ||
    submission.tender?.status === "awarded"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value) {
  if (!value) return "—";

  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
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

export default ContractorAllProposals;