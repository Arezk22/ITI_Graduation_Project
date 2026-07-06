import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";
import AppToast from "../components/AppToast";
import {
  deleteTender,
  getAllTenders,
  getTenderById,
  updateTender,
} from "../services/tenderApi";
import { getTenderSubmissions } from "../services/proposalApi";

function TenderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [tenders, setTenders] = useState([]);
  const [tender, setTender] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [showCompareModal, setShowCompareModal] = useState(false);

  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    project_category: "other",
    location: "",
    budget: "",
    start_date: "",
    duration_months: "",
    deadline_at: "",
    status: "open",
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
    let cancelled = false;

    getAllTenders()
      .then((response) => {
        if (cancelled) return;

        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        setTenders(list);

        if (!id && list.length > 0) {
          navigate(`/owner/tender-details/${list[0].id}`, { replace: true });
        }

        if (!id && list.length === 0) {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Load tenders error:", error.response?.data || error);
        setLoading(false);
        showToast(
          "error",
          "Failed to load projects",
          "Please login again or try later.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getTenderById(id)
      .then((response) => {
        if (cancelled) return;

        const data = response.data;
        setTender(data);

        setTenders((prev) => {
          const exists = prev.some(
            (item) => String(item.id) === String(data.id),
          );

          if (exists) {
            return prev.map((item) =>
              String(item.id) === String(data.id) ? { ...item, ...data } : item,
            );
          }

          return [data, ...prev];
        });

        setEditForm({
          title: data.title || "",
          description: data.description || "",
          project_category: data.project_category || "other",
          location: data.location || "",
          budget: data.budget || "",
          start_date: data.start_date || "",
          duration_months: data.duration_months || "",
          deadline_at: data.deadline_at ? data.deadline_at.split("T")[0] : "",
          status: data.status || "open",
        });
      })
      .catch((error) => {
        console.error(
          "Load tender details error:",
          error.response?.data || error,
        );
        setTender(null);
        showToast(
          "error",
          "Failed to load tender",
          "Unable to fetch tender details.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!tender?.id) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;

    setSubmissionsLoading(true);

    getTenderSubmissions(tender.id)
      .then((response) => {
        if (cancelled) return;

        const list = Array.isArray(response.data)
          ? response.data
          : response.data.submissions || response.data.results || [];

        setSubmissions(list);
      })
      .catch((error) => {
        console.error(
          "Load tender submissions error:",
          error.response?.data || error,
        );

        if (!cancelled) {
          setSubmissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSubmissionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tender?.id]);

  const daysToDeadline = useMemo(() => {
    if (!tender?.deadline_at) return "—";

    const today = new Date();
    const deadline = new Date(tender.deadline_at);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Closed";
    if (diff === 0) return "Today";
    return `${diff} days`;
  }, [tender]);

  const handleProjectChange = (e) => {
    const tenderId = e.target.value;

    if (tenderId) {
      navigate(`/owner/tender-details/${tenderId}`);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateTender = async (e) => {
    e.preventDefault();

    if (!tender?.id) return;

    try {
      setEditLoading(true);

      const payload = {
        title: editForm.title,
        description: editForm.description,
        project_category: editForm.project_category,
        location: editForm.location || "N/A",
        budget: editForm.budget,
        start_date: editForm.start_date || null,
        duration_months: Number(editForm.duration_months || 0),
        deadline_at: editForm.deadline_at
          ? `${editForm.deadline_at}T00:00:00Z`
          : null,
        status: editForm.status,
      };

      const response = await updateTender(tender.id, payload);
      const updatedData = response.data;

      setTender((prev) => ({
        ...prev,
        ...updatedData,
        id: prev.id,
        files: prev.files,
        created_at: prev.created_at,
      }));

      setTenders((prev) =>
        prev.map((item) =>
          item.id === tender.id
            ? {
                ...item,
                title: updatedData.title || payload.title,
                description: updatedData.description || payload.description,
                project_category:
                  updatedData.project_category || payload.project_category,
                location: updatedData.location || payload.location,
                budget: updatedData.budget || payload.budget,
                start_date: updatedData.start_date || payload.start_date,
                duration_months:
                  updatedData.duration_months || payload.duration_months,
                deadline_at: updatedData.deadline_at || payload.deadline_at,
                status: updatedData.status || payload.status,
              }
            : item,
        ),
      );

      setShowEditModal(false);
      showToast(
        "success",
        "Tender updated",
        "Project details updated successfully.",
      );
    } catch (error) {
      console.error("Update tender error:", error.response?.data || error);
      showToast("error", "Update failed", "Unable to update tender.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTender = async () => {
    if (!tender?.id) return;

    try {
      setDeleteLoading(true);

      await deleteTender(tender.id);

      setShowDeleteModal(false);
      showToast(
        "success",
        "Tender deleted",
        "The tender has been deleted successfully.",
      );

      setTimeout(() => {
        navigate("/owner/tender-details", { replace: true });
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Delete tender error:", error.response?.data || error);
      showToast("error", "Delete failed", "Unable to delete this tender.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const documents = tender?.files || [];
  const submissionsCount = submissions.length || tender?.submissions_count || 0;
  const visibleSubmissions = submissions.slice(0, 5);
  const projectCode = tender ? `T-${String(tender.id).padStart(4, "0")}` : "—";
  const displayStatus = getTenderDisplayStatus(tender);

  if (loading) {
    return (
      <OwnerLayout activePage="tender-details">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="tender-details-content">
          <div className="details-card text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            ></div>
            <p className="mb-0">Loading tender details...</p>
          </div>
        </section>
      </OwnerLayout>
    );
  }

  if (!tender) {
    return (
      <OwnerLayout activePage="tender-details">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="tender-details-content">
          <div className="details-card text-center py-5">
            <h5>No tender selected</h5>
            <p className="text-muted">
              Please create a tender first or select another project.
            </p>

            <button
              className="btn btn-primary px-4 mt-3"
              onClick={() => navigate("/owner/create-tender")}
            >
              Create Tender
            </button>
          </div>
        </section>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="tender-details">
      <AppToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={closeToast}
      />

      <section className="tender-details-content">
        <div className="tender-details-header">
          <div className="header-info-side">
            <div className="tender-tags">
              <span className="project-code-badge">{projectCode}</span>

              <b className={`status-indicator ${displayStatus.toLowerCase()}`}>
                ● {displayStatus}
              </b>
            </div>

            <div className="project-switcher-wrap">
              <div className="project-switcher-box">
                <select
                  className="project-switcher"
                  value={tender.id}
                  onChange={handleProjectChange}
                >
                  {tenders.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title || item.projectName || `Tender ${item.id}`}
                    </option>
                  ))}
                </select>

                <i className="bi bi-chevron-down"></i>
              </div>
            </div>

            <p className="tender-meta-text">
              <span>
                <i className="bi bi-geo-alt"></i> {tender.location || "N/A"}
              </span>

              <span>
                <i className="bi bi-calendar ms-md-3"></i> Deadline{" "}
                {formatDate(tender.deadline_at)}
              </span>

              <span>
                <i className="bi bi-currency-dollar ms-md-3"></i> Budget{" "}
                {formatMoney(tender.budget)}
              </span>
            </p>
          </div>

          <div className="tender-header-actions">
            {/* <button
              className="btn ask-ai-btn"
              onClick={() => navigate("/owner/document-chat")}
            >
              <i className="bi bi-cpu"></i>
              Ask AI
            </button> */}

            <button
              className="btn view-eval-btn"
              onClick={() => navigate(`/owner/evaluation/${id}`)}
            >
              View Evaluation
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="tender-details-grid">
          <div className="tender-main-column">
            <div className="ai-summary-box">
              <h5>
                <i className="bi bi-cpu"></i>
                AI Analysis Summary
              </h5>

              <div className="summary-placeholder">
                <p>No AI summary available yet.</p>
              </div>

              <div className="summary-links">
                <button onClick={() => navigate(`/owner/ai-analysis/${id}`)}>
                  Full AI Report <i className="bi bi-chevron-right"></i>
                </button>

                <button onClick={() => navigate(`/owner/evaluation/${id}`)}>
                  Evaluation Dashboard <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="details-card">
              <div className="card-header-clean">
                <h5>
                  <i className="bi bi-people text-primary me-2"></i>
                  Contractor Submissions{" "}
                  <span className="badge bg-light text-dark ms-2">
                    {submissionsCount}
                  </span>
                </h5>

                <button
                  className="btn btn-link text-decoration-none p-0"
                  onClick={() =>
                    navigate(`/owner/tender-details/${tender.id}/submissions`)
                  }
                >
                  Compare all <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              <SubmissionsTable
                submissions={visibleSubmissions}
                loading={submissionsLoading}
                tenderId={tender.id}
                navigate={navigate}
                emptyText="No submissions received yet."
                tenderAwarded={tender.status === "awarded"}
              />
            </div>

            <div className="details-card mt-4">
              <h5>
                <i className="bi bi-file-earmark-text text-primary me-2"></i>
                Tender Documents
              </h5>

              <div className="documents-grid">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      type={(doc.file_type || "file").toUpperCase()}
                      name={getFileNameFromUrl(doc.file_url)}
                      meta={`${formatCategory(doc.file_category)} · ${formatDate(
                        doc.uploaded_at,
                      )}`}
                      fileUrl={doc.file_url}
                    />
                  ))
                ) : (
                  <p className="empty-documents mb-0">
                    No documents uploaded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="tender-side-column">
            <div className="details-card">
              <h6 className="side-card-title">PROJECT DETAILS</h6>

              <InfoRow
                label="Category"
                value={formatCategory(tender.project_category)}
              />
              <InfoRow
                label="Project Value"
                value={formatMoney(tender.budget)}
              />
              <InfoRow
                label="Duration"
                value={`${tender.duration_months || 0} months`}
              />
              <InfoRow
                label="Start Date"
                value={formatDate(tender.start_date)}
              />
              <InfoRow
                label="Submissions Received"
                value={String(submissionsCount)}
              />
              <InfoRow label="Days to Deadline" value={daysToDeadline} danger />
            </div>

            <div className="details-card mt-4">
              <h6 className="side-card-title">TENDER TIMELINE</h6>

              {buildTenderTimeline(tender, submissionsCount).map((step) => (
                <TimelineItem
                  key={step.title}
                  done={step.done}
                  active={step.active}
                  title={step.title}
                  date={step.date}
                  text={step.text}
                />
              ))}
            </div>

            <div className="tender-actions-panel mt-4">
              <button
                className="btn tender-action-btn update-btn"
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil-square"></i>
                Update
              </button>

              <button
                className="btn tender-action-btn delete-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-trash3"></i>
                Delete
              </button>
            </div>
          </aside>
        </div>
      </section>

      {showEditModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal large">
            <div className="custom-modal-header">
              <h4>Update Tender</h4>

              <button
                className="close-modal-btn"
                onClick={() => setShowEditModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form
              className="custom-modal-body-form"
              onSubmit={handleUpdateTender}
            >
              <div className="modal-form-grid">
                <div className="modal-field full">
                  <label>Project Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field full">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    name="description"
                    className="form-control"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Category</label>
                  <select
                    name="project_category"
                    className="form-select"
                    value={editForm.project_category}
                    onChange={handleEditChange}
                  >
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
                </div>

                <div className="modal-field">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={editForm.location}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Budget</label>
                  <input
                    type="number"
                    name="budget"
                    className="form-control"
                    value={editForm.budget}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Duration Months</label>
                  <input
                    type="number"
                    name="duration_months"
                    className="form-control"
                    value={editForm.duration_months}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    className="form-control"
                    value={editForm.start_date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Submission Deadline</label>
                  <input
                    type="date"
                    name="deadline_at"
                    className="form-control"
                    value={editForm.deadline_at}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={editForm.status}
                    onChange={handleEditChange}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="custom-modal-footer">
                <button
                  type="button"
                  className="btn modal-cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn modal-save-btn"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h4>Delete Tender</h4>

              <button
                className="close-modal-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="custom-modal-body">
              <div className="delete-confirm-box text-center py-3">
                <div className="delete-icon mb-3">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
                </div>

                <h5>Are you sure you want to delete this tender?</h5>
                <p className="text-muted">
                  This action will permanently remove <b>{tender.title}</b>.
                </p>
              </div>

              <div className="custom-modal-footer">
                <button
                  type="button"
                  className="btn modal-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn modal-delete-btn"
                  onClick={handleDeleteTender}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Tender"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

function SubmissionsTable({
  submissions,
  loading,
  tenderId,
  navigate,
  emptyText,
  tenderAwarded,
}) {
  return (
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
              <td colSpan="7" className="text-center py-3 text-muted">
                Loading submissions...
              </td>
            </tr>
          ) : submissions.length > 0 ? (
            submissions.map((submission, index) => (
              <tr
                key={submission.id || index}
                onClick={() =>
                  navigate(
                    `/owner/proposal-details/${tenderId}/${submission.id}`,
                  )
                }
                style={{ cursor: "pointer" }}
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
                      submission.status,
                      tenderAwarded,
                    )}`}
                  >
                    {formatSubmissionStatus(submission.status, tenderAwarded)}
                  </span>
                </td>

                <td>{submission.technical_score ?? "—"}</td>
                <td>{submission.financial_score ?? "—"}</td>
                <td>{submission.final_score ?? "—"}</td>
                <td>{submission.risk_score ?? "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-3 text-muted">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InfoRow({ label, value, danger }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <b className={danger ? "text-danger danger-highlight" : ""}>
        {value || "—"}
      </b>
    </div>
  );
}

function DocumentItem({ type, name, meta, fileUrl }) {
  return (
    <div className="document-item">
      <span className="doc-type-badge">{type}</span>

      <div className="doc-details-text">
        <strong>{name}</strong>
        <p>{meta}</p>
      </div>

      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="document-download-btn"
        download
      >
        <i className="bi bi-download"></i>
      </a>
    </div>
  );
}

function TimelineItem({ done, active, title, date, text }) {
  return (
    <div
      className={`timeline-item ${done ? "done" : ""} ${active ? "active" : ""}`}
    >
      <span className="timeline-dot"></span>

      <div className="timeline-body-content">
        <strong>{title}</strong>
        <p>{date}</p>
        {text && <small>{text}</small>}
      </div>
    </div>
  );
}

function buildTenderTimeline(tender, submissionsCount) {
  const now = new Date();
  const deadline = tender?.deadline_at ? new Date(tender.deadline_at) : null;

  const deadlinePassed =
    (deadline && deadline < now) ||
    tender?.status === "closed" ||
    tender?.status === "awarded";

  const evaluationDone =
    tender?.analysis_status === "completed" ||
    Boolean(tender?.comparison_result || tender?.recommendation_result);

  const evaluationRunning = tender?.analysis_status === "processing";
  const evaluationFailed = tender?.analysis_status === "failed";

  const isAwarded = tender?.status === "awarded";

  const steps = [
    {
      title: "Tender Published",
      done: true,
      date: formatDate(tender?.created_at),
      text: "Tender posted successfully",
    },
    {
      title: "Submission Deadline",
      done: deadlinePassed,
      date: formatDate(tender?.deadline_at),
      text: deadlinePassed
        ? `Submissions closed · ${submissionsCount} proposal${
            submissionsCount === 1 ? "" : "s"
          } received`
        : "Technical and financial proposals due",
    },
    {
      title: "AI Evaluation",
      done: evaluationDone,
      date: evaluationDone
        ? tender?.analyzed_at
          ? formatDate(tender.analyzed_at)
          : "Completed"
        : evaluationRunning
          ? "In progress"
          : evaluationFailed
            ? "Failed"
            : "After submission deadline",
      text: evaluationDone
        ? "Proposals compared and ranked"
        : evaluationRunning
          ? "AI is analyzing the submitted proposals"
          : evaluationFailed
            ? "Evaluation failed — please contact support"
            : undefined,
    },
    {
      title: "Contract Award",
      done: isAwarded,
      date: isAwarded ? formatDate(tender?.awarded_at) : "To be scheduled",
      text: isAwarded ? "Tender awarded to winning contractor" : undefined,
    },
  ];

  // Highlight the first stage that is not finished yet.
  const firstPending = steps.find((step) => !step.done);
  if (firstPending) firstPending.active = true;

  return steps;
}

function getTenderDisplayStatus(tender) {
  const deadline = tender?.deadline_at ? new Date(tender.deadline_at) : null;
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (tender?.status === "awarded") return "Awarded";
  if (tender?.status === "closed") return "Closed";
  if (deadline && deadline < today) return "Closed";
  if (tender?.status === "open") return "Active";

  return tender?.status || "Active";
}

function getFileNameFromUrl(url = "") {
  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return "Document";
  }
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

function formatSubmissionStatus(status, tenderAwarded) {
  if (status === "accepted" || status === "awarded") return "Awarded";
  if (status === "rejected" || tenderAwarded) return "Rejected";
  return "Under Review";
}

function getSubmissionStatusBadgeClass(status, tenderAwarded) {
  if (status === "accepted" || status === "awarded") {
    return "pill";
  }

  if (status === "rejected" || tenderAwarded) {
    return "pill regected";
  }

  return "bg-warning-subtle text-warning-emphasis";
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
    roads: "Roads & Infrastructure",
    buildings: "Buildings",
    electrical: "Electrical",
    mechanical: "Mechanical",
    water: "Water & Sewage",
    it: "IT & Telecom",
    consulting: "Consulting",
    supplies: "Supplies & Procurement",
    maintenance: "Maintenance",
    boq: "BOQ",
    drawing: "Drawing",
    specification: "Specification",
    financial: "Financial",
    other: "Other",
  };

  return map[category] || category || "—";
}

export default TenderDetails;
