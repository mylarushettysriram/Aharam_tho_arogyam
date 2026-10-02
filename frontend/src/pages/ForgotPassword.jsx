import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/common/ErrorMessage";
import authService from "../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const otpInputs = useRef([]);

  useEffect(() => {
    if (!timeLeft) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  async function sendCode(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authService.requestPasswordReset({ email });
      setEmail(response?.data?.email || email);
      setStep("reset");
      setTimeLeft(60);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, password });
      navigate("/login", { state: { message: "Password reset successfully. You can now sign in." } });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  function updateOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = otp.split("");
    nextOtp[index] = digit;
    setOtp(nextOtp.join("").slice(0, 6));
    if (digit && index < 5) otpInputs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    otpInputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand-panel">
          <div className="brand-content">
            <div className="brand-icon">🌾</div>
            <h1>Aharam Tho Arogyam</h1>
            <p className="brand-tagline">Reset your password securely with email verification.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h2>{step === "email" ? "Forgot password?" : "Verify your email"}</h2>
              <p>
                {step === "email"
                  ? "Enter your account email and we will send a verification code."
                  : `Enter the 6-digit code sent to ${email}.`}
              </p>
            </div>

            <ErrorMessage message={error} />

            {step === "email" ? (
              <form onSubmit={sendCode}>
                <div className="auth-input-group">
                  <label htmlFor="reset-email">Email address</label>
                  <input
                    id="reset-email"
                    className="standalone-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword}>
                <div className="auth-input-group">
                  <label htmlFor="reset-otp">Verification code</label>
                  <div className="otp-grid" onPaste={handleOtpPaste}>
                    {Array.from({ length: 6 }, (_, index) => (
                      <input
                        key={index}
                        ref={(input) => { otpInputs.current[index] = input; }}
                        id={index === 0 ? "reset-otp" : undefined}
                        className="otp-cell"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[index] || ""}
                        onChange={(event) => updateOtp(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        aria-label={`Verification code digit ${index + 1}`}
                        disabled={loading || timeLeft === 0}
                      />
                    ))}
                  </div>
                  <p className={timeLeft ? "otp-timer" : "otp-timer expired"}>
                    {timeLeft ? `Code expires in ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}` : "Code expired. Go back and request a new one."}
                  </p>
                </div>
                {otp.length === 6 && timeLeft > 0 && (
                  <>
                    <div className="auth-input-group">
                      <label htmlFor="new-password">New password</label>
                      <input className="standalone-input" id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                    </div>
                    <div className="auth-input-group">
                      <label htmlFor="confirm-password">Confirm new password</label>
                      <input className="standalone-input" id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                    </div>
                    <button className="auth-submit-btn" type="submit" disabled={loading}>
                      {loading ? "Resetting password..." : "Reset password"}
                    </button>
                  </>
                )}
              </form>
            )}

            <Link to="/login" className="auth-outline-btn">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
