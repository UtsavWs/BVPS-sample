import { ArrowLeft } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiPut } from "../../api/api";
import LoadingScreen from "../../components/LoadingScreen";
import AuthInput from "../../components/AuthInput";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError("");
    setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password cannot be the same as your current password.");
      return;
    }

    try {
      setSaving(true);
      const res = await apiPut("/users/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      if (res.success) {
        setSuccess("Password updated successfully.");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message || "Failed to update password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 md:flex md:items-center md:justify-center lg:bg-gray-50 lg:flex lg:items-center lg:justify-center">
      <div
        className="
          relative w-full
          sm:max-w-2xl sm:mx-auto
          md:mx-auto md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:bg-white md:overflow-hidden
          lg:max-w-2xl lg:mx-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:bg-white lg:overflow-hidden
        "
      >
        {/* ── Sticky Header ── */}
        <div className="
          sticky top-0 z-10 bg-white border-b border-gray-100
          flex items-center justify-center
          px-4 py-4
          sm:px-8 sm:py-5
          md:px-10 md:py-6
          lg:px-10 lg:py-6
          md:rounded-t-2xl lg:rounded-t-2xl
        ">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 sm:left-8 lg:left-10 p-1 text-gray-900 hover:text-[#C94621] transition-colors"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-bold text-gray-900 sm:text-lg lg:text-xl">
            Reset Password
          </h1>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleUpdate}
          className="
          px-4 pt-6 pb-10 flex flex-col gap-5
          sm:px-8 sm:pt-7 sm:gap-5
          md:px-10 md:pt-8 md:gap-6
          lg:px-10 lg:pt-8 lg:gap-6
        ">

          {/* ── Current Password + Forgot Password link ── */}
          <div className="flex flex-col gap-1.5">
            <AuthInput
              label="Current Password"
              showRequired
              type="password"
              value={form.currentPassword}
              onChange={set("currentPassword")}
              placeholder="Enter Password"
              autoComplete="current-password"
            />

            {/* Forgot Password — right-aligned below the input, matching Figma */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="
                  text-xs font-semibold text-gray-500
                  hover:text-[#C94621] transition-colors
                  sm:text-sm
                "
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* ── New Password ── */}
          <AuthInput
            label="New Password"
            showRequired
            type="password"
            value={form.newPassword}
            onChange={set("newPassword")}
            placeholder="Enter Password"
            autoComplete="new-password"
          />

          {/* ── Confirm Password ── */}
          <AuthInput
            label="Confirm Password"
            showRequired
            type="password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="Enter Password"
            autoComplete="new-password"
          />

          {/* Error / Success */}
          {error && (
            <p className="text-sm text-red-500 font-medium -mt-1">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 font-medium -mt-1">{success}</p>
          )}

          {/* Update Button */}
          <button
            type="submit"
            disabled={saving}
            className="
              w-full py-4 mt-2 rounded-2xl
              bg-[#C94621] text-white text-sm font-bold
              hover:bg-[#A8432A] active:scale-[0.98]
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              sm:text-base sm:py-4
              lg:text-base lg:py-5
            "
          >
            {saving ? "Updating..." : "Update"}
          </button>

        </form>
      </div>
    </div>
  );
}