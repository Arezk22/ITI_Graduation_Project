function Hero() {
  return (
    <section className="hero-section">
      <div className="container text-center">
        <span className="hero-badge">
          <i className="bi bi-stars"></i> AI-Powered Construction Procurement
        </span>

        <h1>
          Smarter Tender Management <br />
          <span>Powered by AI</span>
        </h1>

        <p className="hero-text">
          Evaluate contractors, detect risks, and award the right tender —
          with AI that understands construction procurement from BOQ to final award.
        </p>

        <div className="hero-preview">
          <div className="browser-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="preview-card">
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="dark-stat">
                  <p>Active Tenders</p>
                  <h4>12</h4>
                  <small>+3 this week</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="dark-stat">
                  <p>Pending Bids</p>
                  <h4>48</h4>
                  <small className="text-warning">8 require review</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="dark-stat">
                  <p>AI Flags</p>
                  <h4>3</h4>
                  <small className="text-danger">High risk detected</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="dark-stat">
                  <p>Avg Trust Score</p>
                  <h4>87%</h4>
                  <small className="text-success">+2.4 this month</small>
                </div>
              </div>
            </div>

            <div className="contractor-table">
              <h6>Contractor Rankings — Eastfield Tower Complex</h6>
              <div className="ranking-row">
                <span>1</span>
                <strong>AlSakan Construction</strong>
                <em>$4.2M</em>
                <b className="badge bg-success">Low Risk</b>
              </div>
              <div className="ranking-row">
                <span>2</span>
                <strong>Meridian Builders</strong>
                <em>$3.9M</em>
                <b className="badge bg-warning text-dark">Medium Risk</b>
              </div>
              <div className="ranking-row">
                <span>3</span>
                <strong>Peak Contracting</strong>
                <em>$3.7M</em>
                <b className="badge bg-danger">High Risk</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;