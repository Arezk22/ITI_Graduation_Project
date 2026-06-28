import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import { getTenderById } from "../services/tenderApi";
import { submitProposal } from "../services/proposalApi";

function SubmitProposal() {
  const { id: tenderId } = useParams();
  const navigate = useNavigate();

  const requiredFiles = [
    "technicalProposal",
    "financialProposal",
    "boqPricing",
    "certificates",
  ];

  const [files, setFiles] = useState({
    technicalProposal: null,
    financialProposal: null,
    boqPricing: null,
    certificates: null,
    companyDocuments: null,
  });

  const [tender, setTender] = useState(null);
  const [loadingTender, setLoadingTender] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const hasTenderSelection = Boolean(tenderId);

  // Fetch tender details on mount
  useEffect(() => {
    if (!tenderId) {
      setLoadingTender(false);
      return;
    }

    getTenderById(tenderId)
      .then((response) => {
        setTender(response.data);
      })
      .catch((error) => {
        console.error("Error loading tender:", error);
        setSubmitError("Failed to load tender details");
      })
      .finally(() => {
        setLoadingTender(false);
      });
  }, [tenderId]);

  const uploadedRequired = requiredFiles.filter((key) => files[key]).length;
  const progress = (uploadedRequired / requiredFiles.length) * 100;

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];

    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  const handleSubmit = async () => {
    if (!tenderId) {
      setSubmitError(
        "Please choose a tender from the dashboard before uploading files.",
      );
      return;
    }

    if (uploadedRequired < 4) {
      setSubmitError("Please upload all required documents");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitProposal(tenderId, files);
      // Success - redirect to dashboard or show success message
      // alert("Proposal submitted successfully!");
      navigate("/contractor/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit proposal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/contractor/dashboard");
  };

  if (loadingTender) {
    return (
      <ContractorLayout activePage="submit-proposal">
        <section className="submit-proposal-content">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading tender details...</p>
          </div>
        </section>
      </ContractorLayout>
    );
  }

  if (!tender && tenderId) {
    return (
      <ContractorLayout activePage="submit-proposal">
        <section className="submit-proposal-content">
          <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
            <p>Tender not found</p>
            <button
              onClick={() => navigate("/contractor/dashboard")}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout activePage="submit-proposal">
      <section className="submit-proposal-content">
        <div className="submit-header">
          <p>Submitting proposal for</p>
          <h2>{tender?.title || "Tender"}</h2>
          <span>
            <i className="bi bi-clock"></i> Deadline:{" "}
            {tender?.deadline_at
              ? new Date(tender.deadline_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "N/A"}
            <i className="bi bi-currency-dollar ms-3"></i> Budget: $
            {tender?.budget?.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }) || "N/A"}
            <i className="bi bi-geo-alt ms-3"></i> {tender?.location || "N/A"}
          </span>
        </div>

        <div className="submission-progress-card">
          <div className="d-flex justify-content-between">
            <strong>Submission Progress</strong>
            <b>{uploadedRequired}/4 required sections</b>
          </div>

          <div className="progress submit-progress">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="d-flex justify-content-between">
            <div className="progress-dots">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={i < uploadedRequired ? "active" : ""}
                ></span>
              ))}
            </div>

            <small>{progress}% complete</small>
          </div>
        </div>

        {!hasTenderSelection && (
          <div className="proposal-warning">
            <i className="bi bi-exclamation-circle"></i>
            No tender selected. Please go to the dashboard and choose a tender
            before uploading files.
          </div>
        )}

        <UploadCard
          icon="bi-file-earmark-text"
          title="Technical Proposal"
          required
          desc="Methodology, project plan, team qualifications, and approach"
          file={files.technicalProposal}
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange(e, "technicalProposal")}
          disabled={!hasTenderSelection}
        />

        <UploadCard
          icon="bi-currency-dollar"
          title="Financial Proposal"
          required
          desc="Total bid price, payment schedule, and cost breakdown"
          file={files.financialProposal}
          accept=".pdf,.xlsx,.xls"
          onChange={(e) => handleFileChange(e, "financialProposal")}
          disabled={!hasTenderSelection}
        />

        <UploadCard
          icon="bi-file-earmark-spreadsheet"
          title="BOQ Pricing Sheet"
          required
          desc="Completed Bill of Quantities with unit rates and totals"
          file={files.boqPricing}
          accept=".xlsx,.xls"
          onChange={(e) => handleFileChange(e, "boqPricing")}
          disabled={!hasTenderSelection}
        />

        <UploadCard
          icon="bi-shield"
          title="Certificates & Licenses"
          required
          desc="Trade licenses, ISO certifications, professional memberships"
          file={files.certificates}
          accept=".pdf"
          onChange={(e) => handleFileChange(e, "certificates")}
          disabled={!hasTenderSelection}
        />

        <UploadCard
          icon="bi-building"
          title="Company Documents"
          desc="Company profile, financial statements, previous projects"
          file={files.companyDocuments}
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange(e, "companyDocuments")}
          disabled={!hasTenderSelection}
        />

        <div className="proposal-notes-card">
          <label>Additional Notes (Optional)</label>
          <textarea placeholder="Any additional information you'd like the project owner to know about your submission..." />
        </div>

        {submitError && (
          <div
            className="proposal-warning"
            style={{ backgroundColor: "#ffebee", borderColor: "#c62828" }}
          >
            <i className="bi bi-exclamation-circle"></i>
            {submitError}
          </div>
        )}

        {uploadedRequired < 4 && (
          <div className="proposal-warning">
            <i className="bi bi-exclamation-circle"></i>
            Please upload all required documents before submitting.
          </div>
        )}

        <div className="proposal-actions">
          <button
            className="btn cancel-proposal-btn"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            className="btn submit-proposal-btn"
            disabled={!hasTenderSelection || uploadedRequired < 4 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Proposal"}
            {!submitting && <i className="bi bi-chevron-right"></i>}
          </button>
        </div>
      </section>
    </ContractorLayout>
  );
}

function UploadCard({
  icon,
  title,
  required,
  desc,
  file,
  accept,
  onChange,
  disabled = false,
}) {
  return (
    <div className="proposal-upload-card">
      <div className="upload-card-header">
        <div className="upload-title">
          <span>
            <i className={`bi ${icon}`}></i>
          </span>

          <div>
            <h5>
              {title}
              {required && <b>Required</b>}
            </h5>
            <p>{desc}</p>
          </div>
        </div>

        {file && <strong className="uploaded-badge">Uploaded</strong>}
      </div>

      <label
        className={`upload-drop-zone ${file ? "uploaded" : ""} ${disabled ? "disabled" : ""}`}
      >
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          hidden
          disabled={disabled}
        />

        <i className="bi bi-upload"></i>

        {file ? (
          <>
            <strong>{file.name}</strong>
            <p>Click to replace file</p>
          </>
        ) : (
          <>
            <p>
              Drag & drop or <span>browse</span>
            </p>
            <small>{accept.replaceAll(".", "").toUpperCase()} files</small>
          </>
        )}
      </label>
    </div>
  );
}

export default SubmitProposal;
