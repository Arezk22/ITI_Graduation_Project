// Bid price comparison bar chart for the Evaluation page.
import { useMemo } from "react";
import { formatMoney } from "../services/reportService";
import {
  buildBidChartData,
  getBidBarHeight,
  getPriceAxisLabels,
  shortName,
} from "../services/evaluationService";

function BidPriceChart({ submissions }) {
  const chartSubmissions = useMemo(
    () => buildBidChartData(submissions),
    [submissions],
  );

  return (
    <div className="row g-4 mt-1">
      <div className="col-lg-12">
        <div className="dashboard-card eval-chart-card">
          <h5>Bid Price Comparison</h5>

          <div className="contractor-score-chart">
            <div className="score-axis">
              {getPriceAxisLabels(chartSubmissions).map((value, idx) => (
                <span key={idx}>{value}</span>
              ))}
            </div>

            <div className="score-chart-bars">
              {chartSubmissions.length === 0 ? (
                <div className="empty-chart-message">
                  No bid prices available yet.
                </div>
              ) : (
                chartSubmissions.map((item, index) => (
                  <div
                    className="score-bar-group"
                    key={`${item.name}-${index}`}
                  >
                    <div className="score-bar-area">
                      <span
                        className="score-bar"
                        style={{
                          height: `${getBidBarHeight(
                            item.price,
                            chartSubmissions,
                          )}%`,
                        }}
                        title={formatMoney(item.price)}
                      ></span>
                    </div>

                    <p title={item.name}>{shortName(item.name)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="chart-note">
            Bid price values will appear after financial proposal analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BidPriceChart;
