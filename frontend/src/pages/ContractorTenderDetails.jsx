
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import ContractorLayout from "../components/ContractorLayout";
// import AppToast from "../components/AppToast";
// import { getTenderById } from "../services/tenderApi";
// import { getMySubmissions } from "../services/proposalApi";

// function ContractorTenderDetails() {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [tender, setTender] = useState(null);
//   const [mySubmissions, setMySubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [toast, setToast] = useState({
//     show: false,
//     type: "success",
//     title: "",
//     message: "",
//   });

//   function closeToast() {
//     setToast((prev) => ({ ...prev, show: false }));
//   }

//   useEffect(() => {
//     let cancelled = false;

//     Promise.all([getTenderById(id), getMySubmissions()])
//       .then(([tenderResponse, submissionsResponse]) => {
//         if (cancelled) return;

//         setTender(tenderResponse.data);

//         const submissionsList = Array.isArray(submissionsResponse.data)
//           ? submissionsResponse.data
//           : submissionsResponse.data.results || [];

//         setMySubmissions(submissionsList);
//       })
//       .catch((error) => {
//         console.error(
//           "Load contractor tender details error:",
//           error.response?.data || error
//         );

//         if (!cancelled) {
//           setTender(null);
//           setToast({
//             show: true,
//             type: "error",
//             title: "Failed to load tender",
//             message: "Unable to fetch tender details.",
//           });
//         }
//       })
//       .finally(() => {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [id]);

//   const mySubmission = useMemo(() => {
//     return mySubmissions.find((submission) => {
//       const tenderId = submission.tender?.id || submission.tender_id;
//       return String(tenderId) === String(id);
//     });
//   }, [mySubmissions, id]);

//   const isAlreadySubmitted = Boolean(mySubmission);

//   const daysToDeadline = useMemo(() => {
//     if (!tender?.deadline_at) return "—";

//     const today = new Date();
//     const deadline = new Date(tender.deadline_at);

//     today.setHours(0, 0, 0, 0);
//     deadline.setHours(0, 0, 0, 0);

//     const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

//     if (diff < 0) return "Closed";
//     if (diff === 0) return "Today";
//     return `${diff} days`;
//   }, [tender]);

//   const documents = tender?.files || [];
//   const projectCode = tender ? `T-${String(tender.id).padStart(4, "0")}` : "—";

//   if (loading) {
//     return (
//       <ContractorLayout activePage="dashboard">
//         <AppToast
//           show={toast.show}
//           type={toast.type}
//           title={toast.title}
//           message={toast.message}
//           onClose={closeToast}
//         />

//         <section className="contractor-tender-details-content">
//           <div className="details-card text-center py-5">
//             <div
//               className="spinner-border text-primary mb-3"
//               role="status"
//             ></div>
//             <p className="mb-0">Loading tender details...</p>
//           </div>
//         </section>
//       </ContractorLayout>
//     );
//   }

//   if (!tender) {
//     return (
//       <ContractorLayout activePage="dashboard">
//         <AppToast
//           show={toast.show}
//           type={toast.type}
//           title={toast.title}
//           message={toast.message}
//           onClose={closeToast}
//         />

//         <section className="contractor-tender-details-content">
//           <div className="details-card text-center py-5">
//             <h5>Tender not found</h5>
//             <p className="text-muted">
//               This tender may have been removed or is no longer available.
//             </p>

//             <button
//               className="btn btn-primary px-4 mt-3"
//               onClick={() => navigate("/contractor/dashboard")}
//             >
//               Back to Dashboard
//             </button>
//           </div>
//         </section>
//       </ContractorLayout>
//     );
//   }

//   return (
//     <ContractorLayout activePage="dashboard">
//       <AppToast
//         show={toast.show}
//         type={toast.type}
//         title={toast.title}
//         message={toast.message}
//         onClose={closeToast}
//       />

//       <section className="contractor-tender-details-content">
//         <div className="contractor-details-header">
//           <div className="header-info-side">
//             <div className="tender-tags">
//               <span className="project-code-badge">{projectCode}</span>
//               <b className="status-indicator">
//                 ● {formatStatus(tender.status)}
//               </b>
//             </div>

//             <div className="contractor-project-title-block">
//               <label>PROJECT</label>
//               <h2>{tender.title || "Untitled Tender"}</h2>
//             </div>

//             <p className="tender-meta-text">
//               <span>
//                 <i className="bi bi-geo-alt"></i> {tender.location || "N/A"}
//               </span>

//               <span>
//                 <i className="bi bi-calendar ms-md-3"></i> Deadline{" "}
//                 {formatDate(tender.deadline_at)}
//               </span>
//             </p>
//           </div>

//           <div className="contractor-details-actions">
 
//             <button
//   className="submit-bid-btn"
//   disabled={
//     isAlreadySubmitted ||
//     tender.status === "closed" ||
//     tender.status === "awarded" ||
//     isDeadlineClosed(tender.deadline_at)
//   }
//   onClick={() => {
//     if (
//       isAlreadySubmitted ||
//       tender.status === "closed" ||
//       tender.status === "awarded" ||
//       isDeadlineClosed(tender.deadline_at)
//     ) {
//       return;
//     }

//     navigate(`/contractor/submit-proposal/${tender.id}`);
//   }}
// >
//   {getSubmitButtonText(tender, isAlreadySubmitted)}
//   {!isAlreadySubmitted &&
//     tender.status !== "closed" &&
//     tender.status !== "awarded" &&
//     !isDeadlineClosed(tender.deadline_at) && (
//       <i className="bi bi-chevron-right"></i>
//     )}
// </button>
//           </div>
//         </div>

//         <div className="contractor-tender-grid">
//           <div className="contractor-tender-main">
//             <div className="details-card">
//               <h5>
//                 <i className="bi bi-file-earmark-text text-primary me-2"></i>
//                 Tender Documents
//               </h5>

//               <div className="documents-grid">
//                 {documents.length > 0 ? (
//                   documents.map((doc) => (
//                     <DocumentItem
//                       key={doc.id}
//                       type={(doc.file_type || "file").toUpperCase()}
//                       name={getFileNameFromUrl(doc.file_url)}
//                       meta={`${formatCategory(doc.file_category)} · ${formatDate(
//                         doc.uploaded_at
//                       )}`}
//                       fileUrl={doc.file_url}
//                     />
//                   ))
//                 ) : (
//                   <p className="empty-documents mb-0">
//                     No documents uploaded yet.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>

//           <aside className="contractor-tender-side">
//             <div className="details-card">
//               <h6 className="side-card-title">PROJECT DETAILS</h6>

//               <InfoRow
//                 label="Category"
//                 value={formatCategory(tender.project_category)}
//               />

//               <InfoRow
//                 label="Duration"
//                 value={`${tender.duration_months || 0} months`}
//               />

//               <InfoRow label="Start Date" value={formatDate(tender.start_date)} />

//               <InfoRow
//                 label="Submission Deadline"
//                 value={formatDate(tender.deadline_at)}
//               />

//               <InfoRow label="Days to Deadline" value={daysToDeadline} danger />

//               <InfoRow label="Status" value={formatStatus(tender.status)} />

//               <InfoRow
//                 label="Your Proposal"
//                 value={isAlreadySubmitted ? "Submitted" : "Not Submitted"}
//               />
//             </div>
//           </aside>
//         </div>
//       </section>
//     </ContractorLayout>
//   );
// }

// function InfoRow({ label, value, danger }) {
//   return (
//     <div className="info-row">
//       <span>{label}</span>
//       <b className={danger ? "text-danger danger-highlight" : ""}>
//         {value || "—"}
//       </b>
//     </div>
//   );
// }

// function DocumentItem({ type, name, meta, fileUrl }) {
//   return (
//     <div className="document-item">
//       <span className="doc-type-badge">{type}</span>

//       <div className="doc-details-text">
//         <strong>{name}</strong>
//         <p>{meta}</p>
//       </div>

//       <a
//         href={fileUrl}
//         target="_blank"
//         rel="noreferrer"
//         className="document-download-btn"
//         download
//       >
//         <i className="bi bi-download"></i>
//       </a>
//     </div>
//   );
// }

// function getFileNameFromUrl(url = "") {
//   try {
//     return decodeURIComponent(url.split("/").pop());
//   } catch {
//     return "Document";
//   }
// }

// function formatDate(value) {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return "—";

//   return date.toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// }

// function formatStatus(status) {
//   if (!status) return "Active";

//   if (status === "open") return "Active";
//   if (status === "closed") return "Closed";
//   if (status === "awarded") return "Awarded";

//   return status.charAt(0).toUpperCase() + status.slice(1);
// }

// function formatCategory(category) {
//   const map = {
//     construction: "Construction",
//     roads: "Roads & Infrastructure",
//     buildings: "Buildings",
//     electrical: "Electrical",
//     mechanical: "Mechanical",
//     water: "Water & Sewage",
//     it: "IT & Telecom",
//     consulting: "Consulting",
//     supplies: "Supplies & Procurement",
//     maintenance: "Maintenance",
//     boq: "BOQ",
//     drawing: "Drawing",
//     specification: "Specification",
//     financial: "Financial",
//     other: "Other",
//   };

//   return map[category] || category || "—";
// }
// function isDeadlineClosed(deadline) {
//   if (!deadline) return false;

//   const today = new Date();
//   const deadlineDate = new Date(deadline);

//   today.setHours(0, 0, 0, 0);
//   deadlineDate.setHours(0, 0, 0, 0);

//   return deadlineDate < today;
// }

// function getSubmitButtonText(tender, isAlreadySubmitted) {
//   if (tender.status === "awarded") return "Awarded";
//   if (tender.status === "closed" || isDeadlineClosed(tender.deadline_at)) {
//     return "Closed";
//   }
//   if (isAlreadySubmitted) return "Submitted";

//   return "Submit Bid";
// }

// export default ContractorTenderDetails;
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ContractorLayout from "../components/ContractorLayout";
import AppToast from "../components/AppToast";
import { getTenderById } from "../services/tenderApi";
import { getMySubmissions } from "../services/proposalApi";

function ContractorTenderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [tender, setTender] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  function closeToast() {
    setToast((prev) => ({ ...prev, show: false }));
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([getTenderById(id), getMySubmissions()])
      .then(([tenderResponse, submissionsResponse]) => {
        if (cancelled) return;

        setTender(tenderResponse.data);

        const submissionsList = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : submissionsResponse.data.results || [];

        setMySubmissions(submissionsList);
      })
      .catch((error) => {
        console.error(
          "Load contractor tender details error:",
          error.response?.data || error
        );

        if (!cancelled) {
          setTender(null);
          setToast({
            show: true,
            type: "error",
            title: "Failed to load tender",
            message: "Unable to fetch tender details.",
          });
        }
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

  const mySubmission = useMemo(() => {
    return mySubmissions.find((submission) => {
      const tenderId = submission.tender?.id || submission.tender_id;
      return String(tenderId) === String(id);
    });
  }, [mySubmissions, id]);

  const isAlreadySubmitted = Boolean(mySubmission);

  const displayStatus = tender ? getTenderDisplayStatus(tender) : "Active";

  const isSubmitDisabled =
    isAlreadySubmitted || displayStatus === "Closed" || displayStatus === "Awarded";

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

  const documents = tender?.files || [];
  const projectCode = tender ? `T-${String(tender.id).padStart(4, "0")}` : "—";

  if (loading) {
    return (
      <ContractorLayout activePage="dashboard">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="contractor-tender-details-content">
          <div className="details-card text-center py-5">
            <div
              className="spinner-border text-primary mb-3"
              role="status"
            ></div>
            <p className="mb-0">Loading tender details...</p>
          </div>
        </section>
      </ContractorLayout>
    );
  }

  if (!tender) {
    return (
      <ContractorLayout activePage="dashboard">
        <AppToast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={closeToast}
        />

        <section className="contractor-tender-details-content">
          <div className="details-card text-center py-5">
            <h5>Tender not found</h5>
            <p className="text-muted">
              This tender may have been removed or is no longer available.
            </p>

            <button
              className="btn btn-primary px-4 mt-3"
              onClick={() => navigate("/contractor/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </ContractorLayout>
    );
  }

  return (
    <ContractorLayout activePage="dashboard">
      <AppToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={closeToast}
      />

      <section className="contractor-tender-details-content">
        <div className="contractor-details-header">
          <div className="header-info-side">
            <div className="tender-tags">
              <span className="project-code-badge">{projectCode}</span>

              <b
                className={`status-indicator ${displayStatus
                  .replaceAll(" ", "-")
                  .toLowerCase()}`}
              >
                ● {displayStatus}
              </b>
            </div>

            <div className="contractor-project-title-block">
              <label>PROJECT</label>
              <h2>{tender.title || "Untitled Tender"}</h2>
            </div>

            <p className="tender-meta-text">
              <span>
                <i className="bi bi-geo-alt"></i> {tender.location || "N/A"}
              </span>

              <span>
                <i className="bi bi-calendar ms-md-3"></i> Deadline{" "}
                {formatDate(tender.deadline_at)}
              </span>
            </p>
          </div>

          <div className="contractor-details-actions">
            <button
              className={`submit-bid-btn ${isSubmitDisabled ? "disabled" : ""}`}
              disabled={isSubmitDisabled}
              onClick={() => {
                if (isSubmitDisabled) return;
                navigate(`/contractor/submit-proposal/${tender.id}`);
              }}
            >
              {getSubmitButtonText(displayStatus, isAlreadySubmitted)}

              {!isSubmitDisabled && <i className="bi bi-chevron-right"></i>}
            </button>
          </div>
        </div>

        <div className="contractor-tender-grid">
          <div className="contractor-tender-main">

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
                        doc.uploaded_at
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

          <aside className="contractor-tender-side">
            <div className="details-card">
              <h6 className="side-card-title">PROJECT DETAILS</h6>

              <InfoRow
                label="Category"
                value={formatCategory(tender.project_category)}
              />

              <InfoRow
                label="Duration"
                value={`${tender.duration_months || 0} months`}
              />

              <InfoRow label="Start Date" value={formatDate(tender.start_date)} />

              <InfoRow
                label="Submission Deadline"
                value={formatDate(tender.deadline_at)}
              />

              <InfoRow label="Days to Deadline" value={daysToDeadline} danger />

              <InfoRow label="Status" value={displayStatus} />

              <InfoRow
                label="Your Proposal"
                value={isAlreadySubmitted ? "Submitted" : "Not Submitted"}
              />
            </div>
          </aside>
        </div>
      </section>
    </ContractorLayout>
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
        onClick={(e) => e.stopPropagation()}
      >
        <i className="bi bi-download"></i>
      </a>
    </div>
  );
}

function getTenderDisplayStatus(tender) {
  const deadline = tender.deadline_at ? new Date(tender.deadline_at) : null;
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (tender.status === "awarded") return "Awarded";
  if (tender.status === "closed") return "Closed";
  if (deadline && deadline < today) return "Closed";
  if (tender.status === "open") return "Active";

  return tender.status || "Active";
}

function getSubmitButtonText(displayStatus, isAlreadySubmitted) {
  if (displayStatus === "Awarded") return "Awarded";
  if (displayStatus === "Closed") return "Closed";
  if (isAlreadySubmitted) return "Submitted";

  return "Submit Bid";
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

export default ContractorTenderDetails;