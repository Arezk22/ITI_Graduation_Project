// AI recommendation banner for the Evaluation page: shows the analysis
// state and, when completed, the top recommended contractor.
import { contractorName, formatScore } from "../services/reportService";

function AiRecommendationBanner({ loading, status, isCompleted, winner }) {
  return (
    <div className="ai-recommendation">
      <div className="ai-icon">
        <i className="bi bi-cpu"></i>
      </div>

      <div>
        <h5>
          AI Recommendation{" "}
          <span>
            {loading
              ? "Loading..."
              : isCompleted
                ? "Ready"
                : status === "Invalid Documents"
                  ? "Invalid"
                  : "Pending"}
          </span>
        </h5>

        <p>
          {loading
            ? "Fetching AI evaluation results..."
            : isCompleted
              ? winner
                ? `Top recommendation: ${contractorName(winner)} with an overall score of ${formatScore(winner.final_score)}. Full comparison below.`
                : "AI analysis completed. View contractor evaluations, risk scores, and recommendations below."
              : status === "Invalid Documents"
                ? "The tender documents could not be analyzed. Please re-upload clearer documents."
                : "AI evaluation will appear here after proposal analysis is completed. Contractor scores, risks, and recommendation will be generated based on submitted proposal documents."}
        </p>
      </div>

      <div className="rank-badge muted-rank">
        {loading ? (
          <>
            <i className="bi bi-arrow-repeat"></i>
            Loading...
          </>
        ) : isCompleted ? (
          <>
            <i className="bi bi-check-circle"></i>
            Completed
          </>
        ) : status === "processing" ? (
          <>
            <i className="bi bi-arrow-repeat"></i>
            Processing
          </>
        ) : status === "Invalid Documents" ? (
          <>
            <i className="bi bi-exclamation-triangle"></i>
            Invalid
          </>
        ) : (
          <>
            <i className="bi bi-hourglass-split"></i>
            Pending
          </>
        )}
      </div>
    </div>
  );
}

export default AiRecommendationBanner;
