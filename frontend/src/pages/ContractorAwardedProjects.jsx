import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getMySubmissions } from "../services/proposalApi";

function ContractorAwardedProjects() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySubmissions()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setSubmissions(list);
      })
      .catch((error) => {
        console.error(
          "Load awarded projects error:",
          error.response?.data || error
        );
        setSubmissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const awardedSubmissions = useMemo(() => {
    return submissions.filter((submission) => isAwardedSubmission(submission));
  }, [submissions]);

  return (
    <ContractorLayout activePage="profile">
      <section className="contractor-profile-content">
        <div className="dashboard-title">
          <div>
            <h2>Awarded Projects</h2>
            <p>{awardedSubmissions.length} awarded projects</p>
          </div>

          <button
            className="btn my-profile-btn"
            onClick={() => navigate("/contractor/profile")}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>All Awarded Projects</h5>
          </div>

          <div className="profile-projects-list">
            {loading ? (
              <div className="text-muted py-3">Loading awarded projects...</div>
            ) : awardedSubmissions.length === 0 ? (
              <div className="text-muted py-3">No awarded projects yet.</div>
            ) : (
              awardedSubmissions.map((submission) => (
                <div
                  className="profile-project-row contractor-proposal-row"
                  key={submission.id}
                >
                  <div className="proposal-project-info">
                    <h5>
                      {submission.tender?.title ||
                        `Tender ${submission.tender_id || ""}`}
                      <span>
                        {formatCategory(submission.tender?.project_category)}
                      </span>
                    </h5>

                    <p>
                      <i className="bi bi-currency-dollar"></i>{" "}
                      {formatMoney(submission.tender?.budget)}{" "}
                      <i className="bi bi-calendar ms-2"></i> Awarded{" "}
                      {formatDate(
                        submission.accepted_at ||
                          submission.tender?.awarded_at ||
                          submission.submitted_at
                      )}
                    </p>
                  </div>

                  <span className="completed-badge proposal-status-badge">
                    Awarded
                  </span>
                </div>
              ))
            )}
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
    roads: "Roads",
    buildings: "Buildings",
    electrical: "Electrical",
    mechanical: "Mechanical",
    water: "Water",
    it: "IT",
    consulting: "Consulting",
    supplies: "Supplies",
    maintenance: "Maintenance",
    other: "Other",
  };

  return map[category] || category || "Other";
}

export default ContractorAwardedProjects;