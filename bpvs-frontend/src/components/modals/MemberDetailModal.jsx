import { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Briefcase,
  Shield,
  Locate,
  Home,
  Building2,
  Tag,
  Hash,
  CalendarDays,
  MapPin,
  Info,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
} from "lucide-react";
import { DEFAULT_PROFILE_IMAGE, RoleBadge, StatusPill } from "../ui/RoleBadge";
import { formatDate } from "../../utils/dateUtils";

const extOf = (name = "") => name.split(".").pop()?.toLowerCase() || "";

const DocIcon = ({ ext }) => {
  if (ext === "pdf") return <FileText size={15} className="text-red-500 shrink-0" />;
  if (ext === "xls" || ext === "xlsx") return <FileSpreadsheet size={15} className="text-green-600 shrink-0" />;
  if (ext === "doc" || ext === "docx") return <FileText size={15} className="text-blue-600 shrink-0" />;
  return <FileIcon size={15} className="text-gray-500 shrink-0" />;
};

const formatAddress = (addr) => {
  if (!addr) return "";
  return [addr.line, addr.area, addr.city, addr.state, addr.pincode]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
};

// Click-to-preview image thumbnail
const Thumb = ({ src, className, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative group rounded-lg overflow-hidden border border-stone-200 cursor-pointer ${className}`}
  >
    <img src={src} alt="business" className="w-full h-full object-cover" />
    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
  </button>
);

// One label/value row
const Row = ({ icon, label, value, href, hrefColor = "text-gray-800" }) => {
  if (!value) return null;
  const Icon = icon;
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100">
      <div className="flex items-center gap-2 text-stone-400 shrink-0">
        <Icon size={14} strokeWidth={1.8} />
        <span className="text-[12.5px]">{label}</span>
      </div>
      {href ? (
        <a href={href} className={`text-[13px] font-medium ${hrefColor} hover:underline truncate max-w-[58%]`}>
          {value}
        </a>
      ) : (
        <span className="text-[13px] font-medium text-gray-800 text-right max-w-[58%]">{value}</span>
      )}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mt-4 mb-1.5">
    {children}
  </h4>
);

// ── Member Detail Modal ───────────────────────────────────────────────────────
export const MemberDetailModal = ({ member, onClose }) => {
  const [preview, setPreview] = useState(null);
  if (!member) return null;

  const biz = member.businessInformation || {};
  const address = formatAddress(biz.businessAddress);
  const images = biz.businessImages || [];
  const docs = biz.documents || [];
  const hasCard = biz.visitingCardFront || biz.visitingCardBack;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
        style={{ maxWidth: 420, margin: "auto" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3.5 p-5 border-b border-stone-100 shrink-0"
          style={{ background: "#FEF8F6" }}
        >
          <img
            src={member.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={member.name}
            className="w-16 h-16 rounded-2xl object-cover shrink-0"
            style={{ border: "2px solid #F3F4F6" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">{member.name}</p>
            <p className="text-[12.5px] text-gray-600 mt-0.5 truncate">{member.company}</p>
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

        {/* ── Scrollable body ── */}
        <div className="px-5 py-1 overflow-y-auto">
          {/* Contact */}
          <Row icon={Briefcase} label="Profession" value={member.profession} />
          <Row icon={Phone} label="Mobile" value={member.mobile} href={`tel:${member.mobile}`} hrefColor="text-[#C94621]" />
          <Row icon={Mail} label="Email" value={member.email} href={`mailto:${member.email}`} hrefColor="text-blue-600" />
          <Row icon={Locate} label="Location" value={member.contactInformation?.location} />
          <Row icon={Home} label="Native Place" value={member.contactInformation?.nativePlace} />

          {/* Business details */}
          {(biz.companyName || biz.brandName || biz.category || biz.gstNo || biz.dateOfJoin || address) && (
            <>
              <SectionTitle>Business Details</SectionTitle>
              <Row icon={Building2} label="Company" value={biz.companyName} />
              <Row icon={Tag} label="Brand" value={biz.brandName} />
              <Row icon={Tag} label="Category" value={biz.category} />
              <Row icon={Hash} label="GST No" value={biz.gstNo} />
              <Row
                icon={CalendarDays}
                label="Date of Join"
                value={biz.dateOfJoin ? formatDate(biz.dateOfJoin) : ""}
              />
              <Row icon={MapPin} label="Address" value={address} />
            </>
          )}

          {/* About */}
          {biz.aboutBusiness && (
            <div className="py-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-400 mb-1.5">
                <Info size={14} strokeWidth={1.8} />
                <span className="text-[12.5px]">About Business</span>
              </div>
              <p className="text-[12.5px] text-gray-700 leading-relaxed">{biz.aboutBusiness}</p>
            </div>
          )}

          {/* Business images */}
          {images.length > 0 && (
            <div className="py-3 border-b border-stone-100">
              <SectionTitle>Business Images ({images.length})</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                {images.map((src, i) => (
                  <Thumb key={i} src={src} className="aspect-square" onClick={() => setPreview(src)} />
                ))}
              </div>
            </div>
          )}

          {/* Visiting card */}
          {hasCard && (
            <div className="py-3 border-b border-stone-100">
              <SectionTitle>Visiting Card</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {biz.visitingCardFront && (
                  <div>
                    <p className="text-[10.5px] text-stone-400 mb-1">Front</p>
                    <Thumb src={biz.visitingCardFront} className="h-24 w-full flex" onClick={() => setPreview(biz.visitingCardFront)} />
                  </div>
                )}
                {biz.visitingCardBack && (
                  <div>
                    <p className="text-[10.5px] text-stone-400 mb-1">Back</p>
                    <Thumb src={biz.visitingCardBack} className="h-24 w-full flex" onClick={() => setPreview(biz.visitingCardBack)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <div className="py-3 border-b border-stone-100 last:border-0">
              <SectionTitle>Documents ({docs.length})</SectionTitle>
              <ul className="flex flex-col gap-1.5">
                {docs.map((d, i) => (
                  <li key={i}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-100 transition min-w-0"
                    >
                      <DocIcon ext={extOf(d.name)} />
                      <span className="text-[12.5px] text-gray-700 truncate">{d.name || "Document"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2 text-stone-400">
              <Shield size={14} strokeWidth={1.8} />
              <span className="text-[12.5px]">Status</span>
            </div>
            <StatusPill status={member.status} variant="active-inactive" />
          </div>
        </div>
      </div>

      {/* ── Image lightbox ── */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none"
          >
            <X size={20} />
          </button>
          <img
            src={preview}
            alt="preview"
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MemberDetailModal;
