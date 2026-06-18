// import React, { useState } from "react";
import{ useState } from "react";
import OwnerLayout from "../components/OwnerLayout";

function CreateTender() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    projectName: "",
    description: "",
    category: "",
    location: "",
    currency: "USD", // تمت الإضافة للعملة
    Budget: "",
    Submission_Deadline: "",
    Project_Start_Date: "",
    Project_Duration: "",
    durationUnit: "Months", // تمت الإضافة لوحدة القياس الزمنية
    BOQ: "",
    Construction_Drawings: "",
    Technical_Specifications: "",
    Other_Documents: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNext() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const FileUploadBox = ({ label, required }) => (
    <div className="mb-4">
      <label className="form-label fw-medium" style={{ color: "#4b5563" }}>
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div
        className="upload-area d-flex flex-column align-items-center justify-content-center p-4"
        style={{
          border: "2px dashed #e5e7eb",
          borderRadius: "12px",
          backgroundColor: "#f9fafb",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
      >
        <i
          className="bi bi-upload mb-2"
          style={{ fontSize: "1.5rem", color: "#9ca3af" }}
        ></i>
        <p className="mb-1" style={{ fontSize: "0.95rem", color: "#4b5563" }}>
          Drag & drop or{" "}
          <span className="text-primary fw-bold">browse files</span>
        </p>
        <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
          PDF, XLSX, DWG up to 100MB each
        </p>
        <input type="file" className="d-none" />
      </div>
    </div>
  );

  function renderStepContent() {
    if (step === 0) {
      return (
        <>
          <h5>Project Information</h5>

          <div className="mb-3">
            <label className="form-label">Project Name *</label>
            <input
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              type="text"
              className="form-control create-input"
              placeholder="e.g. Eastfield Tower Complex Phase 2"
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Project Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-control create-textarea"
              placeholder="Describe the scope..."
            />
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label">Project Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-select create-input"
              >
                <option value="">Select category</option>
                <option>Residential Construction</option>
                <option>Commercial Construction</option>
                <option>Infrastructure</option>
                <option>Renovation</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Project Location</label>
              <div className="location-input">
                <i className="bi bi-geo-alt"></i>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>
        </>
      );
    } else if (step === 1) {
      // ==== بداية التعديل الخاص بالخطوة الثانية ====
      return (
        <>
          <h5 className="mb-4">Budget & Timeline</h5>

          <div className="row g-4 mb-4">
            {/* Estimated Budget */}
            <div className="col-md-6">
              <label className="form-label">Estimated Budget *</label>
              <div className="input-group">
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="form-select"
                  style={{ maxWidth: "100px", backgroundColor: "#f8f9fa" }}
                >
                  <option value="USD">USD</option>
                  <option value="EGP">EGP</option>
                </select>
                <input
                  name="Budget"
                  value={form.Budget}
                  onChange={handleChange}
                  type="text"
                  className="form-control"
                  placeholder="5,000,000"
                />
              </div>
            </div>

            {/* Submission Deadline */}
            <div className="col-md-6">
              <label className="form-label">Submission Deadline *</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-calendar"></i>
                </span>
                <input
                  name="Submission_Deadline"
                  value={form.Submission_Deadline}
                  onChange={handleChange}
                  type="date"
                  className="form-control"
                />
              </div>
            </div>

            {/* Project Start Date */}
            <div className="col-md-6">
              <label className="form-label">Project Start Date</label>
              <input
                name="Project_Start_Date"
                value={form.Project_Start_Date}
                onChange={handleChange}
                type="date"
                className="form-control"
              />
            </div>

            {/* Project Duration */}
            <div className="col-md-6">
              <label className="form-label">Project Duration</label>
              <div className="input-group">
                <input
                  name="Project_Duration"
                  value={form.Project_Duration}
                  onChange={handleChange}
                  type="number"
                  className="form-control"
                  placeholder="18"
                />
                <select
                  name="durationUnit"
                  value={form.durationUnit}
                  onChange={handleChange}
                  className="form-select"
                  style={{ maxWidth: "120px", backgroundColor: "#f8f9fa" }}
                >
                  <option value="Months">Months</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Days">Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget Visibility Alert */}
          <div
            className="alert d-flex align-items-start mt-2"
            style={{
              backgroundColor: "#f0f5ff",
              border: "1px solid #cce0ff",
              borderRadius: "8px",
            }}
          >
            <i
              className="bi bi-info-circle me-3 mt-1"
              style={{ color: "#2563eb", fontSize: "1.2rem" }}
            ></i>
            <div>
              <div
                style={{
                  color: "#1e3a8a",
                  fontWeight: "500",
                  marginBottom: "4px",
                  fontSize: "0.95rem",
                }}
              >
                Budget Visibility Setting
              </div>
              <div style={{ color: "#3b82f6", fontSize: "0.9rem" }}>
                Your estimated budget will be hidden from contractors by
                default. You can reveal it after all bids are received to
                prevent anchoring bias.
              </div>
            </div>
          </div>
        </>
      );
      // ==== نهاية التعديل ====
    } else if (step === 2) {
      return (
        <div className="px-2">
          <h5 className="mb-4 fw-bold">Upload Tender Documents</h5>

          <FileUploadBox label="Bill of Quantities (BOQ)" required={true} />

          <FileUploadBox label="Construction Drawings" required={true} />

          <FileUploadBox label="Technical Specifications" required={false} />

          <FileUploadBox label="Other Documents" required={false} />
        </div>
      );
    } else {
      return (
        <div className="px-2">
          <h5 className="mb-4 fw-bold" style={{ color: "#111827" }}>
            Review & Publish
          </h5>

          {/* Project Summary Card */}
          <div
            className="p-4 mb-4"
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
          >
            <span
              className="text-muted fw-bold d-block mb-3"
              style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
            >
              PROJECT SUMMARY
            </span>

            <div className="row g-4">
              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Project Name
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  {form.projectName}
                </span>
              </div>
              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Category
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  {form.category}
                </span>
              </div>

              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Location
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  {form.location}
                </span>
              </div>
              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Budget
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  {form.currency} {form.Budget}
                </span>
              </div>

              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Deadline
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  June 28, 2026
                </span>
              </div>
              <div className="col-md-6">
                <label
                  className="text-muted d-block mb-1"
                  style={{ fontSize: "0.85rem" }}
                >
                  Duration
                </label>
                <span className="fw-semibold" style={{ color: "#0f172a" }}>
                  {form.Project_Duration} {form.durationUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Documents Uploaded Success Alert */}
          <div
            className="alert d-flex align-items-center mb-4"
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            <i
              className="bi bi-check-circle-fill me-2"
              style={{ color: "#16a34a", fontSize: "1.1rem" }}
            ></i>
            <span
              style={{
                color: "#166534",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              All required documents uploaded. Tender is ready to publish.
            </span>
          </div>

          {/* Contractor Invitation Selection
          <div
            className="p-4"
            style={{ border: "1px solid #e2e8f0", borderRadius: "12px" }}
          >
            <span
              className="text-muted fw-bold d-block mb-3"
              style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
            >
              CONTRACTOR INVITATION
            </span>
            <select
              name="contractorInvitation"
              value={form.contractorInvitation}
              onChange={handleChange}
              className="form-select py-2 mb-2"
              style={{ borderRadius: "8px" }}
            >
              <option>Invite all qualified contractors</option>
              <option>Invite specific contractors</option>
            </select>
            <small
              className="text-muted d-block"
              style={{ fontSize: "0.8rem" }}
            >
              BuildTender AI will automatically notify{" "}
              <span className="fw-semibold">47</span> pre-qualified contractors
              in your category.
            </small>
          </div> */}
        </div>
      );
    }
  }

  return (
    <OwnerLayout activePage="create">
      <section className="create-tender-content">
        <div className="create-tender-header">
          <h2>Create New Tender</h2>
          <p>
            Fill in the project details to invite contractors to submit
            proposals.
          </p>
        </div>

        <div className="tender-steps">
          <div className={`step-item ${step >= 0 ? "active" : ""}`}>
            <span>1</span>
            Project Details
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step >= 1 ? "active" : ""}`}>
            <span>2</span>
            Budget & Timeline
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step >= 2 ? "active" : ""}`}>
            <span>3</span>
            Documents
          </div>
          <div className="step-line"></div>

          <div className={`step-item ${step >= 3 ? "active" : ""}`}>
            <span>4</span>
            Review & Publish
          </div>
        </div>

        <div className="create-form-card">
          <div className="form-body">{renderStepContent()}</div>

          <div className="form-actions mt-4 d-flex justify-content-between">
            <button
              className="btn back-step-btn"
              onClick={handleBack}
              disabled={step === 0}
            >
              Back
            </button>

            {step < 3 && (
              <button
                className="btn btn-primary continue-step-btn"
                onClick={handleNext}
              >
                Continue <i className="bi bi-chevron-right"></i>
              </button>
            )}
            {step === 3 && (
              <button className="btn btn-success publish-btn">
                Publish Tender <i className="bi bi-check-lg"></i>
              </button>
            )}
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default CreateTender;
