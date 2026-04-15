import { useState, useEffect, useContext, useRef, memo } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import TabBar from "../components/TabBar";
import DesktopPagination from "../components/DesktopPagination";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api/api";
import { AuthContext } from "../context/AuthContext";

const ITEMS_PER_PAGE = 20;
const MOBILE_BATCH_SIZE = 8;

const ACTIVITY_ICONS = {
  thankYouGiven: "/assets/logos/thankYouslipG.svg",
  thankYouReceived: "/assets/logos/thankYouSlipR.svg",
  referralGiven: "/assets/logos/referralsG.svg",
  referralReceived: "/assets/logos/refrralsR.svg",
  b2bGiven: "/assets/logos/b2b.svg",
  b2bReceived: "/assets/logos/b2b.svg",
};

// ── Format helpers ─────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  };
};

// Map a raw b2b entry from the API into the row shape used by the UI.
const mapB2b = (b2b, tab) => {
  const counterparty = tab === "Given" ? b2b.memberId : b2b.addedBy;
  return {
    id: b2b._id,
    name: counterparty?.fullName || "Unknown member",
    company: getCompany(counterparty),
    date: formatDate(b2b.createdAt),
    rawDate: b2b.createdAt,
    type: tab === "Given" ? "b2bGiven" : "b2bReceived",
    typeLabel: "B2B",
  };
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
const MobileLogRow = memo(({ log }) => (
  <div className="flex items-center gap-3.5 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer">
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
const TableRow = ({ log }) => (
  <tr className="border-b border-stone-100 hover:bg-[#FEF8F6] transition-colors cursor-pointer">
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
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileVisibleCount, setMobileVisibleCount] =
    useState(MOBILE_BATCH_SIZE);
  const [givenLogs, setGivenLogs] = useState([]);
  const [receivedLogs, setReceivedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const mobileSentinelRef = useRef(null);

  // Redirect unauthenticated users to login once auth has finished initializing.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    const fetchActivity = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiGet("/activity-log");
        if (cancelled) return;

        if (!res.success || !res.data) {
          setError("Failed to load activity");
          setGivenLogs([]);
          setReceivedLogs([]);
          return;
        }

        const { thankyouslip = {}, referrals = {}, b2b = {} } = res.data;

        const slipGiven = (thankyouslip.given || []).map((s) =>
          mapSlip(s, "Given"),
        );
        const slipReceived = (thankyouslip.received || []).map((s) =>
          mapSlip(s, "Received"),
        );
        const refGiven = (referrals.given || []).map((r) =>
          mapReferral(r, "Given"),
        );
        const refReceived = (referrals.received || []).map((r) =>
          mapReferral(r, "Received"),
        );
        const b2bGiven = (b2b.given || []).map((b) => mapB2b(b, "Given"));
        const b2bReceived = (b2b.received || []).map((b) =>
          mapB2b(b, "Received"),
        );

        // Merge and sort by date descending
        const sortByDate = (a, b) => new Date(b.rawDate) - new Date(a.rawDate);
        setGivenLogs(
          [...slipGiven, ...refGiven, ...b2bGiven].sort(sortByDate),
        );
        setReceivedLogs(
          [...slipReceived, ...refReceived, ...b2bReceived].sort(sortByDate),
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch activity:", err);
          setError("Network error. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const logs = activeTab === "Given" ? givenLogs : receivedLogs;
  const totalPages = Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const visibleMobileLogs = logs.slice(0, mobileVisibleCount);
  const remainingMobileCount = Math.max(0, logs.length - mobileVisibleCount);
  const hasMoreMobile = remainingMobileCount > 0;

  // Infinite scroll for mobile/tablet: reveal next batch when sentinel enters viewport.
  useEffect(() => {
    if (!hasMoreMobile) return;
    const node = mobileSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMobileVisibleCount((c) => c + MOBILE_BATCH_SIZE);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreMobile, activeTab]);

  // Avoid rendering page contents while auth is initializing or redirecting.
  if (authLoading || !isAuthenticated) return null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setMobileVisibleCount(MOBILE_BATCH_SIZE);
  };

  const emptyMessage = loading
    ? "Loading…"
    : error
      ? error
      : activeTab === "Given"
        ? "No given activity yet"
        : "No received activity yet";

  return (
    <div className="bg-white">
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
          <button className="p-1.5 rounded-lg text-stone-400 hover:text-[#C94621] hover:bg-[#FEF0EA] transition-colors">
            <img
              src="/assets/logos/filter-horizontal.svg"
              className="w-5 h-5"
            />
          </button>
        </div>

        <div>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-stone-400 text-sm">
              {emptyMessage}
            </div>
          ) : (
            <>
              {visibleMobileLogs.map((log) => (
                <MobileLogRow key={log.id} log={log} />
              ))}
              {hasMoreMobile && (
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
              {!hasMoreMobile && logs.length > MOBILE_BATCH_SIZE && (
                <div className="flex justify-center px-4 py-5 text-[12px] text-stone-400">
                  You're all caught up
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

            <div className="flex items-center gap-4">
              <span className="text-[13px] text-stone-400">
                Given:{" "}
                <span className="font-semibold text-gray-700">
                  {givenLogs.length}
                </span>
                <span className="mx-2 text-stone-300">|</span>
                Received:{" "}
                <span className="font-semibold text-gray-700">
                  {receivedLogs.length}
                </span>
              </span>
              <button className="flex items-center gap-1.5 px-3 py-1.75 rounded-lg border border-stone-200 text-stone-500 text-[13px] hover:border-[#C94621] hover:text-[#C94621] hover:bg-[#FEF8F6] transition-all cursor-pointer">
                <img
                  src="/assets/logos/filter-horizontal.svg"
                  className="w-4 h-4"
                />
                <span>Filter</span>
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
              {paginatedLogs.length === 0 ? (
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
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DesktopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={logs.length}
            startIndex={startIndex}
            itemsPerPage={ITEMS_PER_PAGE}
            label="logs"
          />
        </div>
      </div>
    </div>
  );
}
