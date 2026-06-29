import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { getTenderById } from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function OwnerCompareSubmission() {
  const navigate = useNavigate();
  const { tenderId } = useParams();

  const [tender, setTender] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTenderById(tenderId), getTenderSubmissions(tenderId)])
      .then(([tenderResponse, submissionsResponse]) => {
        setTender(tenderResponse.data);

        const list = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : submissionsResponse.data.submissions ||
            submissionsResponse.data.results ||
            [];

        setSubmissions(list);
      })
      .catch((error) => {
        console.error(
          "Load all submissions error:",
          error.response?.data || error
        );
        setTender(null);
        setSubmissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenderId]);

  return (
    <OwnerLayout activePage="tender-details">
      <section className="dashboard-content">
        <div className="dashboard-title">
          <div>
            <h2>All Contractor Submissions</h2>
            <p>
              {tender?.title || "Tender"} · {submissions.length} submissions
            </p>
          </div>

          <button
            className="btn modal-cancel-btn"
            onClick={() => navigate(`/owner/tender-details/${tenderId}`)}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Submissions Comparison</h5>
          </div>

          <div className="table-responsive">
            <table className="table tender-submissions-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Tech Score</th>
                  <th>Bid Price</th>
                  <th>Trust</th>
                  <th>Risk</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Loading submissions...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No submissions received yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission, index) => (
                    <tr
                      key={submission.id || index}
                      className="clickable-table-row"
                      onClick={() =>
                        navigate(
                          `/owner/proposal-details/${tenderId}/${submission.id}`
                        )
                      }
                    >
                      <td>
                        {submission.contractor_company_name ||
                          submission.contractor?.company_name ||
                          submission.company_name ||
                          "—"}
                      </td>

                      <td>{formatDate(submission.submitted_at)}</td>

                      <td>
                        <span
                          className={`badge ${getSubmissionStatusBadgeClass(
                            submission.status
                          )}`}
                        >
                          {formatSubmissionStatus(submission.status)}
                        </span>
                      </td>

                      <td>{submission.technical_score ?? "—"}</td>
                      <td>{submission.financial_score ?? "—"}</td>
                      <td>{submission.final_score ?? "—"}</td>
                      <td>{submission.risk_score ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </OwnerLayout>
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

function formatSubmissionStatus(status) {
  if (status === "accepted" || status === "awarded") return "Awarded";
  return "Under Review";
}

function getSubmissionStatusBadgeClass(status) {
  if (status === "accepted" || status === "awarded") {
    return "bg-success-subtle text-success-emphasis";
  }

  return "bg-warning-subtle text-warning-emphasis";
}

export default OwnerCompareSubmission;
