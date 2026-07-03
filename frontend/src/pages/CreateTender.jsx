

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import { createTender } from "../services/tenderApi";
import AppToast from "../components/AppToast";
function CreateTender() {


  const [toast, setToast] = useState({
  show: false,
  type: "success",
  title: "",
  message: "",
});

const showToast = (type, title, message) => {
  setToast({ show: true, type, title, message });
};

const closeToast = () => {
  setToast((prev) => ({ ...prev, show: false }));
};


  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    projectName: "",
    description: "",
    category: "",
    location: "",
    currency: "USD",
    Budget: "",
    Submission_Deadline: "",
    Project_Start_Date: "",
    Project_Duration: "",
    durationUnit: "Months",
    BOQ: null,
    Construction_Drawings: null,
    Technical_Specifications: null,
    Other_Documents: null,
    evaluationRules: {
  Price: 40,
  Technical: 35,
  Experience: 15,
  Compliance: 10,
},
  });

  function handleChange(e) {
    const { name, value } = e.target;
    const normalizedValue =
      name === "Project_Duration"
        ? value === ""
          ? ""
          : Math.max(0, Number(value))
        : value;

    setForm((prev) => ({ ...prev, [name]: normalizedValue }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function handleFileChange(e, name) {
    const file = e.target.files[0];

    setForm((prev) => ({
      ...prev,
      [name]: file,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function validateCurrentStep() {
    const newErrors = {};

    if (step === 0) {
      if (!form.projectName.trim()) {
        newErrors.projectName = "Project name is required";
      }

      if (!form.description.trim()) {
        newErrors.description = "Project description is required";
      }

      if (!form.category) {
        newErrors.category = "Project category is required";
      }

      if (!form.location.trim()) {
        newErrors.location = "Project location is required";
      }
const currentEvaluationTotal = Object.values(form.evaluationRules || {}).reduce(
  (sum, value) => sum + Number(value || 0),
  0
);

if (currentEvaluationTotal !== 100) {
  newErrors.evaluationRules = "Evaluation criteria total must equal 100%";
}
    }

    if (step === 1) {
      if (!form.Budget) {
        newErrors.Budget = "Budget is required";
      }

      if (!form.Submission_Deadline) {
        newErrors.Submission_Deadline = "Submission deadline is required";
      }

      if (!form.Project_Start_Date) {
        newErrors.Project_Start_Date = "Project start date is required";
      }

      if (!form.Project_Duration) {
        newErrors.Project_Duration = "Project duration is required";
      }
    }

    if (step === 2) {
      if (!form.BOQ) {
        newErrors.BOQ = "BOQ file is required";
      }

      if (!form.Construction_Drawings) {
        newErrors.Construction_Drawings = "Construction drawings file is required";
      }

      if (!form.Technical_Specifications) {
        newErrors.Technical_Specifications =
          "Technical specifications file is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;

    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handlePublishTender() {
    if (!validateCurrentStep()) return;

    try {
      setIsPublishing(true);

      const response = await createTender(form);

      console.log("Tender created:", response.data);

      const tenderId = response.data.id;
      

showToast("success", "Tender published", "Your tender has been created successfully.");


      if (tenderId) {
        navigate(`/owner/tender-details/${tenderId}`);
      } else {
        navigate("/owner/dashboard");
      }
    } catch (error) {
      console.error("Create tender error:", error.response?.data || error);

      const serverErrors = error.response?.data;
      let message = "Please review the form and try again.";

      if (typeof serverErrors === "string") {
        message = serverErrors;
      } else if (serverErrors?.detail) {
        message = serverErrors.detail;
      } else if (serverErrors && typeof serverErrors === "object") {
        const firstError = Object.entries(serverErrors).find(([, value]) => value);

        if (firstError) {
          const [, value] = firstError;

          if (Array.isArray(value)) {
            message = value[0];
          } else if (typeof value === "string") {
            message = value;
          } else if (typeof value === "object" && value?.message) {
            message = value.message;
          }
        }
      }

      showToast("error", "Publish failed", message);
    } finally {
      setIsPublishing(false);
    }
  }



  const evaluationTotal = Object.values(form.evaluationRules).reduce(
  (sum, value) => sum + Number(value || 0),
  0
);

const handleEvaluationRuleChange = (ruleName, value) => {
  const numericValue = Number(value);

  const nextRules = {
    ...form.evaluationRules,
    [ruleName]: numericValue < 0 ? 0 : numericValue,
  };

  const nextTotal = Object.values(nextRules).reduce(
    (sum, item) => sum + Number(item || 0),
    0
  );

  setForm((prev) => ({
    ...prev,
    evaluationRules: nextRules,
  }));

  if (nextTotal === 100) {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.evaluationRules;
      return updated;
    });
  }
};

  const FileUploadBox = ({ label, required, name, accept, hint }) => (
    <div className="mb-4">
      <label className="form-label fw-medium" style={{ color: "#4b5563" }}>
        {label} {required && <span className="text-danger">*</span>}
      </label>

      <label
        className="upload-area d-flex flex-column align-items-center justify-content-center p-4"
        style={{
          border: errors[name]
            ? "2px dashed #dc3545"
            : form[name]
            ? "2px dashed #22c55e"
            : "2px dashed #e5e7eb",
          borderRadius: "12px",
          backgroundColor: errors[name]
            ? "#fff5f5"
            : form[name]
            ? "#f0fdf4"
            : "#f9fafb",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        <i
          className={
            form[name] ? "bi bi-check-circle mb-2" : "bi bi-upload mb-2"
          }
          style={{
            fontSize: "1.5rem",
            color: errors[name]
              ? "#dc3545"
              : form[name]
              ? "#16a34a"
              : "#9ca3af",
          }}
        ></i>

        {form[name] ? (
          <>
            <p className="mb-1 fw-bold" style={{ color: "#166534" }}>
              {form[name].name}
            </p>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
              Click to replace file
            </p>
          </>
        ) : (
          <>
            <p
              className="mb-1"
              style={{ fontSize: "0.95rem", color: "#4b5563" }}
            >
              Drag & drop or{" "}
              <span className="text-primary fw-bold">browse files</span>
            </p>
            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
              {hint}
            </p>
          </>
        )}

        <input
          type="file"
          className="d-none"
          accept={accept}
          onChange={(e) => handleFileChange(e, name)}
        />
      </label>

      {errors[name] && (
        <div className="text-danger mt-2" style={{ fontSize: "0.875rem" }}>
          {errors[name]}
        </div>
      )}
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
              className={`form-control create-input ${
                errors.projectName ? "is-invalid" : ""
              }`}
              placeholder="e.g. Eastfield Tower Complex Phase 2"
            />

            {errors.projectName && (
              <div className="invalid-feedback d-block">
                {errors.projectName}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label">Project Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`form-control create-textarea ${
                errors.description ? "is-invalid" : ""
              }`}
              placeholder="Describe the scope..."
            />

            {errors.description && (
              <div className="invalid-feedback d-block">
                {errors.description}
              </div>
            )}
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label">Project Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`form-select create-input ${
                  errors.category ? "is-invalid" : ""
                }`}
              >
                <option value="">Select category</option>
                <option value="construction">Construction</option>
                <option value="roads">Roads & Infrastructure</option>
                <option value="buildings">Buildings</option>
                <option value="electrical">Electrical</option>
                <option value="mechanical">Mechanical</option>
                <option value="water">Water & Sewage</option>
                <option value="it">IT & Telecom</option>
                <option value="consulting">Consulting</option>
                <option value="supplies">Supplies & Procurement</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>

              {errors.category && (
                <div className="invalid-feedback d-block">
                  {errors.category}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Project Location *</label>
              <div
                className={`location-input ${
                  errors.location ? "border border-danger" : ""
                }`}
              >
                <i className="bi bi-geo-alt"></i>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>

              {errors.location && (
                <div className="text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                  {errors.location}
                </div>
              )}
            
            </div>
            <div className="evaluation-weights-section">
  <div className="evaluation-weights-header">
    <label>Evaluation Criteria Weights</label>

<span
  className={`evaluation-total ${
    evaluationTotal === 100 ? "valid" : "invalid"
  }`}
>
  Total: {evaluationTotal}%
</span>
  </div>

  <div className="evaluation-weights-grid">
    {Object.entries(form.evaluationRules).map(([ruleName, value]) => (
      <div className="evaluation-weight-box" key={ruleName}>
        <span>{ruleName}</span>

        <div className="weight-input-wrap">
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) =>
              handleEvaluationRuleChange(ruleName, e.target.value)
            }
          />
          <b>%</b>
        </div>
      </div>
    ))}
  </div>

{errors.evaluationRules && evaluationTotal !== 100 && (
  <p className="evaluation-error">{errors.evaluationRules}</p>
)}
</div>
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <h5 className="mb-4">Budget & Timeline</h5>

          <div className="row g-4 mb-4">
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
                  className={`form-control ${
                    errors.Budget ? "is-invalid" : ""
                  }`}
                  placeholder="5,000,000"
                />
              </div>

              {errors.Budget && (
                <div className="invalid-feedback d-block">{errors.Budget}</div>
              )}
            </div>

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
                  className={`form-control ${
                    errors.Submission_Deadline ? "is-invalid" : ""
                  }`}
                />
              </div>

              {errors.Submission_Deadline && (
                <div className="invalid-feedback d-block">
                  {errors.Submission_Deadline}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Project Start Date *</label>
              <input
                name="Project_Start_Date"
                value={form.Project_Start_Date}
                onChange={handleChange}
                type="date"
                className={`form-control ${
                  errors.Project_Start_Date ? "is-invalid" : ""
                }`}
              />

              {errors.Project_Start_Date && (
                <div className="invalid-feedback d-block">
                  {errors.Project_Start_Date}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">Project Duration *</label>
              <div className="input-group">
                <input
                  name="Project_Duration"
                  value={form.Project_Duration}
                  onChange={handleChange}
                  type="number"
                  className={`form-control ${
                    errors.Project_Duration ? "is-invalid" : ""
                  }`}
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

              {errors.Project_Duration && (
                <div className="invalid-feedback d-block">
                  {errors.Project_Duration}
                </div>
              )}
            </div>
          </div>

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
                Your estimated budget will be hidden from contractors by default.
                You can reveal it after all bids are received to prevent
                anchoring bias.
              </div>
            </div>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <div className="px-2">
          <h5 className="mb-4 fw-bold">Upload Tender Documents</h5>

          <FileUploadBox
            label="Bill of Quantities (BOQ)"
            required
            name="BOQ"
            accept=".pdf,.xlsx,.xls"
            hint="PDF, XLSX files up to 100MB each"
          />

          <FileUploadBox
            label="Construction Drawings"
            required
            name="Construction_Drawings"
            accept=".pdf,.dwg"
            hint="PDF, DWG files up to 100MB each"
          />

          <FileUploadBox
            label="Technical Specifications"
            required
            name="Technical_Specifications"
            accept=".pdf,.doc,.docx"
            hint="PDF, DOCX files up to 100MB each"
          />

          <FileUploadBox
            label="Other Documents"
            name="Other_Documents"
            accept=".pdf,.xlsx,.xls,.dwg,.doc,.docx"
            hint="PDF, XLSX, DWG, DOCX files up to 100MB each"
          />
        </div>
      );
    }



    return (
      <div className="px-2">
        <h5 className="mb-4 fw-bold" style={{ color: "#111827" }}>
          Review & Publish
        </h5>

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
              <label className="text-muted d-block mb-1">Project Name</label>
              <span className="fw-semibold">{form.projectName}</span>
            </div>

            <div className="col-md-6">
              <label className="text-muted d-block mb-1">Category</label>
              <span className="fw-semibold">{form.category}</span>
            </div>

            <div className="col-md-6">
              <label className="text-muted d-block mb-1">Location</label>
              <span className="fw-semibold">{form.location}</span>
            </div>

            <div className="col-md-6">
              <label className="text-muted d-block mb-1">Budget</label>
              <span className="fw-semibold">
                {form.currency} {form.Budget}
              </span>
            </div>

            <div className="col-md-6">
              <label className="text-muted d-block mb-1">Deadline</label>
              <span className="fw-semibold">{form.Submission_Deadline}</span>
            </div>

            <div className="col-md-6">
              <label className="text-muted d-block mb-1">Duration</label>
              <span className="fw-semibold">
                {form.Project_Duration} {form.durationUnit}
              </span>
            </div>
          </div>
        </div>

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
            Tender is ready to publish.
          </span>
        </div>
      </div>
    );
  }



  return (
    <OwnerLayout activePage="create">
      <AppToast
  show={toast.show}
  type={toast.type}
  title={toast.title}
  message={toast.message}
  onClose={closeToast}
/>
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
              <button
                className="btn btn-success publish-btn"
                onClick={handlePublishTender}
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing..." : "Publish Tender"}
                <i className="bi bi-check-lg"></i>
              </button>
            )}
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default CreateTender;

