// Presentational building blocks for the AI Analysis & Risk Center page.

export function AIMetric({ icon, value, title, note, color }) {
  return (
    <div className="col-xl col-lg-4 col-md-6">
      <div className="ai-metric-card">
        <div className={`ai-metric-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>

        <h3 className={color}>{value}</h3>
        <h6>{title}</h6>
        <p>{note}</p>
      </div>
    </div>
  );
}

export function ValidationRow({ icon, tone, name, text, label }) {
  return (
    <div className="validation-row">
      <i className={`bi ${icon} ${tone}`}></i>
      <span>{name}</span>
      <p>{text}</p>
      <b className={tone}>{label}</b>
    </div>
  );
}

export function RiskIssue({
  type,
  title,
  severity,
  impact,
  contractor,
  text,
  details,
  recommendation,
}) {
  return (
    <div className={`risk-issue ${type}`}>
      <div className="risk-issue-header">
        <div>
          <h5>
            <i className="bi bi-exclamation-triangle"></i>
            {title}
            <span>{severity}</span>
          </h5>

          <p>{contractor}</p>
        </div>

        <b>{impact}</b>
      </div>

      <p className="risk-main-text">{text}</p>

      {details && <div className="risk-code">{details}</div>}

      {recommendation && (
        <div className="risk-recommendation">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Recommendation:</strong> {recommendation}
        </div>
      )}
    </div>
  );
}

export function DecisionCard({ type, title, text }) {
  return (
    <div className="col-lg-4">
      <div className={`decision-card ${type}`}>
        <i
          className={`bi ${
            type === "success"
              ? "bi-check-circle"
              : type === "warning"
                ? "bi-exclamation-circle"
                : "bi-x-circle"
          }`}
        ></i>

        <h5>{title}</h5>
        <p>{text}</p>
      </div>
    </div>
  );
}
