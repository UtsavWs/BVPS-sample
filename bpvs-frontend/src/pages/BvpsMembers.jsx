import {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  memo,
} from "react";
import { ArrowLeft, Search, ChevronDown, Filter, X } from "lucide-react";
import TabBar from "../components/TabBar";
import MemberDetailModal from "../components/modals/MemberDetailModal";
import DesktopPagination from "../components/DesktopPagination";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiGet } from "../api/api";
import { StatusPill } from "../components/RoleBadge";

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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left w-full border-none cursor-pointer transition-colors ${
        checked
          ? "bg-[#FEF3EF] text-[#C94621] font-medium"
          : "bg-transparent text-gray-700 hover:bg-stone-50"
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
          checked
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
    className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
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
        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
          member.role === "subadmin"
            ? "bg-[#FEF8F6] text-[#C94621] border-[#C94621]/30"
            : "bg-stone-100 text-stone-500 border-stone-200"
        }`}
      >
        {member.role === "subadmin" ? "Admin" : "Member"}
      </span>
    </td>
    <td className="py-2.5 px-3 text-[12px] text-gray-500 whitespace-nowrap">
      {member.createdAt
        ? new Date(member.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—"}
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
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [dateFilter, setDateFilter] = useState({
    label: "All time",
    days: null,
  });
  const [statusFilters, setStatusFilters] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  // Mobile infinite-scroll state (separate from desktop pagination)
  const [mobileMembers, setMobileMembers] = useState([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [mobileHasMore, setMobileHasMore] = useState(true);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const mobileSentinelRef = useRef(null);

  // Track viewport so only the active layout fetches.
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

  const navigate = useNavigate();
  const auth = useContext(AuthContext);



  // Desktop fetch — paginated, replaces on every page/filter change.
  useEffect(() => {
    if (!auth.user || isMobile) return;
    let cancelled = false;
    const fetchMembers = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(activeTab && { tab: activeTab }),
        ...(dateFilter.days != null && { days: String(dateFilter.days) }),
        ...(statusFilters.length && { status: statusFilters.join(",") }),
      });
      const res = await apiGet(`/members?${params}`);
      if (cancelled) return;
      if (res.success) {
        setMembers(res.data.members);
        setTotalItems(res.data.pagination.total);
      }
      setLoading(false);
    };
    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [
    auth.user,
    isMobile,
    currentPage,
    searchQuery,
    activeTab,
    dateFilter,
    statusFilters,
  ]);

  // Mobile fetch — appends pages, resets to page 1 when filters change.
  useEffect(() => {
    if (!auth.user || !isMobile) return;
    let cancelled = false;
    const fetchMobileMembers = async () => {
      setMobileLoadingMore(true);
      const params = new URLSearchParams({
        page: mobilePage,
        limit: ITEMS_PER_PAGE,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(activeTab && { tab: activeTab }),
        ...(dateFilter.days != null && { days: String(dateFilter.days) }),
        ...(statusFilters.length && { status: statusFilters.join(",") }),
      });
      const res = await apiGet(`/members?${params}`);
      if (cancelled) return;
      if (res.success) {
        const fetched = res.data.members || [];
        const total = res.data.pagination?.total ?? 0;
        setMobileMembers((prev) =>
          mobilePage === 1 ? fetched : [...prev, ...fetched],
        );
        setTotalItems(total);
        setMobileHasMore(mobilePage * ITEMS_PER_PAGE < total);
      }
      setMobileLoadingMore(false);
    };
    fetchMobileMembers();
    return () => {
      cancelled = true;
    };
  }, [
    auth.user,
    isMobile,
    mobilePage,
    searchQuery,
    activeTab,
    dateFilter,
    statusFilters,
  ]);

  // Infinite scroll sentinel — request next page when it enters the viewport.
  useEffect(() => {
    if (!isMobile || !mobileHasMore || mobileLoadingMore) return;
    const node = mobileSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMobilePage((p) => p + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isMobile, mobileHasMore, mobileLoadingMore]);

  // Reset mobile pagination when filters/search/tab change.
  const resetMobile = () => {
    setMobileMembers([]);
    setMobilePage(1);
    setMobileHasMore(true);
  };

  const activeFilterCount =
    (dateFilter.days !== null ? 1 : 0) + statusFilters.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedMembers = members; // already paginated by backend

  const handlePageChange = (page) => setCurrentPage(page);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    resetMobile();
    if (tab === "New") {
      setDateFilter({ label: "Last 7 days", days: 7 });
    } else {
      setDateFilter({ label: "All time", days: null });
    }
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    resetMobile();
  };
  const handleMemberClick = useCallback(
    (member) => setSelectedMember(member),
    [],
  );
  const handleCloseModal = useCallback(() => setSelectedMember(null), []);

  const handleSetDateFilter = (opt) => {
    setDateFilter(opt);
    setCurrentPage(1);
    resetMobile();
  };
  const handleSetStatusFilters = (s) => {
    setStatusFilters(s);
    setCurrentPage(1);
    resetMobile();
  };

  const removeChip = (type, value) => {
    if (type === "date") setDateFilter({ label: "All time", days: null });
    if (type === "status")
      setStatusFilters((p) => p.filter((x) => x !== value));
    setCurrentPage(1);
    resetMobile();
  };

  const clearAllFilters = () => {
    setDateFilter({ label: "All time", days: null });
    setStatusFilters([]);
    setCurrentPage(1);
    resetMobile();
  };

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
          active={activeTab}
          onChange={handleTabChange}
          className="mx-4 my-3 sm:mx-6"
        />

        {mobileLoadingMore && mobilePage === 1 ? (
          <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
            Loading members...
          </div>
        ) : mobileMembers.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
            No members found
          </div>
        ) : (
          <>
            {mobileMembers.map((m) => (
              <MemberCard key={m._id} member={m} onClick={handleMemberClick} />
            ))}
            {mobileHasMore && (
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
            {!mobileHasMore && mobileMembers.length > ITEMS_PER_PAGE && (
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
                  className={`px-4 py-1.5 text-[13px] rounded-md font-medium transition-all ${
                    activeTab === tab
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
                  className={`flex items-center gap-2 px-3.5 py-1.75 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    activeFilterCount > 0 || filterOpen
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
                    showJoinedFilter={activeTab === "New"}
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
              {loading ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
                </div>
              ) : paginatedMembers.length === 0 ? (
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
                    {paginatedMembers.map((member) => (
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
            itemsPerPage={ITEMS_PER_PAGE}
            label="members"
          />
        </div>
      </div>
    </div>
  );
}
