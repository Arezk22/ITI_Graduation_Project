

import { useEffect, useMemo, useState } from "react";
import OwnerLayout from "../components/OwnerLayout";
import { getAllTenders } from "../services/tenderApi";

function Reports() {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);
  const [loadingTenders, setLoadingTenders] = useState(true);

  useEffect(() => {
    getAllTenders()
      .then((response) => {
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.tenders || response.data.results || [];

        setTenders(list);

        if (list.length > 0) {
          setSelectedTenderId(String(list[0].id));
        }
      })
      .catch((error) => {
        console.error("Load tenders error:", error.response?.data || error);
        setTenders([]);
      })
      .finally(() => {
        setLoadingTenders(false);
      });
  }, []);

  const selectedTender = useMemo(() => {
    return tenders.find((tender) => String(tender.id) === selectedTenderId);
  }, [tenders, selectedTenderId]);

  const selectedTenderTitle = selectedTender?.title || "Select Tender";

  const reports = [
    {
      icon: "bi-file-earmark-text",
      title: "Tender Evaluation Report",
      type: "PDF",
      color: "red",
      desc: "Complete contractor comparison with AI scores, risk analysis, and final rankings",
      meta: "18 pages · 2.4 MB · Jun 10, 2026",
    },
    {
      icon: "bi-table",
      title: "BOQ Comparison Matrix",
      type: "Excel",
      color: "green",
      desc: "Side-by-side comparison of all contractor BOQ pricing across 247 line items",
      meta: "12 sheets · 1.8 MB · Jun 10, 2026",
    },
    {
      icon: "bi-cpu",
      title: "AI Risk Analysis Report",
      type: "PDF",
      color: "purple",
      desc: "Detailed risk assessment, anomaly detection results, and compliance checklist",
      meta: "9 pages · 1.1 MB · Jun 10, 2026",
    },
    {
      icon: "bi-stars",
      title: "Executive Summary",
      type: "PDF",
      color: "orange",
      desc: "AI-generated 2-page brief for stakeholders: top recommendation, key findings, next steps",
      meta: "2 pages · 0.5 MB · Jun 10, 2026",
    },
    {
      icon: "bi-grid",
      title: "Contractor Tracking Sheet",
      type: "Excel",
      color: "blue",
      desc: "All contractor submission statuses, scores, contact info, and document checklist",
      meta: "4 sheets · 0.9 MB · Jun 10, 2026",
    },
  ];

  return (
    <OwnerLayout activePage="reports">
      <section className="reports-content">
        <div className="reports-header reports-header-with-dropdown">
          <div className="report-tender-dropdown-wrap">
            <label>REPORT EXPORT</label>

            <button
              type="button"
              className="report-tender-dropdown-btn"
              onClick={() => setTenderDropdownOpen((prev) => !prev)}
            >
              <span>
                {loadingTenders ? "Loading tenders..." : selectedTenderTitle}
              </span>

              <i
                className={`bi ${
                  tenderDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"
                }`}
              ></i>
            </button>

            {tenderDropdownOpen && (
              <div className="report-tender-dropdown-menu">
                {tenders.length === 0 ? (
                  <div className="report-tender-empty">No tenders found</div>
                ) : (
                  tenders.map((tender) => (
                    <button
                      type="button"
                      key={tender.id}
                      className={
                        String(tender.id) === selectedTenderId ? "active" : ""
                      }
                      onClick={() => {
                        setSelectedTenderId(String(tender.id));
                        setTenderDropdownOpen(false);
                      }}
                    >
                      <strong>{tender.title}</strong>
                      <span>
                        {formatTenderId(tender.id)} ·{" "}
                        {formatCategory(tender.project_category)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <p>
            Download AI-generated evaluation reports for{" "}
            <strong>{selectedTenderTitle}</strong>
          </p>
        </div>

        <div className="executive-report-card">
          <div className="executive-report-top">
            <div className="report-title-box">
              <div className="report-ai-icon">
                <i className="bi bi-stars"></i>
              </div>

              <div>
                <h5>AI-Generated Executive Summary</h5>
                <p>
                  BuildTender AI v3.2 · Generated Jun 10, 2026
                  {selectedTender ? ` · ${formatTenderId(selectedTender.id)}` : ""}
                </p>
              </div>
            </div>

            <button className="download-main-btn">
              <i className="bi bi-download"></i>
              Download PDF
            </button>
          </div>

          <div className="summary-preview">
            <h5>Executive Summary — {selectedTenderTitle}</h5>
            <p>
              Tender Evaluation Complete | Generated by BuildTender AI | June 10,
              2026
            </p>

            <h6>Key Findings</h6>
            <p>
              Proposals evaluated across price, technical quality, experience,
              and compliance criteria.
            </p>

            <ul>
              <li>Recommended contractor based on AI evaluation ranking</li>
              <li>Technical, financial, risk, and compliance scores reviewed</li>
              <li>Contractor submissions compared against tender requirements</li>
              <li>Risk indicators and document gaps highlighted for review</li>
              <li>Final recommendation prepared for owner decision-making</li>
            </ul>

            <h6>Recommended Next Steps</h6>
            <ol>
              <li>Review the top-ranked contractor submission</li>
              <li>Validate any critical risks or missing documents</li>
              <li>Confirm budget alignment and technical compliance</li>
              <li>Proceed with award decision after final approval</li>
            </ol>
          </div>
        </div>

        <h5 className="available-title">Available Reports</h5>

        <div className="reports-list">
          {reports.map((report) => (
            <div className="report-row" key={report.title}>
              <div className={`report-file-icon ${report.color}`}>
                <i className={`bi ${report.icon}`}></i>
              </div>

              <div className="report-info">
                <h5>
                  {report.title}
                  <span className={report.color}>{report.type}</span>
                </h5>

                <p>{report.desc}</p>

                <small>
                  <i className="bi bi-clock"></i> {report.meta}
                </small>
              </div>

              <div className="report-actions">
                <button className="preview-btn">
                  <i className="bi bi-eye"></i>
                </button>

                <button className="download-report-btn">
                  <i className="bi bi-download"></i>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="download-all-box">
          <div>
            <h5>Download All Reports</h5>
            <p>All 5 reports bundled as a ZIP file · 6.7 MB total</p>
          </div>

          <button className="download-main-btn">
            <i className="bi bi-download"></i>
            Download All (ZIP)
          </button>
        </div>
      </section>
    </OwnerLayout>
  );
}

function formatTenderId(id) {
  return `T-${String(id).padStart(4, "0")}`;
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
    other: "Other",
  };

  return map[category] || category || "Other";
}

export default Reports;