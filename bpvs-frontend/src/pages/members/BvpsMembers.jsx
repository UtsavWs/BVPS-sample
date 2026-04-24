import {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  memo,
} from "react";
import { ArrowLeft, Search, ChevronDown, Filter, X } from "lucide-react";
import TabBar from "../../components/ui/TabBar";
import MemberDetailModal from "../../components/modals/MemberDetailModal";
import DesktopPagination from "../../components/ui/DesktopPagination";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";
import { apiGet } from "../../api/api";
import { StatusPill } from "../../components/ui/RoleBadge";
import { formatDate } from "../../utils/dateUtils";

const ITEMS_PER_PAGE = 20;
const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";

const DATE_OPTIONS = [
  { label: "All time", days: null },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

const STATUS_OPTIONS = ["active", "inactive"];

function getDateCutoff(days) {
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ── Shared colgroup ───────────────────────────────────────────────────────────
const TableColgroup = () => (
  <colgroup>
    <col style={{ width: "56px" }} />
    <col style={{ width: "22%" }} />
    <col style={{ width: "16%" }} />
    <col style={{ width: "18%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "11%" }} />
  </colgroup>
);

// ── Filter Dropdown ───────────────────────────────────────────────────────────
const FilterDropdown = ({
  dateFilter,
  setDateFilter,
  statusFilters,
  setStatusFilters,
  onClose,
  anchorRef,
  showJoinedFilter = false,
}) => {
  const [dateOpen, setDateOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      )
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const toggleStatus = (s) =>
    setStatusFilters((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const activeCount = (dateFilter.days !== null ? 1 : 0) + statusFilters.length;

  const CheckRow = ({ checked, label, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left w-full border-none cursor-pointer transition-colors ${checked
        ? "bg-[#FEF3EF] text-[#C94621] font-medium"
        : "bg-transparent text-gray-700 hover:bg-stone-50"
        }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked
          ? "bg-[#C94621] border-[#C94621]"
          : "border-stone-300 bg-white"
          }`}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path
              d="M1 3.5L3.5 6L8 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );

  const SectionToggle = ({ label, open, onToggle, hasBorder }) => (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between w-full py-2.5 text-[13px] font-semibold text-gray-800 border-none bg-transparent cursor-pointer ${hasBorder ? "border-t border-stone-100 mt-1 pt-3" : ""}`}
    >
      <span>{label}</span>
      <ChevronDown
        size={14}
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div
      ref={dropRef}
      className="absolute right-0 top-full mt-2 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl"
      style={{ width: "280px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <span className="text-[15px] font-semibold text-gray-900">Filters</span>
        {activeCount > 0 && (
          <button
            onClick={() => {
              setDateFilter({ label: "All time", days: null });
              setStatusFilters([]);
            }}
            className="text-[12px] text-[#C94621] font-medium hover:underline border-none bg-transparent cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="px-5 py-3 max-h-105 overflow-y-auto">
        {/* Joined / Date - only show on "New" tab */}
        {showJoinedFilter && (
          <>
            <SectionToggle
              label="Joined"
              open={dateOpen}
              onToggle={() => setDateOpen((v) => !v)}
              hasBorder={false}
            />
            {dateOpen && (
              <div className="mt-1 mb-3 flex flex-col gap-0.5">
                {DATE_OPTIONS.map((opt) => (
                  <CheckRow
                    key={opt.label}
                    checked={dateFilter.label === opt.label}
                    label={opt.label}
                    onClick={() => setDateFilter(opt)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Status */}
        <SectionToggle
          label="Status"
          open={statusOpen}
          onToggle={() => setStatusOpen((v) => !v)}
          hasBorder
        />
        {statusOpen && (
          <div className="mt-1 mb-3 flex flex-col gap-0.5">
            {STATUS_OPTIONS.map((s) => (
              <CheckRow
                key={s}
                checked={statusFilters.includes(s)}
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                onClick={() => toggleStatus(s)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Mobile / Tablet Card ──────────────────────────────────────────────────────
const MemberCard = memo(({ member, onClick }) => (
  <div
    onClick={() => onClick(member)}
    className="flex items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
  >
    <img
      src={member.profileImage || DEFAULT_PROFILE_IMAGE}
      alt={member.fullName}
      loading="lazy"
      decoding="async"
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0"
      style={{ border: "2px solid #F3F4F6" }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-[14.5px] sm:text-base font-semibold text-gray-900 truncate">
        {member.fullName}
      </p>
      <p className="text-[12.5px] sm:text-sm text-gray-600 mt-0.5 truncate">
        {member.businessInformation?.companyName || "—"}
      </p>
      <p className="text-[12px] sm:text-[13px] text-stone-400 mt-0.5 truncate">
        {member.businessInformation?.profession || "—"}
      </p>
    </div>
    {member.role === "subadmin" && (
      <span className="shrink-0 ml-2 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase bg-[#C946211F] text-[#C94621]">
        Admin
      </span>
    )}
  </div>
));

// ── Desktop Table Row ─────────────────────────────────────────────────────────
const TableRow = ({ member, onClick }) => (
  <tr
    onClick={() => onClick(member)}
    className="border-b border-stone-100 hover:bg-[#FEF8F6] transition-colors cursor-pointer"
  >
    <td className="py-2.5 pl-4 pr-3 w-14">
      <img
        src={member.profileImage || DEFAULT_PROFILE_IMAGE}
        alt={member.fullName}
        loading="lazy"
        decoding="async"
        className="w-9 h-9 rounded-xl object-cover block"
        style={{ border: "1px solid #F3F4F6" }}
      />
    </td>
    <td className="py-2.5 px-3">
      <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-45">
        {member.fullName}
      </p>
      <p className="text-[11.5px] text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-45">
        {member.businessInformation?.companyName || "—"}
      </p>
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-600 whitespace-nowrap">
      {member.mobile}
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-40">
      {member.businessInformation?.profession || "—"}
    </td>
    <td className="py-2.5 px-3">
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${member.role === "subadmin"
          ? "bg-[#FEF8F6] text-[#C94621] border-[#C94621]/30"
          : "bg-stone-100 text-stone-500 border-stone-200"
          }`}
      >
        {member.role === "subadmin" ? "Admin" : "Member"}
      </span>
    </td>
    <td className="py-2.5 px-3 text-[12px] text-gray-500 whitespace-nowrap">
      {formatDate(member.createdAt)}
    </td>
    <td className="py-2.5 px-3">
      <StatusPill
        status={member.status || "active"}
        variant="active-inactive"
      />
    </td>
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BvpsMembers() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    directoryMembers,
    dirTotal,
    dirLoading,
    dirPage,
    dirHasMore,
    fetchPage,
    loadMore,
    loadingMore,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
  } = useContext(MemberContext);

  const [selectedMember, setSelectedMember] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const mobileSentinelRef = useRef(null);

  // Sync mobile viewport
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1023px)").matches
      : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Infinite scroll sentinel for mobile
  useEffect(() => {
    if (!isMobile || !dirHasMore || loadingMore) return;
    const node = mobileSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isMobile, dirHasMore, loadingMore, loadMore]);

  const handleTabChange = (tab) => {
    const newFilters = { ...filters, tab };
    if (tab === "New") {
      newFilters.days = 30;
    } else {
      newFilters.days = null;
    }
    setFilters(newFilters);
    setSearchQuery("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSetDateFilter = (opt) => {
    setFilters({ ...filters, days: opt.days });
  };

  const handleSetStatusFilters = (sOrFn) => {
    const newStatus =
      typeof sOrFn === "function"
        ? sOrFn(filters.status.split(",").filter(Boolean)).join(",")
        : sOrFn.join(",");
    setFilters({ ...filters, status: newStatus });
  };

  const removeChip = (type, value) => {
    if (type === "date") setFilters({ ...filters, days: null });
    if (type === "status") {
      const current = filters.status.split(",").filter((x) => x !== value);
      setFilters({ ...filters, status: current.join(",") });
    }
  };

  const clearAllFilters = () => {
    setFilters({ tab: "All", days: null, status: "" });
    setSearchQuery("");
  };

  const handlePageChange = (page) => fetchPage(page);
  const handleMemberClick = useCallback(
    (member) => setSelectedMember(member),
    [],
  );
  const handleCloseModal = useCallback(() => setSelectedMember(null), []);

  const selfId = user?.id || user?._id;
  const visibleMembers = selfId
    ? directoryMembers.filter((m) => String(m._id) !== String(selfId))
    : directoryMembers;

  const totalPages = Math.max(1, Math.ceil(dirTotal / ITEMS_PER_PAGE));
  const statusFilters = filters.status.split(",").filter(Boolean);
  const dateFilter =
    DATE_OPTIONS.find((o) => o.days === filters.days) || DATE_OPTIONS[0];
  const activeFilterCount =
    (filters.days !== null ? 1 : 0) + statusFilters.length;

  // Build active chips
  const chips = [
    ...(dateFilter.days !== null
      ? [{ type: "date", label: dateFilter.label, value: dateFilter.label }]
      : []),
    ...statusFilters.map((s) => ({
      type: "status",
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
    })),
  ];

  const modalMember = selectedMember
    ? {
      name: selectedMember.fullName,
      company: selectedMember.businessInformation?.companyName || "—",
      profession: selectedMember.businessInformation?.profession || "—",
      mobile: selectedMember.mobile,
      email: selectedMember.email,
      badge: null,
      status: selectedMember.status || "active",
      profileImage: selectedMember.profileImage,
      contactInformation: selectedMember.contactInformation,
    }
    : null;

  return (
    <div className="bg-white">
      <MemberDetailModal member={modalMember} onClose={handleCloseModal} />

      {/* ══ MOBILE / TABLET (< lg) ══════════════════════════════════════════ */}
      <div className="lg:hidden w-full sm:max-w-lg sm:mx-auto md:max-w-full md:mx-auto md:rounded-2xl md:shadow-sm">
        <div className="top-0 sticky z-10 bg-white border-b border-stone-100 flex items-center justify-center relative px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 sm:rounded-t-2xl md:rounded-t-2xl">
          <button className="absolute left-4 sm:left-6 p-1 text-gray-800">
            <ArrowLeft
              onClick={() => navigate(-1)}
              size={21}
              strokeWidth={2.2}
            />
          </button>
          <h1 className="text-[15px] sm:text-base font-semibold text-gray-900">
            BVPS Members
          </h1>
        </div>

        <div className="px-4 pt-3 pb-1 sm:px-6">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search members..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-stone-200 bg-stone-50 text-gray-800 placeholder-stone-400 outline-none focus:border-[#C94621] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <TabBar
          tabs={["All", "New"]}
          active={filters.tab}
          onChange={handleTabChange}
          className="mx-4 my-3 sm:mx-6"
        />

        {dirLoading && dirPage === 1 ? (
          <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
            Loading members...
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
            No members found
          </div>
        ) : (
          <>
            {visibleMembers.map((m) => (
              <MemberCard key={m._id} member={m} onClick={handleMemberClick} />
            ))}
            {dirHasMore && (
              <div
                ref={mobileSentinelRef}
                className="flex items-center justify-center px-4 py-6"
              >
                <div className="flex items-center gap-2 text-[12.5px] text-stone-400">
                  <span className="w-4 h-4 rounded-full border-2 border-stone-200 border-t-[#C94621] animate-spin" />
                  Loading more…
                </div>
              </div>
            )}
            {!dirHasMore && visibleMembers.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center px-4 py-5 text-[12px] text-stone-400">
                You're all caught up
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ DESKTOP (lg+) ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-col h-screen w-full max-w-412.5 mx-auto px-8 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button className="p-1 text-gray-800 hover:text-[#C94621] transition-colors">
            <ArrowLeft
              onClick={() => navigate(-1)}
              size={21}
              strokeWidth={2.2}
            />
          </button>
          <h1 className="text-xl font-bold text-gray-900">BVPS Members</h1>
        </div>

        <div className="flex flex-col flex-1 bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm min-h-0">
          {/* Toolbar */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-100 gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
              {["All", "New"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-1.5 text-[13px] rounded-md font-medium transition-all ${filters.tab === tab
                    ? "bg-[#C94621] text-white shadow-sm"
                    : "text-stone-500 hover:text-gray-700"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search members..."
                  className="pl-8 pr-3 py-1.75 text-[13px] w-52 rounded-lg border border-stone-200 bg-stone-50 text-gray-800 placeholder-stone-400 outline-none focus:border-[#C94621] focus:bg-white transition-colors"
                />
              </div>

              {/* Filter button */}
              <div className="relative">
                <button
                  ref={filterBtnRef}
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`flex items-center gap-2 px-3.5 py-1.75 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${activeFilterCount > 0 || filterOpen
                    ? "bg-[#C94621] text-white border-[#C94621]"
                    : "bg-white text-stone-600 border-stone-200 hover:border-[#C94621] hover:text-[#C94621]"
                    }`}
                >
                  <Filter size={13} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center bg-white text-[#C94621]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <FilterDropdown
                    dateFilter={dateFilter}
                    setDateFilter={handleSetDateFilter}
                    statusFilters={statusFilters}
                    setStatusFilters={handleSetStatusFilters}
                    onClose={() => setFilterOpen(false)}
                    anchorRef={filterBtnRef}
                    showJoinedFilter={filters.tab === "New"}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips row */}
          {chips.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 flex-wrap px-5 py-2.5 border-b border-stone-100 bg-stone-50/60">
              {chips.map((chip) => (
                <span
                  key={`${chip.type}-${chip.value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#FEF3EF] text-[#C94621] border border-[#f3c4b2]"
                >
                  {chip.label}
                  <button
                    onClick={() => removeChip(chip.type, chip.value)}
                    className="hover:opacity-70 transition-opacity border-none bg-transparent cursor-pointer p-0 leading-none"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-[12px] text-stone-400 hover:text-[#C94621] transition-colors border-none bg-transparent cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Split thead/tbody — scrollbar stays inside tbody only */}
          <div className="flex flex-col flex-1 min-h-0 overflow-x-auto">
            {/* Header — fixed, no vertical scroll */}
            <div className="shrink-0">
              <table
                className="w-full border-collapse"
                style={{ tableLayout: "fixed", minWidth: "720px" }}
              >
                <TableColgroup />
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="py-3 pl-4 pr-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Photo
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Member Name
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Mobile
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Profession
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Role
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Joined
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Body — only rows scroll vertically */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {dirLoading ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
                </div>
              ) : visibleMembers.length === 0 ? (
                <div className="flex items-center justify-center h-full py-16 text-stone-400 text-sm">
                  No members found
                </div>
              ) : (
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed", minWidth: "720px" }}
                >
                  <TableColgroup />
                  <tbody>
                    {visibleMembers.map((member) => (
                      <TableRow
                        key={member._id}
                        member={member}
                        onClick={handleMemberClick}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DesktopPagination
            currentPage={dirPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={dirTotal}
            startIndex={(dirPage - 1) * ITEMS_PER_PAGE}
            itemsPerPage={ITEMS_PER_PAGE}
            label="members"
          />
        </div>
      </div>
    </div>
  );
}
