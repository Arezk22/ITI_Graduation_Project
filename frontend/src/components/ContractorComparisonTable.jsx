// Ranked contractor comparison table for the Evaluation page.
// Expects submissions already ranked best -> worst (from reportService).
import { useNavigate } from "react-router-dom";
import { RiskPill, RecommendationPill } from "./ReportBadges";
import {
  contractorName,
  formatScore,
  formatMoney,
} from "../services/reportService";
import { getContractorId, trustScore } from "../services/evaluationService";

function ContractorComparisonTable({ tenderId, submissions }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card mt-4">
      <div className="card-header-clean evaluation-table-header">
        <h5>
          Contractor Comparison
          <span className="submission-count-circle">{submissions.length}</span>
        </h5>
      </div>

      <div className="evaluation-table-wrap">
        <table className="rp-table align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Contractor</th>
              <th>Overall</th>
              <th>Technical</th>
              <th>Financial</th>
              <th>Experience</th>
              <th>Compliance</th>
              <th>Trust</th>
              <th>Risk</th>
              <th>Bid Price</th>
              <th>Recommendation</th>
            </tr>
          </thead>

          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center text-muted py-4">
                  No submissions analyzed yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub, index) => (
                <tr
                  key={sub.id || index}
                  className={`clickable-table-row ${index === 0 ? "rp-row-top" : ""}`}
                  onClick={() =>
                    navigate(`/owner/proposal-details/${tenderId}/${sub.id}`)
                  }
                >
                  <td>
                    <span className="rp-rank">{index + 1}</span>
                  </td>

                  <td className="rp-contractor-cell">
                    <button
                      className="contractor-name-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/owner/contractor-profile/${getContractorId(sub)}`,
                        );
                      }}
                    >
                      {contractorName(sub)}
                    </button>
                  </td>

                  <td>
                    <strong>{formatScore(sub.final_score)}</strong>
                  </td>
                  <td>{formatScore(sub.technical_score)}</td>
                  <td>{formatScore(sub.financial_score)}</td>
                  <td>{formatScore(sub.structured_data?.experience_years)} yrs</td>
                  <td>
                    {formatScore(sub.validation_result?.compliance_score)}
                  </td>
                  <td>{trustScore(sub)}</td>
                  <td>
                    <RiskPill sub={sub} />
                  </td>
                  <td>{formatMoney(sub.financial_result?.total_bid_price)}</td>
                  <td>
                    <RecommendationPill sub={sub} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ContractorComparisonTable;
