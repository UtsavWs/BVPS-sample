import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../components/ui/LoadingScreen";
import {
  ArrowLeft,
  Trash2,
  Search,
  X,
  Users,
  UserCheck,
  Clock,
  UserX,
  Pencil,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPatch, apiDelete, apiPost } from "../../api/api";
import AdminEditModal from "../../components/modals/AdminEditModal";
import DesktopPagination from "../../components/ui/DesktopPagination";
import { StatusPill } from "../../components/ui/RoleBadge";

const ITEMS_PER_PAGE = 10;
const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  {
    key: "all",
    label: "All Members",
    icon: Users,
    color: "#C94621",
    bg: "#FEF8F6",
    statKey: "total",
  },
  {
    key: "active",
    label: "Active",
    icon: UserCheck,
    color: "#16a34a",
    bg: "#f0fdf4",
    statKey: "active",
  },
  {
    key: "inactive",
    label: "Inactive",
    icon: UserX,
    color: "#dc2626",
    bg: "#fef2f2",
    statKey: "inactive",
  },
  {
    key: "pending",
    label: "Pending Approval",
    icon: Clock,
    color: "#d97706",
    bg: "#fffbeb",
    statKey: "pending",
  },
];

// ── Member Table Row ──────────────────────────────────────────────────────────
const MemberRow = ({ u, onEdit, onDelete, actionLoading }) => (
  <tr className="border-b border-stone-100 hover:bg-[#FEF8F6] transition-colors">
    <td className="py-2.5 pl-4 pr-2 w-12 shrink-0">
      <img
        src={u.profileImage || DEFAULT_PROFILE_IMAGE}
        alt={u.fullName}
        className="w-9 h-9 rounded-xl object-cover block"
        style={{ border: "1px solid #F3F4F6" }}
      />
    </td>
    <td className="py-2.5 px-3 max-w-0 w-[22%]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">
          {u.fullName}
        </p>
        {u.role === "subadmin" && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF8F6] text-[#C94621] border border-[#C94621]/30 w-fit">
            Sub-admin
          </span>
        )}
      </div>
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-500 max-w-0 w-[26%] truncate">
      {u.email}
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-500 whitespace-nowrap w-[16%]">
      {u.mobile}
    </td>
    <td className="py-2.5 px-3 w-[12%]">
      <StatusPill
        status={u.status}
        isApproved={u.isApproved}
        variant="active-inactive"
      />
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-500 whitespace-nowrap w-[13%]">
      {u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "—"}
    </td>
    <td className="py-2.5 px-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(u)}
          title="Edit"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition text-gray-400 hover:text-gray-700"
        >
          <Pencil className="text-gray-700" size={14} strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(u._id)}
          disabled={actionLoading === u._id}
          title="Delete"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition text-red-500 disabled:opacity-50"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </td>
  </tr>
);

// ── Pending Approval Row ──────────────────────────────────────────────────────
const PendingRow = ({ u, onApprove, onReject, actionLoading }) => (
  <tr className="border-b border-stone-100 hover:bg-amber-50/40 transition-colors">
    <td className="py-3 pl-4 pr-3 w-[22%]">
      <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">
        {u.fullName}
      </span>
    </td>
    <td className="py-3 px-3 text-[13px] text-gray-500 max-w-0 w-[28%] truncate">
      {u.email}
    </td>
    <td className="py-3 px-3 text-[13px] text-gray-500 whitespace-nowrap w-[18%]">
      {u.mobile}
    </td>
    <td className="py-3 px-3 w-[14%]">
      <StatusPill
        status={u.status}
        isApproved={u.isApproved}
        variant="approval"
      />
    </td>
    <td className="py-3 px-3 whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onApprove(u._id)}
          disabled={actionLoading === u._id}
          title="Approve"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50 border-none cursor-pointer whitespace-nowrap"
        >
          <UserCheck size={13} strokeWidth={2} />
          <span>Approve</span>
        </button>
        <button
          onClick={() => onReject(u._id)}
          disabled={actionLoading === u._id}
          title="Reject"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 border-none cursor-pointer whitespace-nowrap"
        >
          <X size={13} strokeWidth={2} />
          <span>Reject</span>
        </button>
      </div>
    </td>
  </tr>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bg, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer text-left w-full ${active
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

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ tab, searchQuery, onClearSearch }) => (
  <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
      {tab === "pending" ? (
        <Clock size={20} className="text-stone-400" />
      ) : (
        <Users size={20} className="text-stone-400" />
      )}
    </div>
    <p className="text-stone-400 text-sm">
      {searchQuery
        ? "No results match your search"
        : tab === "pending"
          ? "No pending approval requests"
          : "No members found"}
    </p>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminManageMembers() {
  const navigate = useNavigate();
  const { user, loading, isStaff } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });
  const [fetching, setFetching] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isStaff)) navigate("/dashboard");
  }, [loading, user, isStaff, navigate]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const refreshStats = async () => {
    const r = await apiGet("/admin/stats");
    if (r.success) setStats(r.data);
  };

  useEffect(() => {
    if (isStaff) refreshStats();
  }, [isStaff]);

  // ── Fetch users ───────────────────────────────────────────────────────────
  // The backend handles tab-based filtering:
  const fetchUsers = async () => {
    setFetching(true);
    const res = await apiGet(
      `/admin/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}&tab=${activeTab}`,
    );
    if (res.success) {
      setUsers(res.data.users);
      setTotalItems(res.data.pagination.total);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (isStaff) fetchUsers();
  }, [isStaff, currentPage, activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    setActionLoading(userId);
    const res = await apiDelete(`/admin/users/${userId}`);
    if (res.success) {
      fetchUsers();
      refreshStats();
    }
    setActionLoading(null);
  };

  const handleSaveEdit = async (userId, updates) => {
    const { role: newRole, previousRole, ...patch } = updates;

    if (newRole && newRole !== previousRole) {
      const endpoint =
        newRole === "subadmin"
          ? `/admin/users/${userId}/promote`
          : `/admin/users/${userId}/demote`;
      const roleRes = await apiPost(endpoint, {});
      if (!roleRes.success) throw new Error(roleRes.message);
    }

    const res = await apiPatch(`/admin/users/${userId}`, patch);
    if (!res.success) throw new Error(res.message);
    fetchUsers();
    refreshStats();
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    const res = await apiPost(`/admin/users/${userId}/approve`, {});
    if (res.success) {
      fetchUsers();
      refreshStats();
    }
    setActionLoading(null);
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    setActionLoading(userId);
    const res = await apiPost(`/admin/users/${userId}/reject`, {});
    if (res.success) {
      fetchUsers();
      refreshStats();
    }
    setActionLoading(null);
  };

  // ── Client-side search filter ─────────────────────────────────────────────
  // Status filtering is handled server-side via the tab param.
  // Only search is applied client-side on the current page of results.
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q),
    );
  }, [searchQuery, users]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    [totalItems],
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const isPendingTab = activeTab === "pending";

  if (loading || !isStaff) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F9EDE8] overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 bg-white border-b border-stone-100 px-4 sm:px-6 py-4 flex items-center gap-4 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1 text-gray-800 hover:text-[#C94621] transition-colors"
        >
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Manage Members</h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col min-h-0 max-w-412.5 w-full mx-auto px-4 sm:px-6 py-5 gap-4">
        {/* ── Stat Cards ── */}
        <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TABS.map(({ key, label, icon, color, bg, statKey }) => (
            <StatCard
              key={key}
              label={label}
              value={stats[statKey]}
              icon={icon}
              color={color}
              bg={bg}
              active={activeTab === key}
              onClick={() => handleTabChange(key)}
            />
          ))}
        </div>

        {/* ── Main Card ── */}
        <div className="flex flex-col flex-1 bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm min-h-0">
          {/* ── Toolbar ── */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-stone-100 gap-3 flex-wrap">
            {/* Tab pills */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 flex-wrap">
              {TABS.map(({ key, label, statKey }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer border-none ${activeTab === key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-stone-500 hover:text-gray-700 bg-transparent"
                    }`}
                >
                  {label}
                  <span
                    className={`ml-1.5 text-[11px] font-semibold ${activeTab === key ? "text-[#C94621]" : "text-stone-400"}`}
                  >
                    {stats[statKey] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
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
                placeholder={
                  isPendingTab ? "Search requests..." : "Search members..."
                }
                className="pl-8 pr-8 py-1.75 text-[13px] w-full sm:w-52 rounded-lg border border-stone-200 bg-stone-50 text-gray-800 placeholder-stone-400 outline-none focus:border-[#C94621] focus:bg-white transition-colors"
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

          {/* ── Single scrollable container with sticky thead ── */}
          <div className="flex-1 overflow-auto min-h-0">
            {fetching ? (
              <div className="flex items-center justify-center h-full py-16">
                <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                tab={activeTab}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery("")}
              />
            ) : isPendingTab ? (
              <table
                className="w-full border-collapse"
                style={{ minWidth: "560px" }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="py-3 pl-4 pr-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[22%]">
                      Member
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[28%]">
                      Email
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[18%]">
                      Mobile
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[14%]">
                      Status
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <PendingRow
                      key={u._id}
                      u={u}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <table
                className="w-full border-collapse"
                style={{ minWidth: "640px" }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="py-3 pl-4 pr-2 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-12">
                      Photo
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[22%]">
                      Member
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[26%]">
                      Email
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[16%]">
                      Mobile
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[12%]">
                      Status
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide w-[13%] whitespace-nowrap">
                      Joined On
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <MemberRow
                      key={u._id}
                      u={u}
                      onEdit={setEditingUser}
                      onDelete={handleDelete}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ── */}
          <DesktopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={totalItems}
            startIndex={startIndex}
            itemsPerPage={ITEMS_PER_PAGE}
            label={isPendingTab ? "requests" : "members"}
          />
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingUser && (
        <AdminEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          canManageRole={user?.role === "admin"}
        />
      )}
    </div>
  );
}
