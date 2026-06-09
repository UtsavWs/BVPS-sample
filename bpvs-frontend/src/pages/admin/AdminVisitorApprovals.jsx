import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  UserPlus,
  Check,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import LoadingScreen from "../../components/ui/LoadingScreen";
import DesktopPagination from "../../components/ui/DesktopPagination";
import { AuthContext } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmProvider";
import { apiGet, apiPost } from "../../api/api";
import { formatDate } from "../../utils/dateUtils";

const ITEMS_PER_PAGE = 20;
const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";

const STATUS_TABS = [
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    color: "#C94621",
    bg: "#FEF8F6",
    countKey: "pending",
  },
  {
    key: "approved",
    label: "Approved",
    icon: ShieldCheck,
    color: "#16a34a",
    bg: "#f0fdf4",
    countKey: "approved",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "#dc2626",
    bg: "#fef2f2",
    countKey: "rejected",
  },
];

const StatusBadge = ({ status }) => {
  const style =
    status === "approved"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "rejected"
        ? "bg-red-50 text-red-600 border-red-200"
        : "bg-[#FEF8F6] text-[#C94621] border-[#C94621]/30";
  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : "Pending";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${style}`}
    >
      {label}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer text-left w-full ${
      active
        ? "border-[#C94621] bg-[#FEF8F6] shadow-sm"
        : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm"
    }`}
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      <Icon size={16} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-stone-400 leading-none mb-1 truncate">
        {label}
      </p>
      <p className="text-[18px] font-bold text-gray-900 leading-none">
        {value ?? "—"}
      </p>
    </div>
  </button>
);

const EmptyState = ({ status, searchQuery, onClearSearch }) => {
  const message = searchQuery
    ? "No results match your search"
    : status === "pending"
      ? "No pending visitor requests"
      : status === "approved"
        ? "No approved visitors yet"
        : "No rejected visitors";
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
        <UserPlus size={20} className="text-stone-400" />
      </div>
      <p className="text-stone-400 text-sm">{message}</p>
      {searchQuery && (
        <button
          onClick={onClearSearch}
          className="text-[13px] text-[#C94621] hover:underline cursor-pointer border-none bg-transparent"
        >
          Clear search
        </button>
      )}
    </div>
  );
};

const VisitorRow = ({ v, onApprove, onReject, actionLoading }) => {
  const requester = v.addedBy || {};
  const isPending = v.status === "pending";
  return (
    <tr className="border-b border-stone-100 hover:bg-[#FEF8F6] transition-colors align-top">
      <td className="py-3 pl-4 pr-2 w-12 shrink-0">
        <img
          src={requester.profileImage || DEFAULT_PROFILE_IMAGE}
          alt={requester.fullName || "Requester"}
          className="w-9 h-9 rounded-xl object-cover block"
          style={{ border: "1px solid #F3F4F6" }}
        />
      </td>
      <td className="py-3 px-3 max-w-0 w-[20%]">
        <p className="text-[13px] font-semibold text-gray-900 truncate">
          {requester.fullName || "—"}
        </p>
        <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
          {requester.email || requester.mobile || ""}
        </p>
      </td>
      <td className="py-3 px-3 max-w-0 w-[20%]">
        <p className="text-[13px] font-semibold text-gray-900 truncate">
          {`${v.firstName} ${v.lastName}`}
        </p>
        <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
          {v.profession} · {v.specialty}
        </p>
      </td>
      <td className="py-3 px-3 text-[12.5px] text-gray-600 max-w-0 w-[18%] truncate">
        {v.companyName}
      </td>
      <td className="py-3 px-3 text-[12.5px] text-gray-600 whitespace-nowrap w-[14%]">
        <div className="flex flex-col">
          <span>{v.contactNumber}</span>
          <span className="text-stone-400 text-[11.5px] truncate">
            {v.email}
          </span>
        </div>
      </td>
      <td className="py-3 px-3 w-[10%]">
        <StatusBadge status={v.status} />
        {v.activityDate && (
          <p className="text-[10.5px] text-stone-400 mt-1">
            Visit: {formatDate(v.activityDate)}
          </p>
        )}
        <p className="text-[10.5px] text-stone-400">
          Added: {formatDate(v.createdAt)}
        </p>
      </td>
      <td className="py-3 px-3">
        {isPending ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onApprove(v._id)}
              disabled={actionLoading === v._id}
              title="Approve"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 cursor-pointer border-none"
            >
              <Check size={13} strokeWidth={2.5} />
              <span className="hidden md:inline">Approve</span>
            </button>
            <button
              onClick={() => onReject(v._id)}
              disabled={actionLoading === v._id}
              title="Reject"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer bg-white"
            >
              <X size={13} strokeWidth={2.5} />
              <span className="hidden md:inline">Reject</span>
            </button>
          </div>
        ) : (
          <span className="text-[11.5px] text-stone-400 whitespace-nowrap">
            {v.reviewedAt ? `Reviewed ${formatDate(v.reviewedAt)}` : "—"}
          </span>
        )}
      </td>
    </tr>
  );
};

export default function AdminVisitorApprovals() {
  const navigate = useNavigate();
  const { user, loading, isStaff } = useContext(AuthContext);
  const confirm = useConfirm();

  const [activeStatus, setActiveStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [visitors, setVisitors] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [totalItems, setTotalItems] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) navigate("/dashboard");
  }, [loading, user, isStaff, navigate]);

  const fetchVisitors = useCallback(async () => {
    setFetching(true);
    const res = await apiGet(
      `/visitors/admin?status=${activeStatus}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
    );
    if (res.success) {
      setVisitors(res.data.visitors || []);
      setCounts(res.data.counts || { pending: 0, approved: 0, rejected: 0 });
      setTotalItems(res.data.pagination?.total || 0);
    }
    setFetching(false);
  }, [activeStatus, currentPage]);

  useEffect(() => {
    if (isStaff) fetchVisitors();
  }, [isStaff, fetchVisitors]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleTabChange = (status) => {
    setActiveStatus(status);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    const res = await apiPost(`/visitors/${id}/approve`, {});
    if (res.success) {
      showFeedback("success", "Visitor approved.");
      fetchVisitors();
    } else {
      showFeedback("error", res.message || "Failed to approve.");
    }
    setActionLoading(null);
  };

  const handleReject = async (id) => {
    const ok = await confirm({
      title: "Reject visitor?",
      message: "This visitor request will be marked as rejected.",
      confirmText: "Reject",
      variant: "danger",
    });
    if (!ok) return;
    setActionLoading(id);
    const res = await apiPost(`/visitors/${id}/reject`, {});
    if (res.success) {
      showFeedback("success", "Visitor rejected.");
      fetchVisitors();
    } else {
      showFeedback("error", res.message || "Failed to reject.");
    }
    setActionLoading(null);
  };

  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase();
    return visitors.filter((v) => {
      const full = `${v.firstName} ${v.lastName}`.toLowerCase();
      return (
        full.includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.contactNumber?.includes(q) ||
        v.companyName?.toLowerCase().includes(q) ||
        v.addedBy?.fullName?.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, visitors]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    [totalItems],
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  if (loading || !isStaff) return <LoadingScreen />;

  return (
    <div className="h-screen flex flex-col bg-[#F9EDE8] overflow-hidden">
      <div className="shrink-0 bg-white border-b border-stone-100 px-4 sm:px-6 py-4 flex items-center gap-4 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1 text-gray-800 hover:text-[#C94621] transition-colors"
        >
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Visitor Approvals</h1>
      </div>

      {feedback && (
        <div
          className={`mx-auto mt-3 px-4 py-2 rounded-lg text-[13px] font-medium shadow-sm border ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 max-w-412.5 w-full mx-auto px-4 sm:px-6 py-5 gap-4">
        <div className="shrink-0 grid grid-cols-3 gap-3">
          {STATUS_TABS.map(({ key, label, icon, color, bg, countKey }) => (
            <StatCard
              key={key}
              label={label}
              value={counts[countKey]}
              icon={icon}
              color={color}
              bg={bg}
              active={activeStatus === key}
              onClick={() => handleTabChange(key)}
            />
          ))}
        </div>

        <div className="flex flex-col flex-1 bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm min-h-0">
          <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-stone-100">
            <div className="flex flex-col gap-2.5 sm:hidden">
              <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-full">
                {STATUS_TABS.map(({ key, label, countKey }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer border-none ${
                      activeStatus === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-stone-500 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    {label}
                    <span
                      className={`text-[11px] font-semibold ${
                        activeStatus === key ? "text-[#C94621]" : "text-stone-400"
                      }`}
                    >
                      {counts[countKey] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search visitor or requester..."
                  className="pl-8 pr-8 py-2 text-[13px] w-full rounded-lg border border-stone-200 bg-stone-50 text-gray-800 placeholder-stone-400 outline-none focus:border-[#C94621] focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 flex-wrap">
                {STATUS_TABS.map(({ key, label, countKey }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer border-none ${
                      activeStatus === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-stone-500 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    {label}
                    <span
                      className={`ml-1.5 text-[11px] font-semibold ${
                        activeStatus === key ? "text-[#C94621]" : "text-stone-400"
                      }`}
                    >
                      {counts[countKey] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search visitor or requester..."
                  className="pl-8 pr-8 py-1.75 text-[13px] w-72 rounded-lg border border-stone-200 bg-stone-50 text-gray-800 placeholder-stone-400 outline-none focus:border-[#C94621] focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {fetching ? (
              <div className="flex items-center justify-center h-full py-16">
                <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
              </div>
            ) : filteredVisitors.length === 0 ? (
              <EmptyState
                status={activeStatus}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery("")}
              />
            ) : (
              <table
                className="w-full border-collapse"
                style={{ minWidth: "880px" }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="py-3 pl-4 pr-2 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-12">
                      Photo
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[20%]">
                      Requested By
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[20%]">
                      Visitor
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[18%]">
                      Company
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[14%]">
                      Contact
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[10%]">
                      Status
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((v) => (
                    <VisitorRow
                      key={v._id}
                      v={v}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <DesktopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={ITEMS_PER_PAGE}
            label="visitors"
          />
        </div>
      </div>
    </div>
  );
}
