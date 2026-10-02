import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/common/ErrorMessage";

export default function Login({ customerOnly = false, farmerOnly = false }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      if ((customerOnly && user.role !== "customer") || (farmerOnly && user.role !== "farmer")) {
        logout();
        setError(
          customerOnly
            ? "This page is for customer accounts only."
            : "This page is for farmer accounts only."
        );
        return;
      }

      navigate(
        user.role === "farmer"
          ? "/farmer/dashboard"
          : "/customer/rice"
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* LEFT SIDE */}
        <div className="auth-brand-panel">
          <div className="brand-content">

            <div className="brand-icon">🌾</div>

            <h1>Aharam Tho Arogyam</h1>

            <p className="brand-tagline">
              Fresh rice, directly from trusted farmers.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <span>✓</span>
                <p>Direct from farmers</p>
              </div>

              <div className="brand-feature">
                <span>✓</span>
                <p>Quality rice products</p>
              </div>

              <div className="brand-feature">
                <span>✓</span>
                <p>Simple and secure ordering</p>
              </div>
            </div>

          </div>

          <div className="brand-bottom">
            <span>🌱</span>
            Supporting farmers. Delivering quality.
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-panel">

          <div className="auth-form-wrapper">

            <div className="auth-mobile-logo">
              <div className="brand-icon small">🌾</div>
              <span>Aharam Tho Arogyam</span>
            </div>

            <div className="auth-header">
              <h2>{customerOnly ? "Customer Login" : farmerOnly ? "Farmer Login" : "Welcome back"}</h2>

              <p>
                {customerOnly
                  ? "Sign in to browse rice and share your reviews"
                  : farmerOnly
                    ? "Sign in to manage your rice and orders"
                    : "Sign in to continue to your account"}
              </p>
            </div>

            <ErrorMessage message={error} />
 
            <form onSubmit={handleSubmit}>

              {/* EMAIL */}
              <div className="auth-input-group">

                <label htmlFor="email">
                  Email address
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      update("email", e.target.value)
                    }
                    required
                    autoComplete="email"
                  />

                </div>
              </div>

              {/* PASSWORD */}
              <div className="auth-input-group">

                <div className="label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      update(
                        "password",
                        e.target.value
                      )
                    }
                    required
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>

                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            <div className="auth-divider">
              <span>New to Aharam Tho Arogyam?</span>
            </div>

            <Link
              to="/register"
              className="auth-outline-btn"
            >
              Create an account
            </Link>

            <p className="auth-footer">
              By continuing, you agree to our terms and
              privacy policy.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}