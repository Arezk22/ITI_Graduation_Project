import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import AppToast from "../components/AppToast";
import { getSubmissionDetail, awardTender } from "../services/proposalApi";

function ProposalDetails() {
  const navigate = useNavigate();
  const { tenderId, submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awardLoading, setAwardLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  function showToast(type, title, message) {
    setToast({
      show: true,
      type,
      title,
      message,
    });
  }

  function closeToast() {
    setToast((prev) => ({ ...prev, show: false }));
  }

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

    if (!contractorId) {
      showToast("error", "Award failed", "Contractor ID was not found.");
      return;
    }

    if (submission?.status === "accepted" || submission?.status === "awarded") {
      showToast("info", "Already awarded", "This proposal is already awarded.");
      return;
    }

    try {
      setAwardLoading(true);

      await awardTender(tenderId, contractorId);

      setSubmission((prev) => (prev ? { ...prev, status: "accepted" } : prev));

      showToast(
        "success",
        "Proposal awarded",
        "The tender has been awarded successfully.",
      );

      setTimeout(() => {
        navigate(`/owner/tender-details/${tenderId}`);
      }, 900);
    } catch (error) {
      console.error("Award tender error:", error.response?.data || error);

      showToast(
        "error",
        "Award failed",
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Unable to award this proposal right now.",
      );
    } finally {
      setAwardLoading(false);
    }
  };


  if (loading) {
    return (
      <OwnerLayout activePage="evaluation">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="evaluation-content">
          <div className="dashboard-card p-4">Loading proposal...</div>
        </section>
      </OwnerLayout>
    );
  }

  if (!submission) {
    return (
      <OwnerLayout activePage="evaluation">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="evaluation-content">
          <div className="dashboard-card p-4">Proposal not found.</div>
        </section>
      </OwnerLayout>
    );
  }

  const files = submission.files || submission.submission_files || [];
  const isAwarded =
    submission?.status === "accepted" || submission?.status === "awarded";

  return (
    <OwnerLayout activePage="evaluation">
      <AppToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={closeToast}
      />

      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Proposal Details</h2>

            <p>
              <strong>Contractor Company Name:</strong>{" "}
              {getCompanyName(submission)}
            </p>
          </div>

          <div className="proposal-header-actions">
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${getContractorEmail(submission)}&su=${encodeURIComponent("Regarding your proposal")}&body=${encodeURIComponent(`Hello ${getCompanyName(submission) || "there"},\n\nI would like to discuss your proposal for this tender.\n\nBest regards,\n[Your Name]`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn contact-contractor-btn"
            >
              <i className="bi bi-envelope"></i>
              Contact
            </a>

            <button
              className="btn export-report-btn"
              onClick={handleAward}
              disabled={awardLoading || isAwarded}
            >
              <i className="bi bi-trophy"></i>
              {awardLoading ? "Awarding..." : isAwarded ? "Awarded" : "Award"}
            </button>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Submitted Files</h5>
          </div>

          {files.length === 0 ? (
            <p className="text-muted mb-0">No files found for this proposal.</p>
          ) : (
            <div className="documents-grid">
              {files.map((file) => {
                const fileUrl = getFileUrl(file);
                const fileName = getFileName(fileUrl);

                return (
                  <div key={file.id} className="document-item">
                    <span className="doc-type-badge">
                      {(file.file_type || "PDF").toUpperCase()}
                    </span>

                    <div className="doc-details-text">
                      <strong>{fileName}</strong>
                      <p>{file.file_category || file.category || "Document"}</p>
                    </div>

                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="document-download-btn"
                    >
                      <i className="bi bi-download"></i>
                    </a>
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

function getCompanyName(submission) {
  return (
    submission?.contractor_company_name ||
    submission?.contractor?.company_name ||
    submission?.company_name ||
    submission?.contractor_name ||
    submission?.user?.company_name ||
    "Contractor Proposal"
  );
}

function getContractorEmail(submission) {
  const candidates = [
    submission?.contractor_email,
    submission?.contractor?.email,
    submission?.contractor?.user?.email,
    submission?.user?.email,
    submission?.email,
  ];

  return (
    candidates
      .find((value) => typeof value === "string" && value.trim())
      ?.trim() || ""
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
