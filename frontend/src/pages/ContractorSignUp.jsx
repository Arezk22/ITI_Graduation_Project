import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapRegisterErrors, register, saveTokens,googleAuth } from "../services/authApi";
import { GoogleLogin } from '@react-oauth/google'


function ContractorSignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
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

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await register({
        first_name: formData.fullName.trim(),
        username: formData.email.trim(),
        company_name: formData.companyName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: "contractor",
      });
      const { access, refresh, first_name, company_name } = response.data;
      saveTokens(access, refresh);
      localStorage.setItem("userRole", "contractor");
      localStorage.setItem("userEmail", formData.email.trim());
      localStorage.setItem("userName", first_name || "User");
      localStorage.setItem("companyName", company_name || "");
      localStorage.setItem("pendingRole", "contractor");
      localStorage.setItem("pendingEmail", formData.email.trim());

      navigate("/contractor/dashboard");
    } catch (error) {
      setErrors(mapRegisterErrors(error));
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
            AI-powered tender evaluation, contractor scoring, and risk analysis
            — all in one place.
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
        {/* تم تحويل الـ div هنا إلى form ودعم حدث onSubmit */}
        <form onSubmit={handleCreateAccount} className="auth-form">
          <Link to="/signup" className="auth-back-link">
            <i className="bi bi-chevron-left"></i> Back
          </Link>

          <h2>Complete your profile</h2>
          <p>Set up your contractor account details</p>

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className={`form-control auth-input ${
                errors.fullName ? "is-invalid" : ""
              }`}
              placeholder="Omar Al-Farsi"
              value={formData.fullName}
              onChange={handleChange}
            />

            {errors.fullName && (
              <div className="invalid-feedback d-block">{errors.fullName}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              name="companyName"
              className={`form-control auth-input ${
                errors.companyName ? "is-invalid" : ""
              }`}
              placeholder="Gulf Construction Group"
              value={formData.companyName}
              onChange={handleChange}
            />

            {errors.companyName && (
              <div className="invalid-feedback d-block">
                {errors.companyName}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className={`form-control auth-input ${
                errors.email ? "is-invalid" : ""
              }`}
              placeholder="omar@gulfconstruction.com"
              value={formData.email}
              onChange={handleChange}
            />

            {errors.email && (
              <div className="invalid-feedback d-block">{errors.email}</div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`form-control auth-input ${
                  errors.password ? "is-invalid" : ""
                }`}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </button>
            </div>

            {errors.password && (
              <div className="invalid-feedback d-block">{errors.password}</div>
            )}
          </div>

          {errors.form && (
            <div className="alert alert-danger py-2 mb-3">{errors.form}</div>
          )}

          {/* تم تعديل الزرار ليصبح type="submit" وحذف الـ onClick منه */}
          <button
            type="submit"
            className="btn auth-submit w-100"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons d-flex justify-content-center align-content-center">
            <GoogleLogin
                          onSuccess={
                            async (credentialResponse) => {
                              try {
                                  const response = await googleAuth(
                                          credentialResponse.credential,"contractor");
                                  saveTokens(
                                            response.data.access,
                                            response.data.refresh
                                        );

                                  localStorage.setItem("userRole", response.data.role || "");
                                  localStorage.setItem("userName", response.data.first_name || "User");
                                  localStorage.setItem("companyName", response.data.company_name || "");
                                  navigate("/contractor/dashboard")
            
                              } catch (err) {
                console.log(err);
                console.log(err.message);
                console.log(err.code);
                console.log(err.config);
            }
                }}
                          size="large"
                          width="250px"
                          theme="filled_blue"   
                          shape="pill"
                          text="signup_with"/>
                      
          </div>

          <p className="signup-text">
            Already registered? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ContractorSignUp;
