import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import bpvsLogo from "/assets/logos/BPVS Logo.svg";
import { AuthContext } from "../../context/AuthContext";

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  const { verifyOtp, resendOtp, user, isProcessing } = auth;
  const authLoading = isProcessing;

  const email = location.state?.email || "";

  // Security: Check access validation
  useEffect(() => {
    if (authLoading) return;

    // Check if came from signup flow
    const isFromSignup = sessionStorage.getItem("signup_flow") === "true";
    if (!isFromSignup && !email) {
      // Not from signup flow - redirect to signup
      navigate("/signup");
    }
  }, [authLoading, user, email, navigate]);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isError, setIsError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    if (isError) setIsError(false);

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
      inputRefs.current[5].focus();
      if (isError) setIsError(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setIsError(true);
      return;
    }
    try {
      const result = await resendOtp(email);
      if (result.success) {
        setTimeLeft(30);
        setIsError(false);
        setIsExpired(false);
        setOtp(new Array(6).fill(""));
        inputRefs.current[0].focus();
      } else {
        setIsError(true);
      }
    } catch {
      setIsError(true);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) return;

    if (!email) {
      // Fallback if accessed directly without email state
      alert("Email not found. Please sign up or log in again.");
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, enteredOtp);
      if (result.success) {
        sessionStorage.removeItem("signup_flow");
        navigate("/pending-approval");
      } else {
        setIsError(true);
        // Check if OTP is expired
        if (result.message?.toLowerCase().includes("expired")) {
          setIsExpired(true);
        } else {
          setIsExpired(false);
        }
      }
    } catch {
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white md:bg-gray-50 font-sans">
      {/* Card Wrapper */}
      <div className="flex flex-col w-full h-full min-h-screen md:min-h-0 md:h-auto overflow-y-auto md:max-h-[92vh] md:max-w-sm lg:max-w-md bg-white md:rounded-3xl md:shadow-xl px-6 py-4 sm:px-8 sm:py-5 md:px-10 md:py-8">
        {/* Logo */}
        <div className="flex justify-center mt-3 mb-4">
          <img
            src={bpvsLogo}
            alt="BPVS Logo"
            className="h-14 sm:h-16 md:h-20 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3A5C] tracking-tight mb-1.5">
            Enter Code
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            Code has been sent to{" "}
            <span className="text-gray-500 font-semibold">{email}</span>
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleVerify}
          className="flex flex-col flex-1 pb-4 md:pb-0"
        >
          {/* OTP Input Boxes — fluid flex layout, no fixed widths */}
          <div className="flex justify-between items-center w-full gap-1.5 sm:gap-2 md:gap-2.5 mb-4">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoComplete="one-time-code"
                maxLength={1}
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                onPaste={handlePaste}
                className={`
                  flex-1 min-w-0
                  aspect-square
                  max-w-12 sm:max-w-11 md:max-w-13
                  text-center text-lg sm:text-xl font-bold
                  bg-white rounded-[10px] outline-none transition-all
                  focus:border-[#C1512D] focus:ring-2 focus:ring-[#C1512D]/20
                  ${
                    isError
                      ? "border border-[#C1512D] text-[#C1512D]"
                      : "border border-gray-300 text-gray-800"
                  }
                `}
              />
            ))}
          </div>

          {/* Status Message */}
          <div className="text-center h-6 flex items-center justify-center mb-8">
            {isExpired ? (
              <p className="text-gray-500 text-sm font-medium transition-all">
                OTP expired.{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#C1512D] font-bold hover:text-[#A8432A] transition-colors ml-0.5 cursor-pointer"
                >
                  Resend
                </button>
              </p>
            ) : isError ? (
              <p className="text-[#C1512D] text-sm font-medium transition-all">
                Wrong code, please try again
              </p>
            ) : timeLeft > 0 ? (
              <p className="text-gray-500 text-sm font-medium transition-all">
                Send code again{" "}
                <span className="text-[#C1512D] font-bold ml-0.5 whitespace-nowrap">
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-gray-500 text-sm font-medium transition-all">
                I didn't receive a code{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#C1512D] font-bold hover:text-[#A8432A] transition-colors ml-0.5 cursor-pointer"
                >
                  Resend
                </button>
              </p>
            )}
          </div>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden"></div>

          {/* Verify OTP Button */}
          <div className="mt-auto md:mt-0 mb-4 md:mb-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#C1512D] text-white py-3.5 sm:py-4 rounded-xl font-bold text-base hover:bg-[#A8432A] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md shadow-[#C1512D]/30 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 md:pb-2">
            Already have an account?
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#C1512D] font-bold hover:text-[#A8432A] transition-colors"
            >
              Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
