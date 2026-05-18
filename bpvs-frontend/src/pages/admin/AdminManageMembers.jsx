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
  UserX,
  Pencil,
  Plus,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPatch, apiDelete, apiPost } from "../../api/api";
import AdminEditModal from "../../components/modals/AdminEditModal";
import DesktopPagination from "../../components/ui/DesktopPagination";
import { StatusPill } from "../../components/ui/RoleBadge";
import { formatDate } from "../../utils/dateUtils";

const ITEMS_PER_PAGE = 20;
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
      <StatusPill status={u.status} />
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-500 whitespace-nowrap w-[13%]">
      {formatDate(u.createdAt)}
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
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

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ tab, searchQuery, onClearSearch }) => (
  <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
      <Users size={20} className="text-stone-400" />
    </div>
    <p className="text-stone-400 text-sm">
      {searchQuery ? "No results match your search" : "No members found"}
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

// ── Add User Modal ────────────────────────────────────────────────────────────
const AddUserModal = ({ onClose, onSave }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim() || !mobile.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create user.");
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
          <h2 className="text-base font-semibold text-gray-900">
            Add New User
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white text-gray-500 hover:bg-stone-100 transition-colors"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#C94621] focus:ring-2 focus:ring-[#C94621]/10 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#C94621] focus:ring-2 focus:ring-[#C94621]/10 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Mobile
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#C94621] focus:ring-2 focus:ring-[#C94621]/10 transition"
            />
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            A default password will be set. The user will receive their
            credentials via email.
          </p>
          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
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
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#C94621] hover:bg-[#B33D1E]"
            }`}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminManageMembers() {
  const navigate = useNavigate();
  const { user, loading, isStaff } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [fetching, setFetching] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
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
  const fetchUsers = async () => {
    setFetching(true);
    const res = await apiGet(
      `/admin/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}&tab=${activeTab}`
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

  const handleCreateUser = async (userData) => {
    const res = await apiPost("/admin/users", userData);
    if (!res.success) throw new Error(res.message);
    fetchUsers();
    refreshStats();
  };

  // ── Client-side search filter ─────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.mobile?.includes(q)
    );
  }, [searchQuery, users]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)),
    [totalItems]
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  if (loading || !isStaff) return <LoadingScreen />;

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
        <div className="shrink-0 grid grid-cols-3 gap-3">
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
          <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-stone-100">

            {/* MOBILE ONLY: stacked layout (<640px) */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              {/* Row 1: Tab pills full width */}
              <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-full">
                {TABS.map(({ key, label, statKey }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer border-none ${
                      activeTab === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-stone-500 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    {label}
                    <span
                      className={`text-[11px] font-semibold ${
                        activeTab === key ? "text-[#C94621]" : "text-stone-400"
                      }`}
                    >
                      {stats[statKey] ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 2: Search full width + Add User */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
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
                    placeholder="Search members..."
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
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold bg-[#C94621] text-white hover:bg-[#B33D1E] transition-colors cursor-pointer border-none whitespace-nowrap shrink-0"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* TABLET/DESKTOP ONLY: original single-row layout (≥640px) */}
            <div className="hidden sm:flex items-center justify-between gap-3 flex-wrap">
              {/* Tab pills */}
              <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 flex-wrap">
                {TABS.map(({ key, label, statKey }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer border-none ${
                      activeTab === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-stone-500 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    {label}
                    <span
                      className={`ml-1.5 text-[11px] font-semibold ${
                        activeTab === key ? "text-[#C94621]" : "text-stone-400"
                      }`}
                    >
                      {stats[statKey] ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
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
                    placeholder="Search members..."
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

                {/* Add User Button */}
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-1.5 px-3 py-1.75 rounded-lg text-[13px] font-semibold bg-[#C94621] text-white hover:bg-[#B33D1E] transition-colors cursor-pointer border-none whitespace-nowrap"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Add User</span>
                </button>
              </div>
            </div>

          </div>
          {/* ── END Toolbar ── */}

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
            label="members"
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

      {/* ── Add User Modal ── */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSave={handleCreateUser}
        />
      )}
    </div>
  );
}