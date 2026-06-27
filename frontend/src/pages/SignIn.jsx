

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveTokens } from "../services/authApi";

function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });
  };



const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    setIsLoading(true);

    const response = await login(formData.email, formData.password);

    const { access, refresh, role } = response.data;

    saveTokens(access, refresh);

    localStorage.setItem("userEmail", formData.email);


    if (role === "owner") {
      localStorage.setItem("userRole", "owner");
      navigate("/owner/dashboard");
    } else if (role === "contractor") {
      localStorage.setItem("userRole", "contractor");
      navigate("/contractor/dashboard");
    } else {
      // مؤقتًا لحد ما الباك يرجع role
      localStorage.setItem("userRole", "owner");
      navigate("/owner/dashboard");
    }
  } catch (error) {
    setErrors({
      form: error.response?.data?.detail || "Invalid email or password",
    });
  } finally {
    setIsLoading(false);
  }
};

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
          {errors.form && (
  <div className="alert alert-danger mb-3">
    {errors.form}
  </div>
)}

          <div className="mb-3">
            <label className="form-label">Email Address</label>

            <input
              type="email"
              name="email"
              className={`form-control auth-input ${
                errors.email ? "is-invalid" : ""
              }`}
              placeholder="james@whitfieldprop.com"
              value={formData.email}
              onChange={handleChange}
            />

            {errors.email && (
              <div className="invalid-feedback d-block">
                {errors.email}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`form-control auth-input ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`bi ${
                    showPassword ? "bi-eye-slash" : "bi-eye"
                  }`}
                ></i>
              </button>
            </div>

            {errors.password && (
              <div className="invalid-feedback d-block">
                {errors.password}
              </div>
            )}
          </div>

          <div className="text-end mb-4">
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          </div>

          <button
            onClick={handleSubmit}
            className="btn auth-submit w-100"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button type="button">Google</button>
            <button type="button">Microsoft</button>
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
