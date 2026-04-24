import { useState } from "react";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "subadmin", label: "Sub-admin" },
];

export default function AdminEditModal({
  user,
  onClose,
  onSave,
  canManageRole = false,
}) {
  const [email, setEmail] = useState(user.email || "");
  const [mobile, setMobile] = useState(user.mobile || "");
  const [status, setStatus] = useState(user.status || "active");
  const [role, setRole] = useState(user.role || "member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!email.trim() || !mobile.trim()) {
      setError("Email and mobile are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(user.id || user._id, {
        email: email.trim(),
        mobile: mobile.trim(),
        status,
        role,
        previousRole: user.role || "member",
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full overflow-hidden"
        style={{ maxWidth: 420, margin: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-stone-100"
          style={{ background: "#FEF8F6" }}
        >
          <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white text-gray-500 hover:bg-stone-100 transition-colors"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Name (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={user.fullName || ""}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#C94621] focus:ring-2 focus:ring-[#C94621]/10 transition"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Mobile
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#C94621] focus:ring-2 focus:ring-[#C94621]/10 transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${status === opt.value
                      ? opt.value === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-500 border-red-200"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role (admin-only) */}
          {canManageRole && user.role !== "admin" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Role
              </label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${role === opt.value
                        ? "bg-[#FEF8F6] text-[#C94621] border-[#C94621]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#C94621] hover:bg-[#B33D1E]"
              }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
