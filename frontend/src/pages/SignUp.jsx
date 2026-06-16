import { Link } from "react-router-dom";

function SignUp() {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="brand-icon">
            <i className="bi bi-building"></i>
          </span>
          <span>BuildTender AI</span>
        </div>

        <div className="auth-content">
          <h1>The intelligent platform for construction procurement</h1>
          <p>
            AI-powered tender evaluation, contractor scoring, and risk analysis —
            all in one place.
          </p>

          <div className="auth-feature">
            <span></span>
            <div>
              <h5>AI Contractor Evaluation</h5>
              <p>Score 50 contractors in minutes, not weeks</p>
            </div>
          </div>

          <div className="auth-feature">
            <span></span>
            <div>
              <h5>Risk Detection</h5>
              <p>Catch suspicious bids before they cause delays</p>
            </div>
          </div>

          <div className="auth-feature">
            <span></span>
            <div>
              <h5>Document Intelligence</h5>
              <p>Chat with BOQs and specification documents</p>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          © 2026 BuildTender AI · Enterprise Construction Procurement Platform
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <h2>Create your account</h2>
          <p>Select your role to get started</p>

          <Link to="/signup/owner" className="signup-role-card text-decoration-none">
            <div className="signup-role-icon owner-icon">
              <i className="bi bi-briefcase"></i>
            </div>

            <div>
              <h5>Project Owner</h5>
              <p>I manage construction projects and invite contractors to tender</p>
            </div>
          </Link>

          <Link to="/signup/contractor" className="signup-role-card text-decoration-none">
            <div className="signup-role-icon contractor-icon">
              <i className="bi bi-cone-striped"></i>
            </div>

            <div>
              <h5>Contractor</h5>
              <p>I submit proposals and compete for construction tenders</p>
            </div>
          </Link>

          <p className="signup-text">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;