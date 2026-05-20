import { useState, useEffect, useContext, useRef, memo, useCallback } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import TabBar from "../../components/ui/TabBar";
import DesktopPagination from "../../components/ui/DesktopPagination";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import ActivityDetailModal from "../../components/modals/ActivityDetailModal";
import { formatDate, parseDateDisplay } from "../../utils/dateUtils";
import DatePicker from "../../components/forms/DatePicker";

const ITEMS_PER_PAGE = 20;

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

// Map a raw slip from the API into the row shape used by the UI.
const mapSlip = (slip, tab) => {
  const counterparty = tab === "Given" ? slip.receivedBy : slip.givenBy;
  return {
    id: slip._id,
    name: counterparty?.fullName || "Unknown member",
    company: getCompany(counterparty),
    date: formatDate(slip.createdAt),
    rawDate: slip.createdAt,
    amount: slip.amount,
    type: tab === "Given" ? "thankYouGiven" : "thankYouReceived",
    typeLabel: "Thank You",
    rawData: slip,
    logType: "thankyouslip",
    tab,
  };
};

// Map a raw referral from the API into the row shape used by the UI.
const mapReferral = (referral, tab) => {
  const counterparty = tab === "Given" ? referral.receivedBy : referral.givenBy;
  return {
    id: referral._id,
    name: counterparty?.fullName || "Unknown member",
    company: getCompany(counterparty),
    date: formatDate(referral.createdAt),
    rawDate: referral.createdAt,
    type: tab === "Given" ? "referralGiven" : "referralReceived",
    typeLabel: "Referral",
    rawData: referral,
    logType: "referral",
    tab,
  };
};

// Map a raw b2b entry from the API into the row shape used by the UI.
const mapB2b = (b2b, tab) => {
  const counterparty = tab === "Given" ? b2b.receivedBy : b2b.givenBy;
  return {
    id: b2b._id,
    name: counterparty?.fullName || "Unknown member",
    company: getCompany(counterparty),
    date: formatDate(b2b.createdAt),
    rawDate: b2b.createdAt,
    type: tab === "Given" ? "b2bGiven" : "b2bReceived",
    typeLabel: "B2B",
    rawData: b2b,
    logType: "b2b",
    tab,
  };
};

const mapItem = (item, tab) => {
  if (item.logType === "thankyouslip") return mapSlip(item, tab);
  if (item.logType === "referral") return mapReferral(item, tab);
  if (item.logType === "b2b") return mapB2b(item, tab);
  return null;
};

// ── Shared colgroup ────────────────────────────────────────────────────────────
// Icon | Member | Activity badge | Date
const TableColgroup = () => (
  <colgroup>
    <col style={{ width: "72px" }} />
    <col style={{ width: "35%" }} />
    <col style={{ width: "20%" }} />
    <col style={{ width: "22%" }} />
  </colgroup>
);

// ── Activity Icon Box ──────────────────────────────────────────────────────────
const ActivityIcon = ({ type }) => (
  <div className="w-10 h-10 rounded-xl bg-[#FEF0EA] flex items-center justify-center shrink-0">
    <img
      src={ACTIVITY_ICONS[type]}
      alt={type}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-contain"
    />
  </div>
);

// ── Mobile Log Row ─────────────────────────────────────────────────────────────
const MobileLogRow = memo(({ log, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer">
    <ActivityIcon type={log.type} />
    <div className="flex-1 min-w-0">
      <p className="text-[14.5px] sm:text-base font-semibold text-gray-900 truncate">
        {log.name}
      </p>
      <p className="text-[12.5px] sm:text-sm text-gray-500 mt-0.5 truncate">
        {log.company}
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[12px] sm:text-[13px] text-stone-400">
        {log.date}
      </span>
      <ChevronRight size={16} className="text-stone-300" />
    </div>
  </div>
));

// ── Desktop Table Row ──────────────────────────────────────────────────────────
const TableRow = ({ log, onClick }) => (
  <tr onClick={onClick} className="border-b border-stone-100 hover:bg-[#FEF8F6] transition-colors cursor-pointer">
    <td className="py-2.5 pl-5 pr-3">
      <ActivityIcon type={log.type} />
    </td>
    <td className="py-2.5 px-3">
      <p className="text-[13px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-55">
        {log.name}
      </p>
      <p className="text-[11.5px] text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-55">
        {log.company}
      </p>
    </td>
    <td className="py-2.5 px-3">
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF0EA] text-[#C94621] border border-[#C94621]/20 whitespace-nowrap">
        {log.typeLabel}
      </span>
    </td>
    <td className="py-2.5 px-3 text-[13px] text-gray-500 whitespace-nowrap">
      {log.date}
    </td>
  </tr>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const [activeTab, setActiveTab] = useState("Given");
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [givenTotal, setGivenTotal] = useState(0);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const mobileSentinelRef = useRef(null);

  // Redirect unauthenticated users to login once auth has finished initializing.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchActivity = useCallback(
    async (pageNum, { append = false } = {}) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          tab: activeTab,
          page: String(pageNum),
          limit: String(ITEMS_PER_PAGE),
        });
        if (dateRange.start && dateRange.end) {
          const start = parseDateDisplay(dateRange.start);
          const end = parseDateDisplay(dateRange.end);
          if (start) params.set("startDate", start.toISOString());
          if (end) params.set("endDate", end.toISOString());
        }

        const res = await apiGet(`/activity-log?${params.toString()}`);

        if (!res.success || !res.data) {
          setError("Failed to load activity");
          if (!append) setLogs([]);
          return;
        }

        const mapped = (res.data.items || [])
          .map((item) => mapItem(item, activeTab))
          .filter(Boolean);

        setLogs((prev) => (append ? [...prev, ...mapped] : mapped));
        const pageFromApi = res.data.pagination?.page || pageNum;
        const pagesFromApi = Math.max(1, res.data.pagination?.pages || 1);
        setCurrentPage(pageFromApi);
        setTotalPages(pagesFromApi);
        setTotal(res.data.pagination?.total || 0);
        setHasMore(pageFromApi < pagesFromApi);
        setGivenTotal(res.data.totals?.given || 0);
        setReceivedTotal(res.data.totals?.received || 0);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, dateRange],
  );

  // Refetch page 1 whenever the tab or date filter changes.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchActivity(1);
  }, [authLoading, isAuthenticated, fetchActivity]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchActivity(currentPage + 1, { append: true });
  }, [hasMore, loadingMore, loading, currentPage, fetchActivity]);

  // Infinite scroll for mobile/tablet.
  useEffect(() => {
    if (!hasMore) return;
    const node = mobileSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Avoid rendering page contents while auth is initializing or redirecting.
  if (authLoading || !isAuthenticated) return null;

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLogs([]);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    fetchActivity(page);
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const emptyMessage = loading
    ? "Loading…"
    : error
      ? error
      : activeTab === "Given"
        ? "No given activity yet"
        : "No received activity yet";

  return (
    <div className="bg-white">
      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      {selectedLog && (
        <ActivityDetailModal log={selectedLog} currentUser={user} onClose={() => setSelectedLog(null)} />
      )}

      {/* ── DATE PICKER ────────────────────────────────────────────────────── */}
      {showDatePicker && (
        <DatePicker
          mode="range"
          onConfirm={(range) => {
            setDateRange(range);
            setCurrentPage(1);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}

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
            Activity Log
          </h1>
        </div>

        <div className="mx-4 my-4 sm:mx-6 sm:my-5">
          <TabBar
            tabs={["Given", "Received"]}
            active={activeTab}
            onChange={handleTabChange}
          />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 pb-2">
          <h2 className="text-[15px] font-bold text-gray-900">
            {activeTab === "Given" ? "Given Logs" : "Received Logs"}
          </h2>
          <div className="flex items-center gap-2">
            {dateRange.start && (
              <button
                onClick={() => setDateRange({ start: null, end: null })}
                className="text-[12px] text-stone-500 underline"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowDatePicker(true)}
              className={`p-1.5 rounded-lg transition-colors ${dateRange.start
                  ? "bg-[#FEF0EA] border border-[#C94621]/20"
                  : "text-stone-400 hover:text-[#C94621] hover:bg-[#FEF0EA]"
                }`}
            >
              <img
                src="/assets/logos/filter-horizontal.svg"
                className="w-5 h-5"
                style={dateRange.start ? { opacity: 0.8 } : {}}
              />
            </button>
          </div>
        </div>

        <div>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
              Loading…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
              {emptyMessage}
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <MobileLogRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
              ))}
              {hasMore && (
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
            </>
          )}
        </div>
      </div>

      {/* ══ DESKTOP (lg+) ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-col h-screen w-full max-w-7xl mx-auto px-8 pt-6 pb-6">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button className="p-1 text-gray-800 hover:text-[#C94621] transition-colors">
            <ArrowLeft
              onClick={() => navigate(-1)}
              size={21}
              strokeWidth={2.2}
            />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
        </div>

        {/* Card */}
        <div className="flex flex-col flex-1 bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm min-h-0">
          {/* Toolbar */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-100 gap-3">
            <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
              {["Given", "Received"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-1.5 text-[13px] rounded-md font-medium transition-all ${activeTab === tab
                    ? "bg-[#C94621] text-white shadow-sm"
                    : "text-stone-500 hover:text-gray-700"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[13px] text-stone-400 hidden sm:inline">
                Given:
                <span className="font-semibold text-gray-700">
                  {givenTotal}
                </span>
                <span className="mx-2 text-stone-300">|</span>
                Received:
                <span className="font-semibold text-gray-700">
                  {receivedTotal}
                </span>
              </span>
              {dateRange.start && (
                <button
                  onClick={() => setDateRange({ start: null, end: null })}
                  className="text-[12px] text-stone-500 hover:text-stone-700 underline"
                >
                  Clear Filter
                </button>
              )}
              <button
                onClick={() => setShowDatePicker(true)}
                className={`flex items-center gap-1.5 px-3 py-1.75 rounded-lg border text-[13px] transition-all cursor-pointer ${dateRange.start
                    ? "border-[#C94621] text-[#C94621] bg-[#FEF0EA]"
                    : "border-stone-200 text-stone-500 hover:border-[#C94621] hover:text-[#C94621] hover:bg-[#FEF8F6]"
                  }`}
              >
                <img
                  src="/assets/logos/filter-horizontal.svg"
                  className="w-4 h-4"
                />
                <span>{dateRange.start ? `${dateRange.start} - ${dateRange.end}` : "Filter"}</span>
              </button>
            </div>
          </div>

          {/* Split thead/tbody — same pattern as BvpsMembers */}
          <div className="flex flex-col flex-1 min-h-0 overflow-x-auto">
            {/* Fixed header */}
            <div className="shrink-0">
              <table
                className="w-full border-collapse"
                style={{ tableLayout: "fixed", minWidth: "560px" }}
              >
                <TableColgroup />
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="py-3 pl-5 pr-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Member
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Activity
                    </th>
                    <th className="py-3 px-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center h-full py-16 text-stone-400 text-sm">
                  {emptyMessage}
                </div>
              ) : (
                <table
                  className="w-full border-collapse"
                  style={{ tableLayout: "fixed", minWidth: "560px" }}
                >
                  <TableColgroup />
                  <tbody>
                    {logs.map((log) => (
                      <TableRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
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
            totalItems={total}
            startIndex={startIndex}
            itemsPerPage={ITEMS_PER_PAGE}
            label="logs"
          />
        </div>
      </div>
    </div>
  );
}
