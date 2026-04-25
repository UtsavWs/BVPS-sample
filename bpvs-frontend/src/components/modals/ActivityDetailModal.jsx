import { useEffect, useState } from "react";
import { X, Calendar, AlignLeft, Info, FileText, Briefcase, MapPin, Mail, Phone, DollarSign } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const ACTIVITY_ICONS = {
  thankYouGiven: "/assets/logos/thankYouslipG.svg",
  thankYouReceived: "/assets/logos/thankYouSlipR.svg",
  referralGiven: "/assets/logos/referralsG.svg",
  referralReceived: "/assets/logos/refrralsR.svg",
  b2bGiven: "/assets/logos/b2b.svg",
  b2bReceived: "/assets/logos/b2b.svg",
};

const getCompany = (u) =>
  u?.businessInformation?.companyName ||
  u?.businessInformation?.brandName ||
  "—";



export const ActivityDetailModal = ({ log, currentUser, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!log) return null;

  const { logType, rawData } = log;
  const isGiven = log.tab === "Given";

  let givenBy, receivedBy;

  if (logType === "b2b") {
    givenBy = isGiven ? currentUser : rawData.addedBy;
    receivedBy = isGiven ? rawData.memberId : currentUser;
  } else {
    givenBy = isGiven ? currentUser : rawData.givenBy;
    receivedBy = isGiven ? rawData.receivedBy : currentUser;
  }

  // Display user based on Given/Received tab (the counterparty is what we focus on in the header usually, but here we can just show the counterparty in header and detail below)
  const counterparty = isGiven ? receivedBy : givenBy;
  const activityIcon = log.type; // e.g. thankYouGiven

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full overflow-hidden"
        style={{ maxWidth: 450, margin: "auto" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3.5 p-5 border-b border-stone-100"
          style={{ background: "#FEF8F6" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-transparent flex items-center justify-center shrink-0">
            <img
              src={ACTIVITY_ICONS[activityIcon]}
              alt={log.typeLabel}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF0EA] text-[#C94621] border border-[#C94621]/20 uppercase tracking-wider">
                {log.typeLabel}
              </span>
            </div>
            <p className="text-[16px] font-semibold text-gray-900 mt-1 truncate">
              {log.tab} {log.tab === "Given" ? "to" : "from"} {counterparty?.fullName || "Unknown"}
            </p>
            <p className="text-[13px] text-gray-600 truncate">
              {getCompany(counterparty)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white text-gray-500 hover:bg-stone-100 transition-colors"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Detail Rows ── */}
        <div className="px-5 py-2 max-h-[60vh] overflow-y-auto">
          {/* Common Info: Given By & Received By */}
          <div className="py-2.5">
            <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Participants</h4>
            <div className="grid grid-cols-2 gap-4">
              {isGiven ? (
                <>
                  <div>
                    <p className="text-[11px] text-stone-500 mb-0.5">Given By</p>
                    <p className="text-[13px] font-medium text-gray-900">{givenBy?.fullName || "Unknown"}</p>
                    <p className="text-[11.5px] text-gray-500">{getCompany(givenBy)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-500 mb-0.5">Received By</p>
                    <p className="text-[13px] font-medium text-gray-900">{receivedBy?.fullName || "Unknown"}</p>
                    <p className="text-[11.5px] text-gray-500">{getCompany(receivedBy)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] text-stone-500 mb-0.5">Received By</p>
                    <p className="text-[13px] font-medium text-gray-900">{receivedBy?.fullName || "Unknown"}</p>
                    <p className="text-[11.5px] text-gray-500">{getCompany(receivedBy)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-500 mb-0.5">Given By</p>
                    <p className="text-[13px] font-medium text-gray-900">{givenBy?.fullName || "Unknown"}</p>
                    <p className="text-[11.5px] text-gray-500">{getCompany(givenBy)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-stone-100 my-1"></div>

          {/* Type Specific Info */}
          <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mt-3 mb-2">Details</h4>

          {logType === "b2b" && (
            <>
              <DetailRow icon={<Info size={14} />} label="Topic of Conversation" value={rawData.topicOfConversation} />
              <DetailRow icon={<MapPin size={14} />} label="Location" value={rawData.location} />
              <DetailRow icon={<Calendar size={14} />} label="Date" value={formatDate(rawData.createdAt)} />
            </>
          )}

          {logType === "referral" && (
            <>
              <DetailRow icon={<Info size={14} />} label="Reference Type" value={rawData.referenceType} />
              <DetailRow icon={<Phone size={14} />} label="Contact No" value={rawData.contactNo} />
              <DetailRow icon={<Mail size={14} />} label="Email" value={rawData.email} />
              <DetailRow icon={<MapPin size={14} />} label="Address" value={rawData.address} />
              <DetailRow icon={<AlignLeft size={14} />} label="Description" value={rawData.description} />
              <DetailRow icon={<Calendar size={14} />} label="Event Master" value={rawData.eventMaster?.eventName || rawData.eventMaster} />
            </>
          )}

          {logType === "thankyouslip" && (
            <>
              <DetailRow icon={<DollarSign size={14} />} label="Amount" value={`₹${rawData.amount?.toLocaleString() || 0}`} />
              <DetailRow icon={<Briefcase size={14} />} label="Business Type" value={rawData.businessType} />
              <DetailRow icon={<Info size={14} />} label="Reference Type" value={rawData.referenceType} />
              <DetailRow icon={<FileText size={14} />} label="Reference" value={rawData.reference} />
              <DetailRow icon={<AlignLeft size={14} />} label="Remarks" value={rawData.remarks} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-stone-50 last:border-0">
      <div className="flex items-center gap-2 text-stone-400 shrink-0 min-w-0 pr-3 mt-0.5">
        <div className="shrink-0">{icon}</div>
        <span className="text-[12.5px] truncate" title={label}>{label}</span>
      </div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`text-[13px] font-medium text-gray-800 text-left max-w-[50%] sm:max-w-[60%] cursor-pointer select-none transition-all ${isExpanded ? "break-words whitespace-normal" : "truncate"}`}
        title={isExpanded ? "" : "Tap to see more"}
      >
        {value}
      </div>
    </div>
  );
};

export default ActivityDetailModal;
