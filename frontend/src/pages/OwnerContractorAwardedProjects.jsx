import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import api from "../services/api";

function OwnerContractorAwardedProjects() {
  const navigate = useNavigate();
  const { contractorId } = useParams();

  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!contractorId) return;

      try {
        const profileResponse = await api.get(`/contractor/${contractorId}/`);
        setProfile(profileResponse.data);

        const submissionsResponse = await api.get(
          `/contractor/${contractorId}/submissions/`,
        );

        const list = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : submissionsResponse.data.submissions ||
            submissionsResponse.data.results ||
            [];

        setSubmissions(list);
      } catch (error) {
        console.error(
          "Load contractor profile error:",
          error.response?.data || error,
        );

        setProfile(null);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [contractorId]);

  const awardedSubmissions = useMemo(() => {
    return submissions.filter((submission) => isAwardedSubmission(submission));
  }, [submissions]);

  const companyName =
    profile?.company_name ||
    awardedSubmissions[0]?.contractor_company_name ||
    submissions[0]?.contractor_company_name ||
    "Contractor";

  return (
    <OwnerLayout activePage="evaluation">
      <section className="contractor-profile-content">
        <div className="all-proposals-header">
          <div>
            <h2>{companyName} — Awarded Projects</h2>
            <p>{awardedSubmissions.length} awarded projects</p>
          </div>

          <button className="btn ai-report-btn" onClick={() => navigate(-1)}>
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
              <div className="text-muted py-3">
                No awarded projects for this contractor yet.
              </div>
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
                          submission.submitted_at,
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
    </OwnerLayout>
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

export default OwnerContractorAwardedProjects;
