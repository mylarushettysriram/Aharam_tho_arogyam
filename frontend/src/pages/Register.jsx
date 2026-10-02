import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/common/ErrorMessage";
import authService from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const otpInputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!otpSent) return undefined;

    setOtpTimeLeft(60);
    const timer = window.setInterval(() => {
      setOtpTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpSent]);

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
      const data = await authService.register(form);
      setOtpEmail(data?.data?.email || form.email);
      setOtpSent(true);

    } catch (err) {
      const message = err?.response?.data?.message;
      setError(
        message ||
        (err?.request
          ? "Unable to reach the server. Start the backend with npm run dev:backend and try again."
          : err?.message || "Unable to create registration request")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.verifyOtp({ email: otpEmail, otp });
      navigate("/login", {
        state: { message: "Email verified. You can now sign in." },
      });
    } catch (err) {
      const message = err?.response?.data?.message;
      setError(message || "Unable to verify OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setLoading(true);

    try {
      const data = await authService.register(form);
      setOtpEmail(data?.data?.email || form.email);
      setOtp("");
      setOtpTimeLeft(60);
    } catch (err) {
      const message = err?.response?.data?.message;
      setError(message || "Unable to resend OTP");
    } finally {
      setLoading(false);
    }
  }

  function updateOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = otp.split("");
    nextOtp[index] = digit;
    const updatedOtp = nextOtp.join("").slice(0, 6);
    setOtp(updatedOtp);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pastedOtp = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pastedOtp);
    otpInputs.current[Math.min(pastedOtp.length, 5)]?.focus();
  }

  if (otpSent) {
    return (
      <div className="auth-page register-page">
        <div className="auth-container otp-container">
          <div className="auth-form-panel register-form-panel">
            <div className="auth-form-wrapper otp-form-wrapper">
              <div className="auth-header">
                <h2>Verify your email</h2>
                <p>Enter the 6-digit OTP sent to {otpEmail}.</p>
                <p className={otpTimeLeft > 0 ? "otp-timer" : "otp-timer expired"}>
                  {otpTimeLeft > 0
                    ? `OTP expires in ${Math.floor(otpTimeLeft / 60)}:${String(
                        otpTimeLeft % 60
                      ).padStart(2, "0")}`
                    : "OTP expired. Click Resend OTP to get a new code."}
                </p>
              </div>

              <ErrorMessage message={error} />

              <form onSubmit={handleVerifyOtp}>
                <div className="auth-input-group">
                  <label htmlFor="registration-otp">Verification OTP</label>
                  <div className="otp-grid" onPaste={handleOtpPaste}>
                    {Array.from({ length: 6 }, (_, index) => (
                      <input
                        key={index}
                        ref={(input) => {
                          otpInputs.current[index] = input;
                        }}
                        id={index === 0 ? "registration-otp" : undefined}
                        className="otp-cell"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[index] || ""}
                        onChange={(event) => updateOtp(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        aria-label={`OTP digit ${index + 1}`}
                        disabled={loading || otpTimeLeft === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || otpTimeLeft === 0 || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify email"}
                </button>
              </form>

              <button
                type="button"
                className="auth-outline-btn"
                onClick={handleResendOtp}
                disabled={loading || otpTimeLeft > 0}
              >
                {loading ? "Sending..." : "Resend OTP"}
              </button>

              <button
                type="button"
                className="auth-outline-btn"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
              >
                Back to registration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page register-page">

      <div className="auth-container register-container">

        {/* LEFT PANEL */}

        <div className="auth-brand-panel register-brand">

          <div className="brand-content">

            <div className="brand-icon">
              🌾
            </div>

            <h1>Join Aharam Tho Arogyam</h1>

            <p className="brand-tagline">
              Buy quality rice or sell directly to
              customers.
            </p>

            <div className="register-benefits">

              <div className="benefit-card">
                <span>🛒</span>
                <div>
                  <strong>For Customers</strong>
                  <p>
                    Discover quality rice from
                    trusted farmers.
                  </p>
                </div>
              </div>

              <div className="benefit-card">
                <span>🚜</span>
                <div>
                  <strong>For Farmers</strong>
                  <p>
                    Reach customers and sell your
                    products directly.
                  </p>
                </div>
              </div>

              <div className="benefit-card">
                <span>🔐</span>
                <div>
                  <strong>Secure Account</strong>
                  <p>
                    Your email is verified using
                    OTP.
                  </p>
                </div>
              </div>

            </div>

          </div>

          <div className="brand-bottom">
            🌱 Connecting farmers and customers
          </div>

        </div>

        {/* FORM PANEL */}

        <div className="auth-form-panel register-form-panel">

          <div className="auth-form-wrapper">

            <div className="auth-mobile-logo">
              <div className="brand-icon small">
                🌾
              </div>

              <span>Aharam Tho Arogyam</span>
            </div>

            <div className="auth-header">

              <h2>Create your account</h2>

              <p>
                Join our marketplace in a few simple
                steps
              </p>

            </div>

            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit}>

              {/* ROLE */}

              <div className="auth-input-group">

                <label>
                  I want to join as
                </label>

                <div className="role-selector">

                  <button
                    type="button"
                    className={
                      form.role === "customer"
                        ? "role-option active"
                        : "role-option"
                    }
                    onClick={() =>
                      update(
                        "role",
                        "customer"
                      )
                    }
                  >
                    <span>🛒</span>

                    <div>
                      <strong>
                        Customer
                      </strong>
                      <small>
                        Buy rice
                      </small>
                    </div>

                    {form.role ===
                      "customer" && (
                        <span className="role-check">
                          ✓
                        </span>
                      )}
                  </button>

                  <button
                    type="button"
                    className={
                      form.role === "farmer"
                        ? "role-option active"
                        : "role-option"
                    }
                    onClick={() =>
                      update(
                        "role",
                        "farmer"
                      )
                    }
                  >
                    <span>🚜</span>

                    <div>
                      <strong>
                        Farmer
                      </strong>
                      <small>
                        Sell rice
                      </small>
                    </div>

                    {form.role ===
                      "farmer" && (
                        <span className="role-check">
                          ✓
                        </span>
                      )}
                  </button>

                </div>
              </div>

              {/* NAME */}

              <div className="auth-input-group">

                <label htmlFor="name">
                  Full name
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) =>
                      update(
                        "name",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>
              </div>

              {/* EMAIL */}

              <div className="auth-input-group">

                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      update(
                        "email",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <small className="input-help">
                  We'll send a verification OTP to
                  this email.
                </small>

              </div>

              {/* PASSWORD */}

              <div className="auth-input-group">

                <label htmlFor="register-password">
                  Password
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) =>
                      update(
                        "password",
                        e.target.value
                      )
                    }
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "🙈"
                      : "👁"}
                  </button>

                </div>

                <small className="input-help">
                  Minimum 6 characters.
                </small>

              </div>

              {/* PHONE */}

              <div className="auth-input-group">

                <label htmlFor="phone">
                  Phone / WhatsApp number
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    📱
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    placeholder="WhatsApp number, e.g. 919876543210"
                    value={form.phone}
                    onChange={(e) =>
                      update(
                        "phone",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <small className="input-help">
                Farmers receive booking details on this WhatsApp number. Include country code.
              </small>

              {/* CITY + STATE */}

              <div className="auth-form-row">

                <div className="auth-input-group">

                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    className="standalone-input"
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      update(
                        "city",
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="auth-input-group">

                  <label htmlFor="state">
                    State
                  </label>

                  <input
                    id="state"
                    className="standalone-input"
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) =>
                      update(
                        "state",
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* ADDRESS */}

              <div className="auth-input-group">

                <label htmlFor="address">
                  Address
                </label>

                <div className="auth-input-wrapper">

                  <span className="input-icon">
                    📍
                  </span>

                  <input
                    id="address"
                    type="text"
                    placeholder="Enter your address"
                    value={form.address}
                    onChange={(e) =>
                      update(
                        "address",
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* PINCODE */}

              <div className="auth-input-group">

                <label htmlFor="pincode">
                  Pincode
                </label>

                <input
                  id="pincode"
                  className="standalone-input"
                  type="text"
                  placeholder="Enter pincode"
                  value={form.pincode}
                  onChange={(e) =>
                    update(
                      "pincode",
                      e.target.value
                    )
                  }
                />

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue with email verification
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link
              to="/login"
              className="auth-outline-btn"
            >
              Sign in
            </Link>

            <p className="auth-footer">
              By creating an account, you agree to our
              terms and privacy policy.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}