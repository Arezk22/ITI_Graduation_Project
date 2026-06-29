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
      submission?.contractor_id ??
      submission?.contractor?.id ??
      submission?.contractor;

    if (!contractorId) return;

    try {
      setAwardLoading(true);
      await awardTender(tenderId, contractorId);
      setSubmission((prev) => (prev ? { ...prev, status: "accepted" } : prev));
      navigate(`/owner/tender-details/${tenderId}`);
    } catch (error) {
      console.error("Award tender error:", error.response?.data || error);
      alert(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Unable to award this proposal right now."
      );
      navigate(`/owner/tender-details/${tenderId}`);
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
              {files.map((file) => {
                const fileUrl = getFileUrl(file);
                const fileName = getFileName(fileUrl);

                return (
                  <div key={file.id} className="proposal-file-card">
                    <div>
                      <strong>{fileName}</strong>
                      <span>
                        {file.file_category || file.category || "Document"}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      {/* <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary"
                        title="Open in new tab"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                      </a> */}
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="btn btn-sm btn-outline-secondary"
                        title="Open and download"
                      >
                        <i className="bi bi-download"></i>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </OwnerLayout>
  );
}

function getFileUrl(file) {
  const rawUrl = file?.file_url || file?.file || "";

  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith("/")) {
    return `${window.location.origin}${rawUrl}`;
  }

  return rawUrl;
}

function getFileName(url = "") {
  if (!url) return "Document";

  try {
    const decodedUrl = decodeURIComponent(url);
    const pathParts = decodedUrl.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    const queryIndex = lastPart.indexOf("?");

    return queryIndex >= 0 ? lastPart.slice(0, queryIndex) : lastPart;
  } catch {
    return "Document";
  }
}

export default ProposalDetails;
