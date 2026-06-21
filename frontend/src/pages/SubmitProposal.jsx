import { useState } from "react";
import ContractorLayout from "../components/ContractorLayout";

function SubmitProposal() {
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

  const uploadedRequired = requiredFiles.filter((key) => files[key]).length;
  const progress = (uploadedRequired / requiredFiles.length) * 100;

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];

    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  return (
    <ContractorLayout activePage="submit-proposal">
      <section className="submit-proposal-content">
        <div className="submit-header">
          <p>Submitting proposal for</p>
          <h2>Eastfield Tower Complex</h2>
          <span>
            <i className="bi bi-clock"></i> Deadline: Jun 28, 2026
            <i className="bi bi-currency-dollar ms-3"></i> Budget: $8.4M
            <i className="bi bi-geo-alt ms-3"></i> Dubai, UAE
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

        <UploadCard
          icon="bi-file-earmark-text"
          title="Technical Proposal"
          required
          desc="Methodology, project plan, team qualifications, and approach"
          file={files.technicalProposal}
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange(e, "technicalProposal")}
        />

        <UploadCard
          icon="bi-currency-dollar"
          title="Financial Proposal"
          required
          desc="Total bid price, payment schedule, and cost breakdown"
          file={files.financialProposal}
          accept=".pdf,.xlsx,.xls"
          onChange={(e) => handleFileChange(e, "financialProposal")}
        />

        <UploadCard
          icon="bi-file-earmark-spreadsheet"
          title="BOQ Pricing Sheet"
          required
          desc="Completed Bill of Quantities with unit rates and totals"
          file={files.boqPricing}
          accept=".xlsx,.xls"
          onChange={(e) => handleFileChange(e, "boqPricing")}
        />

        <UploadCard
          icon="bi-shield"
          title="Certificates & Licenses"
          required
          desc="Trade licenses, ISO certifications, professional memberships"
          file={files.certificates}
          accept=".pdf"
          onChange={(e) => handleFileChange(e, "certificates")}
        />

        <UploadCard
          icon="bi-building"
          title="Company Documents"
          desc="Company profile, financial statements, previous projects"
          file={files.companyDocuments}
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange(e, "companyDocuments")}
        />

        <div className="proposal-notes-card">
          <label>Additional Notes (Optional)</label>
          <textarea placeholder="Any additional information you'd like the project owner to know about your submission..." />
        </div>

        {uploadedRequired < 4 && (
          <div className="proposal-warning">
            <i className="bi bi-exclamation-circle"></i>
            Please upload all required documents before submitting.
          </div>
        )}

        <div className="proposal-actions">
          <button className="btn cancel-proposal-btn">Cancel</button>

          <button
            className="btn submit-proposal-btn"
            disabled={uploadedRequired < 4}
          >
            Submit Proposal <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </section>
    </ContractorLayout>
  );
}

function UploadCard({ icon, title, required, desc, file, accept, onChange }) {
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

      <label className={`upload-drop-zone ${file ? "uploaded" : ""}`}>
        <input type="file" accept={accept} onChange={onChange} hidden />

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