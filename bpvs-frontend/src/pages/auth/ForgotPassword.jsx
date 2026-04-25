import { ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bpvsLogo from "../../assets/logos/bvps-logo.svg";
import securityIllustration from "../../assets/images/Team spirit-pana-1.svg";
import { apiPost } from "../../api/api";
import AuthInput from "../../components/forms/AuthInput";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);

  const handleConfirm = async () => {
    setError("");
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiPost("/auth/forgot-password", { email });
      if (!res.success) {
        setError(res.message || "Failed to send OTP.");
        return;
      }
      setStep("otp");
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (error) setError("");
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        const next = [...otp];
        next[idx - 1] = "";
        setOtp(next);
        otpRefs.current[idx - 1]?.focus();
      } else if (otp[idx]) {
        const next = [...otp];
        next[idx] = "";
        setOtp(next);
      }
    } else if (e.key === "ArrowLeft" && idx > 0)
      otpRefs.current[idx - 1]?.focus();
    else if (e.key === "ArrowRight" && idx < 5)
      otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text/plain").trim();
    if (!/^\d{6}$/.test(paste)) return;
    setOtp(paste.split(""));
    otpRefs.current[5]?.focus();
    if (error) setError("");
  };

  const handleOtpSubmit = async () => {
    setError("");
    if (otp.join("").length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiPost("/auth/verify-forgot-password-otp", {
        email,
        otp: otp.join(""),
      });
      if (!res.success) {
        setError(res.message || "Invalid OTP. Please try again.");
        return;
      }
      setStep("password");
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setError("");
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiPost("/auth/reset-password", {
        email,
        otp: otp.join(""),
        newPassword: password,
        confirmPassword,
      });
      if (!res.success) {
        setError(res.message || "Failed to reset password.");
        return;
      }
      setStep("confirm");
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setOtp(Array(6).fill(""));
    try {
      const res = await apiPost("/auth/forgot-password", { email });
      if (!res.success) {
        setError(res.message || "Failed to resend OTP.");
        return;
      }
      setCountdown(30);
      otpRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  const otpFilled = otp.join("").length === 6;

  const ProgressDots = ({ current }) => (
    <div className="flex items-center justify-center gap-1.5 mt-7">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${i < current
              ? "w-2 bg-[#C1512D]"
              : i === current
                ? "w-6 bg-[#C1512D]"
                : "w-2 bg-gray-200"
            }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex items-center justify-center md:p-6 lg:p-8">
      <div className="w-full md:max-w-275 bg-white md:rounded-3xl md:shadow-xl overflow-hidden flex flex-col md:flex-row md:min-h-0 min-h-screen">
        {/* ── Left: Form ── */}
        <div className="w-full md:w-1/2 px-6 pt-4 pb-8 md:p-10 lg:p-12 flex flex-col md:justify-center">
          {/* Back button */}
          <div className="md:mb-0 mb-2">
            <button
              type="button"
              onClick={() =>
                step === "email"
                  ? navigate(-1)
                  : step === "otp"
                    ? setStep("email")
                    : setStep("otp")
              }
              className="flex items-center gap-1 text-gray-500 hover:text-[#C1512D] text-sm font-medium w-fit transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Logo — centered on mobile, left on sm+ */}
          <div className="flex justify-center mb-6">
            <img
              src={bpvsLogo}
              alt="BPVS Logo"
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
            />
          </div>

          {/* ══ STEP 1: EMAIL ══ */}
          {step === "email" && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold sm:font-extrabold text-[#1B3A5C] tracking-tight">
                  Forgot Password
                </h1>
                <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base">
                  Enter your registered email and we'll send you a verification
                  code.
                </p>
              </div>
              <div className="flex flex-col gap-5">
                <AuthInput
                  label="Email"
                  type="email"
                  value={email}
                  placeholder="Enter Email"
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
                {error && (
                  <p className="text-red-500 text-sm font-medium -mt-2">
                    {error}
                  </p>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={loading || !isValidEmail}
                  className="w-full bg-[#C1512D] text-white py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#a8431f] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </div>
              <p className="text-center text-xs sm:text-sm text-gray-600 mt-5">
                Remember your password?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#C1512D] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
              <ProgressDots current={0} />
            </>
          )}

          {/* ══ STEP 2: OTP ══ */}
          {step === "otp" && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl sm:text-xl md:text-3xl font-bold sm:font-extrabold text-[#1B3A5C] text-center tracking-tight">
                  Verify Email
                </h1>
                <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base text-center">
                  We've sent a verification code to{" "}
                  <span className="font-semibold text-[#1B3A5C]">{email}</span>
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div
                  className="flex justify-between items-center w-full gap-1.5 sm:gap-2 md:gap-2.5 mb-4"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onFocus={(e) => e.target.select()}
                      className={`
                        flex-1 min-w-0
                        aspect-square
                        max-w-12 sm:max-w-11 md:max-w-13
                        text-center text-lg sm:text-xl font-bold
                        bg-white rounded-[10px] outline-none transition-all
                        focus:border-[#C1512D] focus:ring-2 focus:ring-[#C1512D]/20
                        ${error
                          ? "border border-[#C1512D] text-[#C1512D]"
                          : "border border-gray-300 text-gray-800"
                        }
                      `}
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-red-500 text-sm font-medium -mt-2">
                    {error}
                  </p>
                )}
                <button
                  onClick={handleOtpSubmit}
                  disabled={loading || !otpFilled}
                  className="w-full bg-[#C1512D] text-white py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#a8431f] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
                <div className="text-center text-xs sm:text-sm text-gray-500">
                  {countdown > 0 ? (
                    <span>
                      Resend code in{" "}
                      <span className="text-[#C1512D] font-semibold">
                        {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                        {String(countdown % 60).padStart(2, "0")}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Didn't receive a code?{" "}
                      <button
                        onClick={handleResend}
                        className="text-[#C1512D] font-semibold hover:underline"
                      >
                        Resend
                      </button>
                    </span>
                  )}
                </div>
                <ProgressDots current={1} />
              </div>
            </>
          )}

          {/* ══ STEP 3: PASSWORD ══ */}
          {step === "password" && (
            <>
              <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold sm:font-extrabold text-[#1B3A5C] tracking-tight">
                  Set New Password
                </h1>
                <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base">
                  Create a strong and secure password to protect your account.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <AuthInput
                  label="New Password"
                  type="password"
                  value={password}
                  placeholder="Enter New Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <AuthInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  placeholder="Confirm New Password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
                {error && (
                  <p className="text-red-500 text-sm font-medium -mt-2">
                    {error}
                  </p>
                )}
                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading || !password || !confirmPassword}
                  className="w-full bg-[#C1512D] text-white py-3 mt-1 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#a8431f] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <ProgressDots current={2} />
              </div>
            </>
          )}

          {/* ══ STEP 4: SUCCESS ══ */}
          {step === "confirm" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold sm:font-extrabold text-[#1B3A5C] mb-2">
                Password Reset!
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mb-7 sm:mb-8 leading-relaxed">
                Your password has been successfully updated. You can now log in
                with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-[#C1512D] text-white py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#a8431f] active:scale-[0.99] transition-all"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Illustration ── */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden border-l border-gray-100">
          <img
            src={securityIllustration}
            alt="Security Illustration"
            className="absolute w-full h-full object-cover mix-blend-multiply"
          />
        </div>
      </div>
    </div>
  );
}
