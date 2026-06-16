import { Link } from "react-router-dom";

function OwnerSignUp() {
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
          <Link to="/signup" className="auth-back-link">
            <i className="bi bi-chevron-left"></i> Back
          </Link>

          <h2>Complete your profile</h2>
          <p>Set up your project owner account details</p>

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control auth-input" placeholder="James Whitfield" />
          </div>

          <div className="mb-3">
            <label className="form-label">Company Name</label>
            <input type="text" className="form-control auth-input" placeholder="Whitfield Properties LLC" />
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control auth-input" placeholder="james@whitfieldprop.com" />
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input type="password" className="form-control auth-input" placeholder="••••••••" />
              <i className="bi bi-eye"></i>
            </div>
          </div>

          <button className="btn auth-submit w-100">Create Account</button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button>Google</button>
            <button>Microsoft</button>
          </div>

          <p className="signup-text">
            Already registered? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OwnerSignUp;