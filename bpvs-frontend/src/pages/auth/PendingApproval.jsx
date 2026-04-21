import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FEF8F6] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 max-w-sm w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#FEF8F6] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="#C94621"
              strokeWidth="1.8"
            />
            <path
              d="M12 8V12M12 16H12.01"
              stroke="#C94621"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Pending Approval
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Your account has been verified successfully. An admin will review your
          registration and activate your account shortly.
        </p>

        {/* Info box */}
        <div className="bg-[#FEF8F6] rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-[#C94621] uppercase tracking-wide mb-2">
            What's next?
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-[#C94621] mt-0.5 shrink-0">•</span>
              <span>Complete your profile details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C94621] mt-0.5 shrink-0">•</span>
              <span>Admin will be notified of your registration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C94621] mt-0.5 shrink-0">•</span>
              <span>Once approved, you'll have full access</span>
            </li>
          </ul>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-[#C94621] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#B33D1E] active:scale-[0.98] transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
