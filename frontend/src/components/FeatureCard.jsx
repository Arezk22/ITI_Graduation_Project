function FeatureCard({ icon, title, text }) {
  return (
    <div className="col-md-4">
      <div className="feature-card">
        <div className="feature-icon">
          <i className={`bi ${icon}`}></i>
        </div>
        <h5>{title}</h5>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default FeatureCard;