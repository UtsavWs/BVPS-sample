import React, { useContext } from "react";
import { ArrowLeft, ChevronRight, Info, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Settings = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const settingsItems = [
    {
      key: "reset-password",
      label: "Reset Password",
      icon: Lock,
      route: "/reset-password",
    },
    {
      key: "about-us",
      label: "About Us",
      icon: Info,
      route: "/about-us",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9EDE8] flex items-center justify-center">
        <div className="text-[#C1512D] text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 lg:flex lg:items-start lg:justify-center lg:pt-12">
      <div
        className="
          relative w-full
          lg:max-w-2xl lg:mx-auto
          lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:bg-white lg:overflow-hidden
        "
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-center relative px-4 py-4 lg:px-10 lg:py-6 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 lg:left-10 p-1 text-gray-900"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-bold text-gray-900 lg:text-xl">
            Settings
          </h1>
        </div>

        {/* ── Settings Items ── */}
        <div className="px-4 pt-5 pb-8 flex flex-col gap-3 lg:px-10 lg:pt-8 lg:pb-10 lg:gap-4">
          {settingsItems.map(({ key, label, icon: Icon, route }) => (
            <button
              key={key}
              onClick={() => navigate(route)}
              className="
                w-full flex items-center justify-between
                px-4 py-2.5
                bg-[#FDF8F5]
                rounded-2xl
                border border-transparent
                hover:border-orange-100
                active:scale-[0.99]
                transition-all duration-150
                group
              "
            >
              {/* Left — icon + label */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className="text-[#C94621]"
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 lg:text-base">
                  {label}
                </span>
              </div>

              {/* Right — chevron */}
              <ChevronRight
                size={17}
                strokeWidth={2}
                className="text-gray-400 group-hover:text-[#C94621] transition-colors shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
