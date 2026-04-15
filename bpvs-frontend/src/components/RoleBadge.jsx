export const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";

/**
 * Returns the profile image URL, falling back to the default.
 * Handles Cloudinary URLs, base64, and local asset paths.
 */
export const getBannerImageDisplay = (bannerImage) => {
  if (!bannerImage) return DEFAULT_PROFILE_IMAGE;
  if (
    bannerImage === "/assets/BPVS Logo.svg" ||
    bannerImage === "BPVS Logo.svg"
  )
    return DEFAULT_PROFILE_IMAGE;
  return bannerImage;
};

export const getProfileImageDisplay = (profileImage) => {
  if (!profileImage) return DEFAULT_PROFILE_IMAGE;
  if (
    profileImage === "/assets/myProfile.svg" ||
    profileImage === "myProfile.svg"
  )
    return DEFAULT_PROFILE_IMAGE;
  return profileImage;
};

// Aliases for backward compatibility
export const getProfileImage = getProfileImageDisplay;
export const getBannerImage = getBannerImageDisplay;

export const RoleBadge = ({ label }) => (
  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide border border-[#C94621]/30 text-[#C94621] bg-[#FEF8F6] shrink-0">
    {label}
  </span>
);

export const StatusPill = ({ status, isApproved, variant = "approval" }) => {
  // For "active-inactive" variant used in Manage Members view
  if (variant === "active-inactive") {
    const isActive = status === "active";
    return (
      <span
        className={`
        inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold
        ${
          isActive
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-500 border border-red-200"
        }
      `}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  }

  // Default: approval variant for Pending Approvals view
  // Pending approval (isApproved is null)
  if (isApproved === null || isApproved === undefined) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Pending
      </span>
    );
  }

  // Approved or Rejected
  if (isApproved === true) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-green-50 text-green-700 border border-green-200">
        Approved
      </span>
    );
  }

  if (isApproved === false) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-red-50 text-red-500 border border-red-200">
        Rejected
      </span>
    );
  }

  // Fallback to status-based display
  return (
    <span
      className={`
      inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold
      ${
        status === "active"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-500 border border-red-200"
      }
    `}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
};

export default RoleBadge;
