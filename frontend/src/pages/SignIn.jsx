import { Link } from "react-router-dom";

function SignIn() {
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
          <h2>Welcome back</h2>
          <p>Sign in to your BuildTender account</p>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control auth-input"
              placeholder="james@whitfieldprop.com"
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <label className="form-label">Password</label>
            </div>
            <div className="password-wrapper">
              <input
                type="password"
                className="form-control auth-input"
                placeholder="••••••••"
              />
              <i className="bi bi-eye"></i>
            </div>
          </div>

          <div className="text-end mb-4">
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          {/* <label className="form-label">Sign in as</label>
          <div className="role-buttons">
            <button>Owner</button>
            <button>Contractor</button>
            <button>Admin</button>
          </div> */}

          <button className="btn auth-submit w-100 mt-4">Sign In</button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button>Google</button>
            <button>Microsoft</button>
          </div>

          <p className="signup-text">
            Don't have an account? <Link to="/signup">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;