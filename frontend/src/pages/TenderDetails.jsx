import { useNavigate } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";

function TenderDetails() {
  const navigate = useNavigate();

  return (
    <OwnerLayout activePage="tender-details">
      <section className="tender-details-content">
        <div className="tender-details-header">
          <div>
            <div className="tender-tags">
              <span>T-2024-089</span>
              <b>● Active</b>
            </div>

            <h2>Eastfield Tower Complex</h2>

            <p>
              <i className="bi bi-geo-alt"></i> Dubai, UAE
              <i className="bi bi-calendar ms-3"></i> Deadline Jun 28, 2026
              <i className="bi bi-currency-dollar ms-3"></i> Budget $8.4M
            </p>
          </div>

          <div className="tender-header-actions">
            <button
              className="btn ask-ai-btn"
              onClick={() => navigate("/owner/document-chat")}
            >
              <i className="bi bi-cpu"></i>
              Ask AI
            </button>

            <button
              className="btn view-eval-btn"
              onClick={() => navigate("/owner/evaluation")}
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

              <p>
                12 contractors have submitted. AlSalam Construction leads with the
                highest technical score (91/100) and a strong trust rating. Peak
                Contracting's bid is 34% below market average — flagged for anomaly
                review. Recommend shortlisting top 3 based on composite AI score.
              </p>

              <div className="summary-links">
                <button onClick={() => navigate("/owner/ai-analysis")}>
                  Full AI Report <i className="bi bi-chevron-right"></i>
                </button>

                <button onClick={() => navigate("/owner/evaluation")}>
                  Evaluation Dashboard <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="details-card">
              <div className="card-header-clean">
                <h5>
                  <i className="bi bi-people text-primary"></i>
                  Contractor Submissions <span>12</span>
                </h5>

                <button onClick={() => navigate("/owner/evaluation")}>
                  Compare all <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              <table className="table tender-submissions-table align-middle">
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
                  <tr>
                    <td><span className="mini-avatar">A</span> AlSalam Construction</td>
                    <td>Jun 8, 2026</td>
                    <td><span className="status-badge active">Complete</span></td>
                    <td>91/100</td>
                    <td>$4.2M</td>
                    <td className="blue-text">88</td>
                    <td><span className="risk low">• Low</span></td>
                  </tr>

                  <tr>
                    <td><span className="mini-avatar">M</span> Meridian Builders Ltd</td>
                    <td>Jun 9, 2026</td>
                    <td><span className="status-badge active">Complete</span></td>
                    <td>84/100</td>
                    <td>$3.9M</td>
                    <td className="blue-text">82</td>
                    <td><span className="risk med">• Medium</span></td>
                  </tr>

                  <tr>
                    <td><span className="mini-avatar">P</span> Peak Contracting LLC</td>
                    <td>Jun 9, 2026</td>
                    <td><span className="status-badge active">Complete</span></td>
                    <td>76/100</td>
                    <td>$3.7M</td>
                    <td className="blue-text">71</td>
                    <td><span className="risk high">• High</span></td>
                  </tr>

                  <tr>
                    <td><span className="mini-avatar">N</span> Nexus Civil Works</td>
                    <td>—</td>
                    <td><span className="status-badge awarded">Pending</span></td>
                    <td>—</td>
                    <td>—</td>
                    <td className="blue-text">79</td>
                    <td>—</td>
                  </tr>

                  <tr>
                    <td><span className="mini-avatar">A</span> Arcline Infrastructure</td>
                    <td>—</td>
                    <td><span className="status-badge under-review">Invited</span></td>
                    <td>—</td>
                    <td>—</td>
                    <td className="blue-text">85</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="details-card mt-4">
              <h5>
                <i className="bi bi-file-earmark-text text-primary"></i>
                Tender Documents
              </h5>

              <div className="documents-grid">
                <DocumentItem type="XLSX" name="BOQ_Eastfield_Tower.xlsx" meta="2.4 MB · May 15" />
                <DocumentItem type="PDF" name="Arch_Drawings_v3.pdf" meta="18.2 MB · May 15" />
                <DocumentItem type="PDF" name="Structural_Layout.pdf" meta="9.1 MB · May 15" />
                <DocumentItem type="DOCX" name="Technical_Specifications.docx" meta="1.8 MB · May 16" />
              </div>
            </div>
          </div>

          <aside className="tender-side-column">
            <div className="details-card">
              <h6>PROJECT DETAILS</h6>

              <InfoRow label="Category" value="Commercial Building" />
              <InfoRow label="Project Value" value="USD 8,400,000" />
              <InfoRow label="Duration" value="18 months" />
              <InfoRow label="Invited Contractors" value="47" />
              <InfoRow label="Submissions Received" value="12 of 47" />
              <InfoRow label="Days to Deadline" value="18 days" danger />
            </div>

            <div className="details-card mt-4">
              <h6>TENDER TIMELINE</h6>

              <TimelineItem done title="Tender Published" date="May 15, 2026" text="Tender posted and contractor notifications sent" />
              <TimelineItem done title="Pre-Qualification Open" date="May 18, 2026" text="47 contractors invited to pre-qualify" />
              <TimelineItem done title="Site Visit" date="Jun 5, 2026" text="12 contractors attended the site walkthrough" />
              <TimelineItem active title="Submission Deadline" date="Jun 28, 2026" text="Technical and financial proposals due" />
              <TimelineItem title="AI Evaluation" date="Jul 5, 2026" />
              <TimelineItem title="Shortlisting" date="Jul 15, 2026" />
              <TimelineItem title="Contract Award" date="Aug 1, 2026" />
            </div>
          </aside>
        </div>
      </section>
    </OwnerLayout>
  );
}

function InfoRow({ label, value, danger }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <b className={danger ? "danger" : ""}>{value}</b>
    </div>
  );
}

function DocumentItem({ type, name, meta }) {
  return (
    <div className="document-item">
      <span>{type}</span>
      <div>
        <strong>{name}</strong>
        <p>{meta}</p>
      </div>
    </div>
  );
}

function TimelineItem({ done, active, title, date, text }) {
  return (
    <div className={`timeline-item ${done ? "done" : ""} ${active ? "active" : ""}`}>
      <span></span>
      <div>
        <strong>{title}</strong>
        <p>{date}</p>
        {text && <small>{text}</small>}
      </div>
    </div>
  );
}

export default TenderDetails;