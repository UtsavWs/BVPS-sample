import { X, Phone, Mail, Briefcase, Shield, Locate, Home } from "lucide-react";
import { DEFAULT_PROFILE_IMAGE, RoleBadge, StatusPill } from "../ui/RoleBadge";

// ── Member Detail Modal ───────────────────────────────────────────────────────
export const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full overflow-hidden"
        style={{ maxWidth: 400, margin: "auto" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3.5 p-5 border-b border-stone-100"
          style={{ background: "#FEF8F6" }}
        >
          <img
            src={member.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={member.name}
            className="w-16 h-16 rounded-2xl object-cover shrink-0"
            style={{ border: "2px solid #F3F4F6" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              {member.name}
            </p>
            <p className="text-[12.5px] text-gray-600 mt-0.5 truncate">
              {member.company}
            </p>
            {member.badge && (
              <span className="inline-block mt-1.5">
                <RoleBadge label={member.badge} />
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white text-gray-500 hover:bg-stone-100 transition-colors"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Detail Rows ── */}
        <div className="px-5 py-2">
          <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-400">
              <Briefcase size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Profession</span>
            </div>
            <span className="text-[13px] font-medium text-gray-800 text-right max-w-[55%]">
              {member.profession}
            </span>
          </div>

          <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-400">
              <Phone size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Mobile</span>
            </div>
            <a
              href={`tel:${member.mobile}`}
              className="text-[13px] font-medium text-[#C94621] hover:underline"
            >
              {member.mobile}
            </a>
          </div>

          <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-400">
              <Mail size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Email</span>
            </div>
            <a
              href={`mailto:${member.email}`}
              className="text-[13px] font-medium text-blue-600 hover:underline truncate max-w-[55%]"
            >
              {member.email}
            </a>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-400">
              <Locate size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Location</span>
            </div>
            <span className="text-[13px] font-medium text-gray-800 text-right max-w-[55%]">
              {member.contactInformation?.location || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-400">
              <Home size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Native Place</span>
            </div>
            <span className="text-[13px] font-medium text-gray-800 text-right max-w-[55%]">
              {member.contactInformation?.nativePlace || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2 text-stone-400">
              <Shield size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Status</span>
            </div>
            <StatusPill status={member.status} variant="active-inactive" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;
