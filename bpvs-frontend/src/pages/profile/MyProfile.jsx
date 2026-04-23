import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getProfileImage } from "../../components/ui/RoleBadge";
import LoadingScreen from "../../components/ui/LoadingScreen";

// ── Info nav cards ── //
const INFO_CARDS = [
  {
    to: "/edit-profile",
    icon: "/assets/logos/elements.svg",
    label: "Personal Information",
  },
  {
    to: "/contact-info",
    icon: "/assets/logos/call.svg",
    label: "Contact Information",
  },
  {
    to: "/business-info",
    icon: "/assets/logos/briefcase-01.svg",
    label: "Business Information",
  },
  {
    to: "/other-info",
    icon: "/assets/logos/information-circle.svg",
    label: "Other Information",
  },
];

export default function MyProfile() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth.user;
  const loading = auth.loading;

  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) return null;

  const companyName = user?.businessInformation?.companyName || "Company Name";
  const profession = user?.businessInformation?.profession || "Profession";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ══════════════════════════════════════════════════
          MOBILE  (< md)  — original layout, untouched
      ══════════════════════════════════════════════════ */}
      <div className="md:hidden bg-white min-h-screen">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 px-5 py-3.5 flex items-center shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full hover:bg-stone-100 text-[#1B3A5C] text-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-slate-800 pr-9">
            My Profile
          </h1>
        </nav>

        {/* Banner */}
        <div className="relative w-full">
          <div className="h-40 sm:h-48 w-full overflow-hidden bg-linear-to-b from-[#F9EDE8] to-white">
            <img
              src="/assets/logos/bvps-logo.svg"
              alt="banner"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          {/* commented things which should not remove */}
          {/* <button className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow text-[#C94621]">
            <Pencil className="w-4 h-4" />
          </button> */}
        </div>

        {/* Profile section */}
        <div className="px-5 pb-10 relative z-10">
          <div className="relative w-fit">
            <img
              src={getProfileImage(user?.profileImage)}
              alt="profile"
              className="w-28 h-28 rounded-full ring-2 ring-[#C94621] object-cover shadow-xl"
            />
            {/* commented things which should not remove */}
            {/* <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full text-[#C94621] shadow">
              <Pencil className="w-4 h-4" />
            </button> */}
          </div>
          <div className="mt-3 text-left">
            <h2 className="text-[18px] font-bold text-gray-900 leading-tight">
              {user?.fullName || "User Name"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{companyName}</p>
          </div>

          {/* Info cards */}
          <div className="mt-8 flex flex-col gap-3">
            {INFO_CARDS.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className="w-full flex items-center justify-between px-4 py-2 bg-[#fdf8f5] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <img src={icon} className="w-5 h-5" alt={label} />
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {label}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DESKTOP  (≥ md)  — matches UserDashboard structure
      ══════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col min-h-screen">
        {/* ── Sticky header — same as UserDashboard ── */}
        <header
          className="
          sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm
          px-5 md:px-8 lg:px-12 xl:px-16
          h-14 md:h-16 lg:h-18
          flex items-center justify-between
        "
        >
          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-[#F9EDE8] transition cursor-pointer border-none bg-transparent text-gray-700"
            >
              <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            <span className="text-base lg:text-lg font-bold text-gray-900">
              My Profile
            </span>
          </div>
        </header>

        {/* ── Scrollable main — same padding rhythm as UserDashboard ── */}
        <main
          className="
          flex-1 overflow-y-auto
          px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24
          py-5 md:py-6 lg:py-8 xl:py-10
        "
        >
          {/* ── Profile card — mirrors UserDashboard profile card exactly ── */}
          <div
            className="
            bg-white
            rounded-2xl lg:rounded-3xl
            shadow-sm border border-gray-100
            p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12
            flex flex-col md:flex-row items-start md:items-center
            gap-4 md:gap-6 lg:gap-8 xl:gap-10
            mb-5 md:mb-6 lg:mb-8
            relative overflow-hidden
          "
          >
            {/* Decorative circle */}
            <div
              className="
              absolute -top-12 -right-12 rounded-full bg-[#F9EDE8] opacity-70 pointer-events-none
              w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 xl:w-80 xl:h-80
            "
            />

            {/* Avatar */}
            <div
              className="
              shrink-0 relative z-10
              w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-36 xl:h-36 2xl:w-40 2xl:h-40
              rounded-xl overflow-hidden
              ring-2 ring-[#D64B2A] shadow-md bg-gray-200
            "
            >
              <img
                src={getProfileImage(user?.profileImage)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 relative z-10">
              <h2
                className="font-bold text-gray-900 leading-tight
                text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl"
              >
                {user?.fullName || "User Name"}
              </h2>
              <p
                className="text-gray-700 font-semibold mt-1
                text-sm md:text-base lg:text-lg xl:text-xl"
              >
                {companyName}
              </p>
              <p
                className="text-gray-400 mt-0.5
                text-xs md:text-sm lg:text-base xl:text-lg"
              >
                {profession}
              </p>
            </div>
          </div>

          {/* ── Info cards — inside a dashboard-style card ── */}
          <div
            className="
            bg-white
            rounded-2xl lg:rounded-3xl
            shadow-sm border border-gray-100
            px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12
            pt-4 md:pt-6 lg:pt-8
            pb-6 md:pb-8 lg:pb-10
            flex flex-col gap-4 md:gap-5
          "
          >
            <h2
              className="font-bold text-gray-900
              text-base md:text-lg lg:text-xl xl:text-2xl"
            >
              Profile Sections
            </h2>

            {/*
              Mobile-style card list on md,
              3-column grid on lg+
            */}
            <div
              className="
              flex flex-col gap-3
              lg:grid lg:grid-cols-3 lg:gap-5
            "
            >
              {INFO_CARDS.map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="
                    flex items-center justify-between
                    px-4 py-4 lg:py-5
                    bg-[#FDF8F5] rounded-xl lg:rounded-2xl
                    border border-transparent
                    hover:border-orange-100 hover:-translate-y-0.5 hover:shadow-sm
                    transition-all duration-200 group
                  "
                >
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div
                      className="
                      w-10 h-10 lg:w-12 lg:h-12
                      rounded-full lg:rounded-xl
                      bg-orange-50
                      flex items-center justify-center shrink-0
                    "
                    >
                      <img
                        src={icon}
                        className="w-5 h-5 lg:w-6 lg:h-6"
                        alt={label}
                      />
                    </div>
                    <span className="text-sm lg:text-base font-medium text-slate-800">
                      {label}
                    </span>
                  </div>
                  <ChevronRight
                    className="
                    w-5 h-5 text-slate-300
                    group-hover:text-[#C94621] transition-colors shrink-0
                  "
                  />
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
