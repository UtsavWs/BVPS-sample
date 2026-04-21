import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import bpvsLogo from "../../assets/logos/bvps-logo.svg";
import teamIllustration from "../../assets/images/unity.jpg";
import { AuthContext } from "../../context/AuthContext";
import AuthInput from "../../components/forms/AuthInput";

export default function SignUp() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const { register, isAuthenticated, isProcessing } = auth;
  const authLoading = isProcessing;

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (mobile.length !== 10) {
      setError("Mobile number must be at least 10 digits.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        fullName,
        mobile,
        email,
        password,
        confirmPassword,
      });

      if (result.success) {
        sessionStorage.setItem("signup_flow", "true");
        navigate("/verify-otp", { state: { email } });
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  return (
    /* ── MOBILE: full-screen white, flex-col ────────────────────────────────
       ── TABLET/DESKTOP (md+): centered card, unchanged from before ──────── */
    <div className="min-h-screen bg-white md:bg-gray-50 flex items-center justify-center md:p-2">
      {/* Main Container */}
      <div className="w-full md:max-w-275 bg-white md:rounded-3xl md:shadow-xl overflow-hidden flex flex-col md:flex-row md:min-h-0 min-h-screen">
        {/* Left Column: Form */}
        <div className="w-full md:w-1/2 flex flex-col md:justify-center md:p-8 px-6 pt-4 pb-8">
          {/* Back button — mobile only spacing */}
          <div className="mb-2 md:mb-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-500 hover:text-[#C1512D] text-sm font-medium w-fit transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Logo — centred on mobile */}
          <div className="flex justify-center mb-6 mt-4 md:mt-0">
            <img
              src={bpvsLogo}
              alt="BPVS Logo"
              className="h-20 sm:h-24 md:h-20 w-auto object-contain"
            />
          </div>

          {/* Title — centred on mobile, left on desktop */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B3A5C] tracking-tight">
              Sign Up
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Welcome Back!
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSignUp}
            className="flex flex-col gap-5 flex-1 md:flex-none"
          >
            <AuthInput
              label="Full Name"
              type="text"
              value={fullName}
              placeholder="Enter full name"
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <AuthInput
              label="Mobile Number"
              type="tel"
              value={mobile}
              placeholder="Enter mobile no"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setMobile(value);
              }}
              maxLength={10}
              required
            />

            <AuthInput
              label="Email"
              type="email"
              value={email}
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <AuthInput
              label="Password"
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <AuthInput
              label="Password"
              type="password"
              value={confirmPassword}
              placeholder="Enter password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            {/* Spacer: pushes button toward bottom on mobile */}
            <div className="flex-1 md:hidden" />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#C1512D] text-white py-3 rounded-xl font-semibold text-base active:scale-[0.99] transition-all ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Processing..." : "Create Account"}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-700">
              Already have an account?
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#C1512D] font-semibold hover:underline"
              >
                Log In
              </button>
            </p>
          </form>
        </div>

        {/* Right Column: Illustration — hidden on mobile, shown on md+ (unchanged) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden border-l border-gray-100">
          <img
            src={teamIllustration}
            alt="Team Collaboration"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
