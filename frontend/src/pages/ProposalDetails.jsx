import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { getSubmissionDetail, awardTender } from "../services/proposalApi";

function ProposalDetails() {
  const navigate = useNavigate();
  const { tenderId, submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awardLoading, setAwardLoading] = useState(false);

  useEffect(() => {
    getSubmissionDetail(tenderId, submissionId)
      .then((response) => {
        console.log("PROPOSAL DETAILS:", response.data);
        setSubmission(response.data);
      })
      .catch((error) => {
        console.error("Load proposal error:", error.response?.data || error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenderId, submissionId]);

  const handleAward = async () => {
    const contractorId =
      submission.contractor_id ||
      submission.contractor?.id ||
      submission.contractor;

    if (!contractorId) return;

    try {
      setAwardLoading(true);
      await awardTender(tenderId, contractorId);
      navigate(`/owner/tender-details/${tenderId}`);
    } catch (error) {
      console.error("Award tender error:", error.response?.data || error);
    } finally {
      setAwardLoading(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout activePage="evaluation">
        <section className="evaluation-content">
          <div className="dashboard-card p-4">Loading proposal...</div>
        </section>
      </OwnerLayout>
    );
  }

  if (!submission) {
    return (
      <OwnerLayout activePage="evaluation">
        <section className="evaluation-content">
          <div className="dashboard-card p-4">Proposal not found.</div>
        </section>
      </OwnerLayout>
    );
  }

  const files = submission.files || submission.submission_files || [];

  return (
    <OwnerLayout activePage="evaluation">
      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Proposal Details</h2>
            <p>
              {submission.contractor_company_name ||
                submission.contractor?.company_name ||
                "Contractor Proposal"}
            </p>
          </div>

          <button
            className="btn export-report-btn"
            onClick={handleAward}
            disabled={awardLoading}
          >
            <i className="bi bi-trophy"></i>
            {awardLoading ? "Awarding..." : "Award"}
          </button>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Submitted Files</h5>
          </div>

          {files.length === 0 ? (
            <p className="text-muted mb-0">No files found for this proposal.</p>
          ) : (
            <div className="proposal-files-grid">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url || file.file}
                  target="_blank"
                  rel="noreferrer"
                  className="proposal-file-card"
                  download
                >
                  <div>
                    <strong>{getFileName(file.file_url || file.file)}</strong>
                    <span>{file.file_category || file.category || "Document"}</span>
                  </div>

                  <i className="bi bi-download"></i>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </OwnerLayout>
  );
}

function getFileName(url = "") {
  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return "Document";
  }
}

export default ProposalDetails;