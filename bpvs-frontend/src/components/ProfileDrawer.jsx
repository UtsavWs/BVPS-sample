import { memo } from "react";
import { User, Users, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { getProfileImage } from "./RoleBadge";

const MenuItem = memo(({ icon, label, active = false }) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
      active ? "bg-[#FBEBE7] text-[#D64B2A]" : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <span className={active ? "text-[#D64B2A]" : "text-gray-500"}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
));

MenuItem.displayName = "MenuItem";

const ProfileDrawer = memo(({ onClose, onLogout, user, isApproved = true, isAdmin = false }) => {
  return (
    <>
      <div className="flex flex-col w-75 md:w-80 h-full bg-white">
        {/* Header: Logo + Close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <img
            src="/assets/logos/BPVS Logo.svg"
            alt="BPVS"
            className="h-10 object-contain"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3.5 px-5 py-3">
          <img
            src={getProfileImage(user?.profileImage)}
            alt="Profile"
            className="w-14 h-14 rounded-xl ring-1 ring-[#D64B2A] object-cover flexshrink-0 border border-gray-200"
          />
          <div>
            <p className="text-sm font-medium text-[#111111] leading-snug">
              {user?.fullName || "User Name"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.email || "Email"}
            </p>
          </div>
        </div>

        <hr className="border-gray-100 mb-4" />

        {/* Main Menu Label */}
        <p className="text-sm font-bold text-gray-900 px-5 mb-2">Main Menu</p>

        {/* Menu Items */}
        <nav className="px-3 flex flex-col gap-0.5">
          <Link to="/my-profile">
            <MenuItem icon={<User size={18} />} label="My Profile" active />
          </Link>
          {isApproved && (
            <Link to="/members">
              <MenuItem icon={<Users size={18} />} label="BPVS Members" />
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin">
              <MenuItem icon={<Shield size={18} />} label="Admin Panel" />
            </Link>
          )}
          <Link to="/settings">
            <MenuItem icon={<Settings size={18} />} label="Settings" />
          </Link>
        </nav>

        <div className="flex-1" />

        {/* Logout */}
        <div className="px-4 pb-2.5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition bg-[#FBEBE7] text-[#D64B2A]"
          >
            <span className="text-[#D64B2A]">
              <img
                src="/assets/logos/logout-04.svg"
                alt="Logout"
                className="h-4.5 w-4.5"
              />
            </span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {/* Version */}
        <a className="text-center text-[11px] text-gray-400 pb-4">
          Current Version 1.0.0
        </a>
      </div>
    </>
  );
});

ProfileDrawer.displayName = "ProfileDrawer";

export default ProfileDrawer;

