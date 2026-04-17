import { Pencil } from "lucide-react";
import {
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import FabMenu from "../components/FabMenu";
import ProfileDrawer from "../components/ProfileDrawer";
import StatsCard from "../components/StatsCard";
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
const TABS = ["Current Week", "Last Week", "Month"];

const getStatsConfig = (counts) => [
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

// ─────────────────────────────────────────────────────────────
//  Sub-Components (Memoized)
// ─────────────────────────────────────────────────────────────

const ProfileProgress = memo(({ progress }) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[13px] text-gray-500">Profile Complete</span>
      <span className="text-[13px] font-semibold text-gray-500">{progress}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(to right, #C94621, #1F6EBD)",
        }}
      />
    </div>
  </div>
));
ProfileProgress.displayName = "ProfileProgress";

const UserDashboard = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const fabWrapRefMobile = useRef(null);
  const fabWrapRefDesktop = useRef(null);

  const { user, logout, loading, isApproved, isStaff: isAdmin } = auth;

  const [filteredCounts, setFilteredCounts] = useState({
    referralGivenCount: 0,
    referralReceivedCount: 0,
    thankyouslipGivenCount: 0,
    thankyouslipReceivedCount: 0,
    b2bCount: 0,
    visitorCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const tabCacheRef = useRef({});

  const stats = useMemo(() => getStatsConfig(filteredCounts), [filteredCounts]);

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

  // Click outside handler for FabMenu
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      const inMobile = fabWrapRefMobile.current?.contains(e.target);
      const inDesktop = fabWrapRefDesktop.current?.contains(e.target);
      if (!inMobile && !inDesktop) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  // Consolidated Data Fetching
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadData = async () => {
      // Priority 1: Custom Date Range
      if (dateRange) {
        const start = parseDateDisplay(dateRange.start);
        const end = parseDateDisplay(dateRange.end);
        if (!start || !end) return;

        setStatsLoading(true);
        const res = await apiGet(
          `/users/dashboard-stats?startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}`
        );
        if (!cancelled && res.success) {
          setFilteredCounts(res.data);
          setStatsLoading(false);
        }
        return;
      }

      // Priority 2: Use Cache if available
      if (activeTab && tabCacheRef.current[activeTab]) {
        setFilteredCounts(tabCacheRef.current[activeTab]);
        setStatsLoading(false);
        return;
      }

      // Priority 3: Fetch all (Initial/Prefetch)
      setStatsLoading(true);
      const res = await apiGet("/users/dashboard-stats-all");
      if (!cancelled && res.success) {
        tabCacheRef.current = { ...tabCacheRef.current, ...res.data };
        const data = res.data[activeTab] || res.data["Current Week"];
        if (data) setFilteredCounts(data);
        setStatsLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [user, activeTab, dateRange]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    setDateRange(null);
  }, []);

  const handleFilterClick = useCallback(() => setShowRangePicker(true), []);

  const handleRangeConfirm = useCallback((range) => {
    setDateRange(range);
    setActiveTab(null);
    setShowRangePicker(false);
  }, []);

  const handleClearRange = useCallback(() => {
    setDateRange(null);
    setActiveTab("Current Week");
  }, []);

  const profileComplete = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.fullName,
      (user.profileImage && user.profileImage !== "/assets/myProfile.svg" && user.profileImage !== DEFAULT_PROFILE_IMAGE),
      user.bannerImage,
      user.contactInformation?.website,
      user.contactInformation?.location,
      user.contactInformation?.nativePlace,
      user.businessInformation?.companyName,
      user.businessInformation?.brandName,
      user.businessInformation?.gstNo,
      user.businessInformation?.dateOfJoin,
      user.businessInformation?.profession,
      user.businessInformation?.aboutBusiness,
      user.otherInformation?.skill,
      user.otherInformation?.accomplishments,
      user.otherInformation?.interest,
      user.otherInformation?.networkCircle,
      user.otherInformation?.goals,
      user.otherInformation?.keywords,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.min(Math.round((filled / fields.length) * 100), 100);
  }, [user]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-[#F9EDE8] h-screen overflow-hidden">
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
          MOBILE VIEW
      ══════════════════════════════ */}
      <div className="md:hidden flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button onClick={openDrawer} className="p-1 border-none bg-transparent cursor-pointer">
            <img src="/assets/logos/menu-02.svg" className="w-6 h-6" alt="menu" />
          </button>
          <img src="/assets/logos/BPVS Logo.svg" alt="BPVS" className="h-11 object-contain" />
          <button className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center cursor-pointer" onClick={() => navigate("/activity")}>
            <img src="/assets/logos/notification-bing.svg" className="w-5 h-5" alt="notifications" />
          </button>
        </div>

        <div className="mx-4 mt-2 mb-3 flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-[#D64B2A] shadow-sm shrink-0 bg-gray-200">
            <img src={getProfileImage(user?.profileImage)} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-700 leading-tight truncate">{user?.fullName || "User Name"}</p>
            <p className="text-[13px] font-medium text-gray-600 mt-0.5 truncate">{user?.businessInformation?.companyName || user?.companyName || "Company Name"}</p>
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">{user?.businessInformation?.profession || user?.profession || "Profession"}</p>
          </div>
          <button onClick={() => navigate("/edit-profile")} className="w-8 h-8 flex items-center justify-center shrink-0 border-none bg-transparent cursor-pointer">
            <Pencil className="w-4.5 h-4.5" color="#C94621" />
          </button>
        </div>

        <div className="mx-4 mb-2">
          <ProfileProgress progress={profileComplete} />
        </div>

        <div className="mt-3 mb-0 flex-1 bg-white rounded-t-2xl shadow-sm px-4 pt-4 pb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#111111]">My Dashboard</h2>
            <button
              onClick={handleFilterClick}
              className={`flex items-center rounded-lg gap-1.5 px-3 py-1.5 text-[18px] text-[#111111] font-bold transition cursor-pointer
                ${dateRange ? "bg-[#F9EDE8] border-[#D64B2A] text-[#D64B2A]" : "border-gray-200 bg-white text-gray-500"}`}
            >
              <img src="/assets/logos/filter-horizontal.svg" className="w-5 h-5" alt="filter" />
              <span className="text-[13px] font-normal text-[#111111]">{dateRange ? "Filtered" : ""}</span>
            </button>
          </div>

          {dateRange ? (
            <div className="flex items-center gap-2 bg-[#F9EDE8] rounded-xl px-3 py-2">
              <span className="text-[12px] font-semibold text-[#D64B2A] flex-1">{dateRange.start} → {dateRange.end}</span>
              <button onClick={handleClearRange} className="text-[#D64B2A] text-xs border-none bg-transparent cursor-pointer font-bold">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-light transition-all cursor-pointer
                    ${activeTab === tab ? "bg-[#C94621] text-white" : "bg-[#C946211F] text-[#D64B2A]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 flex-1" style={{ gridAutoRows: "1fr" }}>
            {stats.map((stat) => (
              <StatsCard
                key={stat.label}
                {...stat}
                loading={statsLoading}
              />
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
          DESKTOP VIEW
      ══════════════════════════════ */}
      <div
        className="hidden md:flex flex-col h-full transition-all duration-300 ease-in-out"
        style={{ transform: drawerOpen ? `translateX(${DRAWER_W})` : "translateX(0)" }}
      >
        <header className="shrink-0 z-100 bg-white border-b border-gray-100 shadow-sm px-5 md:px-8 lg:px-12 xl:px-16 h-14 md:h-16 lg:h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <button onClick={openDrawer} className="p-2 rounded-xl hover:bg-[#F9EDE8] transition cursor-pointer border-none bg-transparent">
              <img src="/assets/logos/menu-02.svg" className="w-5 h-5 lg:w-6 lg:h-6" alt="menu" />
            </button>
            <img src="/assets/logos/BPVS Logo.svg" alt="BPVS" className="h-9 md:h-10 lg:h-12 object-contain" />
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <button className="relative w-9 h-9 md:w-11 md:h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-[#F9EDE8] transition cursor-pointer" onClick={() => navigate("/activity")}>
              <img src="/assets/logos/notification-bing.svg" className="w-5 h-5" alt="notifications" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#D64B2A] rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col gap-3 lg:gap-4 px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pt-2 pb-3 md:pb-4">
          <div className="shrink-0 bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 p-3 md:p-4 lg:p-5 xl:p-6 flex flex-row items-center gap-3 md:gap-4 lg:gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 rounded-full bg-[#F9EDE8] opacity-70 pointer-events-none w-40 h-40 md:w-64 md:h-64" />
            <div className="shrink-0 relative z-10 w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden ring-2 ring-[#D64B2A] shadow-md bg-gray-200">
              <img src={getProfileImage(user?.profileImage)} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h2 className="font-semibold text-[#111111] leading-tight text-base md:text-lg lg:text-xl xl:text-2xl truncate">{user?.fullName || "User Name"}</h2>
              <p className="font-medium text-[#111111] mt-0.5 text-xs md:text-sm lg:text-base truncate">{user?.businessInformation?.companyName || user?.companyName || "Company Name"}</p>
              <p className="text-gray-400 mt-0.5 text-[11px] md:text-xs lg:text-sm truncate">{user?.businessInformation?.profession || user?.profession || "Profession"}</p>
              <div className="mt-2 max-w-xl">
                <ProfileProgress progress={profileComplete} />
              </div>
            </div>
            <button onClick={() => navigate("/edit-profile")} className="relative z-10 flex items-center gap-2 shrink-0 px-3 py-2 md:px-5 md:py-2.5 rounded-xl bg-[#F9EDE8] text-[#D64B2A] border border-[#D64B2A]/20 text-xs md:text-sm font-semibold hover:bg-[#D64B2A] hover:text-white transition-all cursor-pointer">
              <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </button>
          </div>

          <div className="relative flex-1 min-h-0 bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 px-4 md:px-6 xl:px-8 pt-3 md:pt-4 pb-3 flex flex-col gap-2 md:gap-3 lg:gap-4">
            <div className="shrink-0 flex items-center justify-between">
              <h2 className="font-medium text-[#111111] text-base md:text-lg">My Dashboard</h2>
              <button
                onClick={handleFilterClick}
                className={`flex items-center gap-2 px-3 py-2 lg:px-5 lg:py-1.5 rounded-xl border font-medium text-sm lg:text-base transition cursor-pointer
                  ${dateRange ? "bg-[#F9EDE8] border-[#D64B2A] text-[#D64B2A]" : "border-gray-200 bg-white text-gray-500"}`}
              >
                <img src="/assets/logos/filter-horizontal.svg" className="w-4 h-4 lg:w-5 lg:h-5" alt="filter" />
                <span className="hidden sm:inline">{dateRange ? "Filtered" : "Filter"}</span>
              </button>
            </div>

            {dateRange ? (
              <div className="shrink-0 flex items-center gap-3 bg-[#F9EDE8] rounded-xl px-4 py-2 w-fit">
                <span className="text-[13px] md:text-sm font-semibold text-[#D64B2A]">{dateRange.start} → {dateRange.end}</span>
                <button onClick={handleClearRange} className="text-[#D64B2A] text-xs border-none bg-transparent cursor-pointer font-bold hover:opacity-70 transition">✕</button>
              </div>
            ) : (
              <div className="shrink-0 flex gap-2 lg:gap-3">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`px-4 py-1.5 lg:px-6 lg:py-2.5 rounded-full font-semibold border transition-all duration-200 cursor-pointer text-sm lg:text-base
                      ${activeTab === tab ? "bg-[#D64B2A] text-white border-[#D64B2A] shadow-md" : "bg-white text-[#D64B2A] border-[#D64B2A] hover:bg-[#F9EDE8]"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 grid grid-cols-3 xl:grid-cols-6 gap-2 md:gap-4" style={{ gridAutoRows: "1fr" }}>
              {stats.map((stat) => (
                <StatsCard
                  key={stat.label}
                  {...stat}
                  loading={statsLoading}
                />
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

