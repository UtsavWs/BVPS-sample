import { Pencil, Plus } from "lucide-react";
import {
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import ProfileDrawer from "../components/ProfileDrawer";
import { AuthContext } from "../context/AuthContext";
import {
  getProfileImage,
  DEFAULT_PROFILE_IMAGE,
} from "../components/RoleBadge";
import LoadingScreen from "../components/LoadingScreen";
import DatePicker from "../components/DatePicker";
import { apiGet } from "../api/api";
import { parseDateDisplay } from "../utils/dateUtils";

const DRAWER_W = "clamp(260px, 22vw, 320px)";

const getStats = (counts) => [
  {
    label: "Business to Business",
    value: counts.b2bCount || 0,
    img: "/assets/logos/b2b.svg",
  },
  { label: "Total Visitors", value: counts.visitorCount || 0, img: "/assets/logos/visitors.svg" },
  {
    label: "Referrals Received",
    value: counts.referralReceivedCount || 0,
    img: "/assets/logos/refrralsR.svg",
  },
  {
    label: "Referrals Given",
    value: counts.referralGivenCount || 0,
    img: "/assets/logos/referralsG.svg",
  },
  {
    label: "Thankyou Slip Received",
    value: counts.thankyouslipReceivedCount || 0,
    img: "/assets/logos/thankYouSlipR.svg",
  },
  {
    label: "Thankyou Slip Given",
    value: counts.thankyouslipGivenCount || 0,
    img: "/assets/logos/thankYouslipG.svg",
  },
];

const TABS = ["Current Week", "Last Week", "Month"];

const MENU_ITEMS = [
  { label: "Add B2B", img: "/assets/logos/b2b.svg", route: "/add-b2b" },
  {
    label: "Add Visitor",
    img: "/assets/logos/visitors.svg",
    route: "/add-visitor",
  },
  {
    label: "Add Referrals",
    img: "/assets/logos/referralsG.svg",
    route: "/add-referral",
  },
  {
    label: "Add Thankyou Slip",
    img: "/assets/logos/thankYouslipG.svg",
    route: "/add-thankyouslip",
  },
];

const FabMenu = ({
  mobile = false,
  wrapRef,
  menuOpen,
  setMenuOpen,
  isApproved,
  navigate,
}) => (
  <div
    ref={wrapRef}
    style={{ backdropFilter: menuOpen ? "blur(2px)" : "" }}
    className={[
      "flex flex-col items-end gap-2.5",
      mobile
        ? "fixed bottom-5 right-4 z-200"
        : "absolute bottom-8 right-8 z-60",
    ].join(" ")}
  >
    {isApproved &&
      MENU_ITEMS.map((item, i) => {
        const delay = menuOpen
          ? `${(MENU_ITEMS.length - 1 - i) * 50}ms`
          : `${i * 30}ms`;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5"
            style={{
              transitionProperty: "opacity, transform",
              transitionDuration: "220ms",
              transitionTimingFunction: "ease",
              transitionDelay: delay,
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen
                ? "translateY(0) scale(1)"
                : "translateY(10px) scale(0.9)",
              pointerEvents: menuOpen ? "auto" : "none",
            }}
          >
            <span
              onClick={() => {
                setMenuOpen(false);
                if (item.route) navigate(item.route);
              }}
              className="bg-white text-gray-800 text-[13px] font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap border border-gray-100 select-none"
            >
              {item.label}
            </span>
            <button
              type="button"
              className={[
                mobile
                  ? "w-13 h-13"
                  : "w-11 h-11 md:w-15 md:h-15 lg:w-16 lg:h-16",
                "rounded-full bg-white shadow-lg border border-gray-100",
                "flex items-center justify-center overflow-hidden",
                "active:scale-95 transition-transform cursor-pointer",
              ].join(" ")}
              onClick={() => {
                setMenuOpen(false);
                if (item.route) navigate(item.route);
              }}
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        );
      })}
    <button
      type="button"
      className={[
        mobile
          ? "w-14 h-14 rounded-2xl sticky bottom-4 right-4"
          : "w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl",
        "bg-[#D64B2A] text-white flex items-center justify-center",
        "shadow-[0_6px_20px_rgba(214,75,42,0.45)]",
        "hover:bg-[#c0392b] active:scale-95 border-none cursor-pointer",
      ].join(" ")}
      style={{
        transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)",
        transition: "transform 0.3s ease, background-color 0.2s ease",
      }}
      onClick={() => setMenuOpen((v) => !v)}
    >
      <Plus className={mobile ? "w-7 h-7" : "w-6 h-6 lg:w-7 lg:h-7"} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  UserDashboard
// ─────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const fabWrapRefMobile = useRef(null);
  const fabWrapRefDesktop = useRef(null);

  const user = auth.user;
  const logout = auth.logout;
  const loading = auth.loading;
  const isApproved = auth.isApproved;
  const isAdmin = auth.isStaff;

  const [filteredCounts, setFilteredCounts] = useState({
    referralGivenCount: 0,
    referralReceivedCount: 0,
    thankyouslipGivenCount: 0,
    thankyouslipReceivedCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const tabCacheRef = useRef({});

  const stats = useMemo(() => getStats(filteredCounts), [filteredCounts]);

  const [activeTab, setActiveTab] = useState("Current Week");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    if (!loading && user && !isApproved) {
      navigate("/pending-approval");
    }
  }, [loading, user, isApproved, navigate]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      const inMobile =
        fabWrapRefMobile.current && fabWrapRefMobile.current.contains(e.target);
      const inDesktop =
        fabWrapRefDesktop.current &&
        fabWrapRefDesktop.current.contains(e.target);
      if (!inMobile && !inDesktop) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  // Prefetch all 3 tabs in one request on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      const res = await apiGet("/users/dashboard-stats-all");
      if (cancelled) return;
      if (res.success) {
        tabCacheRef.current = { ...tabCacheRef.current, ...res.data };
        const initial = res.data[activeTab] || res.data["Current Week"];
        if (initial) setFilteredCounts(initial);
      }
      setStatsLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Serve cached tab instantly; fetch only for custom date range
  useEffect(() => {
    if (!user) return;

    if (dateRange) {
      const start = parseDateDisplay(dateRange.start);
      const end = parseDateDisplay(dateRange.end);
      if (!start || !end) return;
      let cancelled = false;
      setStatsLoading(true);
      (async () => {
        const res = await apiGet(
          `/users/dashboard-stats?startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}`
        );
        if (!cancelled && res.success) setFilteredCounts(res.data);
        if (!cancelled) setStatsLoading(false);
      })();
      return () => { cancelled = true; };
    }

    if (activeTab && tabCacheRef.current[activeTab]) {
      setFilteredCounts(tabCacheRef.current[activeTab]);
      setStatsLoading(false);
    }
  }, [activeTab, dateRange, user]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setDateRange(null);
  };

  const handleFilterClick = () => setShowRangePicker(true);

  const handleRangeConfirm = (range) => {
    setDateRange(range);
    setActiveTab(null);
  };

  const handleClearRange = () => {
    setDateRange(null);
    setActiveTab("Current Week");
  };

  const profileComplete = useMemo(() => {
    if (!user) return 0;
    let filled = 0;
    if (user.fullName) filled++;
    if (
      user.profileImage &&
      user.profileImage !== "/assets/myProfile.svg" &&
      user.profileImage !== DEFAULT_PROFILE_IMAGE
    )
      filled++;
    if (user.bannerImage) filled++;
    if (user.contactInformation?.website) filled++;
    if (user.contactInformation?.location) filled++;
    if (user.contactInformation?.nativePlace) filled++;
    if (user.businessInformation?.companyName) filled++;
    if (user.businessInformation?.brandName) filled++;
    if (user.businessInformation?.gstNo) filled++;
    if (user.businessInformation?.dateOfJoin) filled++;
    if (user.businessInformation?.profession) filled++;
    if (user.businessInformation?.aboutBusiness) filled++;
    if (user.otherInformation?.skill) filled++;
    if (user.otherInformation?.accomplishments) filled++;
    if (user.otherInformation?.interest) filled++;
    if (user.otherInformation?.networkCircle) filled++;
    if (user.otherInformation?.goals) filled++;
    if (user.otherInformation?.keywords) filled++;
    return Math.min(Math.round((filled / 18) * 100), 100);
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-[#F9EDE8] h-screen overflow-hidden">
      {/* Date Range Picker */}
      {showRangePicker && (
        <DatePicker
          mode="range"
          onConfirm={handleRangeConfirm}
          onClose={() => setShowRangePicker(false)}
        />
      )}

      {/* Drawer backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-300 transition-opacity duration-300
          ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-screen z-400 shadow-[4px_0_32px_rgba(0,0,0,0.10)]
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <ProfileDrawer
          onClose={closeDrawer}
          onLogout={handleLogout}
          user={user}
          isApproved={isApproved}
          isAdmin={isAdmin}
        />
      </div>

      {/* ══════════════════════════════
          MOBILE  < 768px
      ══════════════════════════════ */}
      <div className="md:hidden flex flex-col h-full overflow-y-auto">
        {/* Top Nav */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button
            onClick={openDrawer}
            className="p-1 border-none bg-transparent cursor-pointer"
          >
            <img
              src="/assets/logos/menu-02.svg"
              className="w-6 h-6"
              alt="menu"
            />
          </button>
          <img
            src="/assets/logos/BPVS Logo.svg"
            alt="BPVS"
            className="h-11 object-contain"
          />
          <button className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center cursor-pointer" onClick={() => navigate("/activity")}>
            <img
              src="/assets/logos/notification-bing.svg"
              className="w-5 h-5"
              alt="notifications"
            />
          </button>
        </div>

        {/* Profile row */}
        <div className="mx-4 mt-2 mb-3 flex items-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden ring-1 ring-[#D64B2A] shadow-sm shrink-0 bg-gray-200">
            <img
              src={getProfileImage(user?.profileImage)}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-700 leading-tight truncate">
              {user?.fullName || "User Name"}
            </p>
            <p className="text-[13px] font-medium text-gray-600 mt-0.5 truncate">
              {user?.businessInformation?.companyName ||
                user?.companyName ||
                "Company Name"}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">
              {user?.businessInformation?.profession ||
                user?.profession ||
                "Profession"}
            </p>
          </div>
          <button
            onClick={() => navigate("/edit-profile")}
            className="w-8 h-8 flex items-center justify-center shrink-0 border-none bg-transparent cursor-pointer"
          >
            <Pencil className="w-4.5 h-4.5" color="#C94621" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mx-4 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] text-gray-500">Profile Complete</span>
            <span className="text-[13px] font-semibold text-gray-500">
              {profileComplete}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${profileComplete}%`,
                background: "linear-gradient(to right, #C94621, #1F6EBD)",
              }}
            />
          </div>
        </div>

        {/* Dashboard card */}
        <div className="mt-3 mb-0 flex-1 bg-white rounded-t-2xl shadow-sm px-4 pt-4 pb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#111111]">
              My Dashboard
            </h2>
            <button
              onClick={handleFilterClick}
              className={`flex items-center rounded-lg gap-1.5 px-3 py-1.5 text-[18px] text-[#111111] font-bold transition cursor-pointer
                ${dateRange
                  ? "bg-[#F9EDE8] border-[#D64B2A] text-[#D64B2A]"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-[#F9EDE8] hover:text-[#D64B2A] hover:border-[#D64B2A]"
                }`}
            >
              <img
                src="/assets/logos/filter-horizontal.svg"
                className="w-4 h-4"
              />
              <span className="text-[13px] font-normal text-[#111111]">
                {dateRange ? "Filtered" : ""}
              </span>
            </button>
          </div>

          {dateRange && (
            <div className="flex items-center gap-2 bg-[#F9EDE8] rounded-xl px-3 py-2">
              <span className="text-[12px] font-semibold text-[#D64B2A] flex-1">
                {dateRange.start} → {dateRange.end}
              </span>
              <button
                onClick={handleClearRange}
                className="text-[#D64B2A] text-xs border-none bg-transparent cursor-pointer font-bold leading-none"
              >
                ✕
              </button>
            </div>
          )}

          {!dateRange && (
            <div className="flex items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-light transition-all cursor-pointer
                    ${activeTab === tab
                      ? "bg-[#C94621] text-white"
                      : "bg-[#C946211F] text-[#D64B2A] border-[#D64B2A]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-3 flex-1"
            style={{ gridAutoRows: "1fr" }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src={stat.img}
                    alt={stat.label}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                {statsLoading ? (
                  <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <p className="text-[26px] font-semibold text-gray-600 leading-none">
                    {stat.value}
                  </p>
                )}
                <p className="text-[11px] font-medium text-gray-500 text-center leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <FabMenu
            mobile
            wrapRef={fabWrapRefMobile}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            isApproved={isApproved}
            navigate={navigate}
          />
        </div>
      </div>

      {/* ══════════════════════════════
          TABLET + DESKTOP  ≥ 768px
          NO SCROLL — fits viewport height
      ══════════════════════════════ */}
      <div
        className="hidden md:flex flex-col h-full transition-all duration-300 ease-in-out"
        style={{
          transform: drawerOpen ? `translateX(${DRAWER_W})` : "translateX(0)",
        }}
      >
        {/* Header */}
        <header className="shrink-0 z-100 bg-white border-b border-gray-100 shadow-sm transition-all duration-300 ease-in-out px-5 md:px-8 lg:px-12 xl:px-16 h-14 md:h-16 lg:h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={openDrawer}
              className="p-2 rounded-xl hover:bg-[#F9EDE8] transition cursor-pointer border-none bg-transparent"
            >
              <img
                src="/assets/logos/menu-02.svg"
                className="w-5 h-5 lg:w-6 lg:h-6"
                alt="menu"
              />
            </button>
            <img
              src="/assets/logos/BPVS Logo.svg"
              alt="BPVS"
              className="h-9 md:h-10 lg:h-12 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <button className="relative w-9 h-9 md:w-10 md:h-8 lg:w-11 lg:h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-[#F9EDE8] hover:border-[#D64B2A] transition cursor-pointer" onClick={() => navigate("/activity")}>
              <img
                src="/assets/logos/notification-bing.svg"
                className="w-5 h-5"
                alt="notifications"
              />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#D64B2A] rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Main — flex container, NO overflow, children shrink to fit */}
        <main className="flex-1 min-h-0 flex flex-col gap-3 lg:gap-4 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pt-2 pb-3 md:pb-4">
          {/* Profile card — fixed (shrink-0), tighter paddings */}
          <div className="shrink-0 bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 p-3 md:p-4 lg:p-5 xl:p-6 flex flex-row items-center gap-3 md:gap-4 lg:gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 rounded-full bg-[#F9EDE8] opacity-70 pointer-events-none w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64" />
            <div className="shrink-0 relative z-10 w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-xl overflow-hidden ring-2 ring-[#D64B2A] shadow-md bg-gray-200">
              <img
                src={getProfileImage(user?.profileImage)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h2 className="font-semibold text-[#111111] leading-tight text-base md:text-lg lg:text-xl xl:text-2xl truncate">
                {user?.fullName || "User Name"}
              </h2>
              <p className="font-medium text-[#111111] mt-0.5 text-xs md:text-sm lg:text-base truncate">
                {user?.businessInformation?.companyName ||
                  user?.companyName ||
                  "Company Name"}
              </p>
              <p className="text-gray-400 mt-0.5 text-[11px] md:text-xs lg:text-sm truncate">
                {user?.businessInformation?.profession ||
                  user?.profession ||
                  "Profession"}
              </p>
              <div className="mt-2 max-w-xl">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] md:text-[12px] text-gray-500">
                    Profile Complete
                  </span>
                  <span className="text-[11px] md:text-[12px] font-semibold text-gray-600">
                    {profileComplete}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full overflow-hidden h-1.5 md:h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${profileComplete}%`,
                      background: "linear-gradient(to right, #C94621, #1F6EBD)",
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/edit-profile")}
              className="relative z-10 flex items-center gap-2 shrink-0 px-3 py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-2.5 rounded-xl bg-[#F9EDE8] text-[#D64B2A] border border-[#D64B2A]/20 text-xs md:text-sm font-semibold hover:bg-[#D64B2A] hover:text-white transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </button>
          </div>

          {/* Dashboard card — flex-1 + min-h-0 absorbs remaining height */}
          <div className="relative flex-1 min-h-0 bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 px-4 md:px-5 lg:px-6 xl:px-8 pt-3 md:pt-4 lg:pt-5 pb-3 md:pb-4 flex flex-col gap-2 md:gap-3 lg:gap-4">
            {/* Dashboard header */}
            <div className="shrink-0 flex items-center justify-between">
              <h2 className="font-medium text-[#111111] text-base md:text-lg">
                My Dashboard
              </h2>

              <button
                onClick={handleFilterClick}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 lg:px-5 lg:py-1.5 rounded-xl border font-medium text-sm lg:text-base transition cursor-pointer
                  ${dateRange
                    ? "bg-[#F9EDE8] border-[#D64B2A] text-[#D64B2A]"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-[#F9EDE8] hover:text-[#D64B2A] hover:border-[#D64B2A]"
                  }`}
              >
                <img
                  src="/assets/logos/filter-horizontal.svg"
                  className="w-4 h-4 lg:w-5 lg:h-5"
                />
                <span className="hidden sm:inline">
                  {dateRange ? "Filtered" : "Filter"}
                </span>
              </button>
            </div>

            {/* Active date range chip */}
            {dateRange && (
              <div className="shrink-0 flex items-center gap-3 bg-[#F9EDE8] rounded-xl px-4 py-2 w-fit">
                <span className="text-[13px] md:text-sm font-semibold text-[#D64B2A]">
                  {dateRange.start} → {dateRange.end}
                </span>
                <button
                  onClick={handleClearRange}
                  className="text-[#D64B2A] text-xs border-none bg-transparent cursor-pointer font-bold leading-none hover:opacity-70 transition"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tabs */}
            {!dateRange && (
              <div className="shrink-0 flex gap-2 lg:gap-3">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={[
                      "px-4 py-1.5 md:px-5 md:py-2 lg:px-6 lg:py-2.5",
                      "rounded-full font-semibold border transition-all duration-200 cursor-pointer",
                      "text-sm lg:text-base",
                      activeTab === tab
                        ? "bg-[#D64B2A] text-white border-[#D64B2A] shadow-[0_4px_12px_rgba(214,75,42,0.25)]"
                        : "bg-white text-[#D64B2A] border-[#D64B2A] hover:bg-[#F9EDE8]",
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Stats grid — uses vh-based clamps so it scales with viewport HEIGHT */}
            <div
              className="flex-1 min-h-0 grid grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4"
              style={{ gridAutoRows: "1fr" }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-h-0 border border-gray-100 rounded-xl lg:rounded-2xl bg-white flex flex-col items-center justify-center text-center p-2 md:p-3 lg:p-4 gap-1 md:gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default overflow-hidden"
                >
                  <div className="bg-transparent rounded-xl flex items-center justify-center shrink-0 w-[clamp(40px,min(8vh,7vw),110px)] h-[clamp(40px,min(8vh,7vw),110px)]">
                    <img
                      src={stat.img}
                      alt={stat.label}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  {statsLoading ? (
                    <div
                      className="bg-gray-200 rounded animate-pulse"
                      style={{ height: "clamp(1.1rem, 2.8vh, 2.25rem)", width: "2.5rem" }}
                    />
                  ) : (
                    <p
                      className="font-semibold text-gray-800 leading-none"
                      style={{ fontSize: "clamp(1.1rem, 2.8vh, 2.25rem)" }}
                    >
                      {stat.value}
                    </p>
                  )}
                  <p
                    className="font-medium text-gray-600 leading-tight px-1"
                    style={{ fontSize: "clamp(9px, 1.3vh, 13px)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <FabMenu
              wrapRef={fabWrapRefDesktop}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              isApproved={isApproved}
              navigate={navigate}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
