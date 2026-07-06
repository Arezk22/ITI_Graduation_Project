import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getMySubmissions } from "../services/proposalApi";

function ContractorProfile() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredYear, setHoveredYear] = useState(null);

  const companyName = localStorage.getItem("companyName") || "Company Name";
  const userEmail = localStorage.getItem("userEmail") || "email@example.com";

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
          "Load contractor submissions error:",
          error.response?.data || error
        );
        setSubmissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const acceptedSubmissions = useMemo(() => {
    return submissions.filter((submission) => isAwardedSubmission(submission));
  }, [submissions]);

  const visibleAwardedSubmissions = acceptedSubmissions.slice(0, 5);

  const totalProjectValue = useMemo(() => {
    return acceptedSubmissions.reduce((sum, submission) => {
      return sum + Number(submission.tender?.budget || 0);
    }, 0);
  }, [acceptedSubmissions]);

  const winRate = useMemo(() => {
    if (!submissions.length) return 0;

    return Math.round((acceptedSubmissions.length / submissions.length) * 100);
  }, [submissions, acceptedSubmissions]);

  const annualAwardData = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];

    return years.map((year) => {
      const count = acceptedSubmissions.filter((submission) => {
        const dateValue =
          submission.accepted_at ||
          submission.tender?.awarded_at ||
          submission.submitted_at;

        if (!dateValue) return false;

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return false;

        return date.getFullYear() === year;
      }).length;

      return { year, count };
    });
  }, [acceptedSubmissions]);

  return (
    <ContractorLayout activePage="profile">
      <section className="contractor-profile-content">
        <div className="contractor-hero-card">
          <div className="contractor-main-info">
            <div className="contractor-avatar">{getInitial(companyName)}</div>

            <div>
              <h2>{companyName}</h2>

              <div className="contractor-contact">
                <span>
                  <i className="bi bi-envelope"></i> {userEmail}
                </span>

                <span>
                  <i className="bi bi-currency-dollar"></i>{" "}
                  {formatShortMoney(getAverageProjectValue(acceptedSubmissions))}{" "}
                  avg project value
                </span>
              </div>
            </div>
          </div>

          <div className="contractor-stats">
            <div>
              <h3>{acceptedSubmissions.length}</h3>
              <p>Projects Accepted</p>
            </div>

            <div>
              <h3>{formatShortMoney(totalProjectValue)}</h3>
              <p>Total Project Value</p>
            </div>

            <div>
              <h3>{winRate}%</h3>
              <p>Win Rate</p>
            </div>

          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Awarded Projects</h5>


            {acceptedSubmissions.length > 0 && (
  <button
    className="view-all-link"
    onClick={() => navigate("/contractor/awarded-projects")}
  >
    View all
  </button>
)}
          </div>

          <div className="profile-projects-list">
            {loading ? (
              <div className="text-muted py-3">Loading awarded projects...</div>
            ) : acceptedSubmissions.length === 0 ? (
              <div className="text-muted py-3">No awarded projects yet.</div>
            ) : (
              visibleAwardedSubmissions.map((submission) => (
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

        <div className="dashboard-card mt-4">
          <h5 className="mb-4 fw-bold">Annual Awarded Projects</h5>

          <div className="annual-award-chart">
            <div className="annual-y-axis">
              {[12, 9, 6, 3, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            <div className="annual-chart-area">
              {annualAwardData.map((item) => (
                <div
                  className="annual-award-group"
                  key={item.year}
                  onMouseEnter={() => setHoveredYear(item)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
                  <div className="annual-award-bar-wrap">
                    <span
                      className="annual-award-bar"
                      style={{
                        height: `${Math.max(
                          (item.count / 12) * 100,
                          item.count ? 6 : 2
                        )}%`,
                      }}
                    ></span>

                    {hoveredYear?.year === item.year && (
                      <div className="annual-tooltip">
                        <strong>{item.year}</strong>
                        <span>{item.count} awarded</span>
                      </div>
                    )}
                  </div>

                  <p>{item.year}</p>
                </div>
              ))}
            </div>
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

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "C";
}

function getAverageProjectValue(acceptedSubmissions) {
  if (!acceptedSubmissions.length) return 0;

  const total = acceptedSubmissions.reduce((sum, submission) => {
    return sum + Number(submission.tender?.budget || 0);
  }, 0);

  return total / acceptedSubmissions.length;
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

function formatShortMoney(value) {
  const number = Number(value || 0);

  if (!number) return "$0";

  if (number >= 1000000) {
    return `$${Math.round(number / 1000000)}M+`;
  }

  if (number >= 1000) {
    return `$${Math.round(number / 1000)}K+`;
  }

  return `$${number}`;
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

export default ContractorProfile;