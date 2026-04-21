import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bpvsLogo from "/assets/logos/bvps-logo.svg";
import loginIllustration from "/assets/images/Powerful-pana 1.svg";
import { AuthContext } from "../../context/AuthContext";
import AuthInput from "../../components/forms/AuthInput";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const { login, isAuthenticated, isInitializing, isProcessing } = auth;
  const authLoading = isProcessing;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        navigate("/dashboard");
        return;
      }
      if (result.status === "inactive") {
        navigate("/pending-approval");
        return;
      }
      if (
        result.message?.includes("verify") ||
        result.message?.includes("Verify")
      ) {
        navigate("/verify-otp", { state: { email } });
        return;
      }
      setError(result.message || "Login failed.");
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  return (
    /* ── MOBILE: full-screen white bg, flex-col layout ──────────────────────
       ── TABLET/DESKTOP (md+): centered card, unchanged from before ─────── */
    <div className="min-h-screen bg-white md:bg-gray-50 flex items-center justify-center md:p-6 lg:p-8">
      {/* Main Container */}
      <div className="w-full md:max-w-275 bg-white md:rounded-3xl md:shadow-xl overflow-hidden flex flex-col md:flex-row md:min-h-0 min-h-screen">
        {/* Left Column: Form */}
        <div
          className="w-full md:w-1/2 flex flex-col md:justify-center md:p-10 lg:p-12
                        /* mobile layout: full height, space content top-to-bottom */
                        px-6 pt-4 pb-8"
        >
          {/* ── MOBILE top bar: back arrow ── */}
          <div className="md:mb-0 mb-2 mt-4 md:mt-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-500 hover:text-[#C1512D] text-sm font-medium w-fit transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Logo — centred on mobile */}
          <div className="flex justify-center mb-6 md:mb-6 mt-4 md:mt-0">
            <img
              src={bpvsLogo}
              alt="BPVS Logo"
              className="h-20 sm:h-24 md:h-20 w-auto object-contain"
            />
          </div>

          {/* Title Area — centred on mobile */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B3A5C] tracking-tight">
              Log in
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Welcome Back!
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5 flex-1 md:flex-none"
          >
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
              autoComplete="current-password"
              required
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`rounded border flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe
                      ? "bg-[#C1512D] border-[#C1512D]"
                      : "bg-white border-gray-300"
                  }`}
                  style={{ width: "18px", height: "18px", minWidth: "18px" }}
                >
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#C1512D] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

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
              {isLoading ? "Verifying..." : "Login"}
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-700">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-[#C1512D] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>

        {/* Right Column: Illustration — hidden on mobile, shown on md+ (unchanged) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden border-l border-gray-100">
          <img
            src={loginIllustration}
            alt="Login Illustration"
            className="absolute w-full h-full object-cover mix-blend-multiply"
          />
        </div>
      </div>
    </div>
  );
}
