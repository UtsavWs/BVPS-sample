import { ArrowLeft, Camera, Upload, Trash2, ImagePlus } from "lucide-react";
import FabButton from "../../components/ui/FabButton";
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import InputFields from "../../components/forms/InputFields";
import DatePicker from "../../components/forms/DatePicker";
import { apiGet, apiPut } from "../../api/api";
import { formatDate, parseDateDisplay } from "../../utils/dateUtils";
import { uploadToCloudinary } from "../../utils/cloudinary";
import LoadingScreen from "../../components/ui/LoadingScreen";
import {
  getProfileImageDisplay,
  getBannerImageDisplay,
} from "../../components/ui/RoleBadge";

const DEFAULT_BANNER_IMAGE = "/assets/logos/bvps-logo.svg";

const INITIAL_DATA = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  profileImage: "",
  bannerImage: "",
};

const isLocalDefault = (url) => {
  if (!url) return true;
  return url.startsWith("/src/assets") || url.startsWith("/assets");
};

const formatFromBackend = (user) => {
  if (!user) return INITIAL_DATA;
  return {
    fullName: user.fullName || "",
    dateOfBirth: formatDate(user.dateOfBirth, ""),
    gender: user.gender || "",
    profileImage: isLocalDefault(user.profileImage) ? "" : user.profileImage,
    bannerImage: isLocalDefault(user.bannerImage) ? "" : user.bannerImage,
  };
};

const formatToBackend = (formData) => {
  const isBase64 = (url) => url && url.startsWith("data:");
  const data = {};

  if (formData.fullName && formData.fullName.trim().length >= 2) {
    data.fullName = formData.fullName.trim();
  }

  const parsedDate = parseDateDisplay(formData.dateOfBirth);
  if (parsedDate) {
    data.dateOfBirth = parsedDate;
  }

  if (formData.gender) {
    data.gender = formData.gender;
  }

  if (!isBase64(formData.profileImage)) {
    data.profileImage = formData.profileImage;
  }

  if (!isBase64(formData.bannerImage)) {
    data.bannerImage = formData.bannerImage;
  }

  return data;
};

export default function EditProfile() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const loading = auth?.loading;
  const updateUser = auth?.updateUser;

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(INITIAL_DATA);
  const [form, setForm] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Drawer state: null | "profile" | "banner"
  const [photoDrawer, setPhotoDrawer] = useState(null);

  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [profileFile, setProfileFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [profileUploading, setProfileUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const isUploading = profileUploading || bannerUploading;

  useEffect(() => {
    const fetchProfileData = async () => {
      // Defensive check: Don't fetch if still loading auth or if user is missing
      if (loading || !user) return;
      try {
        setIsLoading(true);
        const res = await apiGet("/users/profile");
        if (res.success && res.data.user) {
          const formatted = formatFromBackend(res.data.user);
          setSaved(formatted);
          setForm(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!loading && user) fetchProfileData();
  }, [user?._id, loading]); // Added loading to dependencies

  const set = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Abort ongoing uploads on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!user) return;

    if (isUploading) {
      alert("Please wait for images to finish uploading.");
      return;
    }

    try {
      setIsSaving(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      let updatedForm = { ...form };

      // Upload profile image if a new file was selected
      if (profileFile) {
        setProfileUploading(true);
        try {
          const url = await uploadToCloudinary(profileFile, { folder: "bpvs/profiles", signal });
          updatedForm.profileImage = url;
          setProfileFile(null);
          setProfilePreview(null);
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Failed to upload profile image:", err);
          alert("Failed to upload profile image. Please try again.");
          setIsSaving(false);
          setProfileUploading(false);
          return;
        }
        setProfileUploading(false);
      }

      // Upload banner image if a new file was selected
      if (bannerFile) {
        setBannerUploading(true);
        try {
          const url = await uploadToCloudinary(bannerFile, { folder: "bpvs/banners", signal });
          updatedForm.bannerImage = url;
          setBannerFile(null);
          setBannerPreview(null);
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Failed to upload banner image:", err);
          alert("Failed to upload banner image. Please try again.");
          setIsSaving(false);
          setBannerUploading(false);
          return;
        }
        setBannerUploading(false);
      }

      const dataToSend = formatToBackend(updatedForm);
      const res = await updateUser(dataToSend);

      if (res.success) {
        const formatted = formatFromBackend(res.user);
        setSaved(formatted);
        setForm(formatted);

        setProfilePreview(null);
        setBannerPreview(null);
        setProfileFile(null);
        setBannerFile(null);
        setIsEditing(false);
      } else {
        alert(res.message || "Failed to save profile");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    setForm(saved);
    setProfilePreview(null);
    setBannerPreview(null);
    setProfileFile(null);
    setBannerFile(null);
    setProfileUploading(false);
    setBannerUploading(false);
    setIsEditing(false);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setForm((prev) => ({ ...prev, profileImage: "" }));
    setProfilePreview(null);
    setProfileFile(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
    setPhotoDrawer(null);
  };

  const handleRemoveBannerImage = () => {
    setForm((prev) => ({ ...prev, bannerImage: "" }));
    setBannerPreview(null);
    setBannerFile(null);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    setPhotoDrawer(null);
  };

  // Drawer action: trigger upload, then close drawer
  const handleUploadClick = () => {
    if (photoDrawer === "profile") {
      profileInputRef.current?.click();
    } else if (photoDrawer === "banner") {
      bannerInputRef.current?.click();
    }
    setPhotoDrawer(null);
  };

  const handleRemoveClick = () => {
    if (photoDrawer === "profile") {
      handleRemoveProfileImage();
    } else if (photoDrawer === "banner") {
      handleRemoveBannerImage();
    }
  };

  // Whether the currently-targeted image actually has a photo to remove
  const drawerHasPhoto =
    photoDrawer === "profile"
      ? !!(profilePreview || form.profileImage)
      : photoDrawer === "banner"
        ? !!(bannerPreview || form.bannerImage)
        : false;

  if (isLoading) {
    return <LoadingScreen bg="bg-stone-50" />;
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 md:flex md:items-center md:justify-center lg:bg-gray-50 lg:flex lg:items-center lg:justify-center">
      <div
        className="
          relative w-full
          sm:max-w-2xl sm:mx-auto
          md:max-w-3xl md:mx-auto md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:bg-white md:overflow-hidden
          lg:max-w-3xl lg:mx-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:bg-white lg:overflow-hidden
        "
      >
        {/* ── Sticky Header ── */}
        <div
          className="
            sticky top-0 z-10 bg-white border-b border-gray-100
            flex items-center justify-center relative
            px-4 py-4
            sm:px-8 sm:py-5
            md:px-10 md:py-6
            lg:px-10 lg:py-6
            md:rounded-t-2xl lg:rounded-t-2xl
          "
        >
          <button
            onClick={() => navigate(-1)}
            disabled={isSaving || isUploading}
            className="absolute left-4 sm:left-8 md:left-10 lg:left-10 p-1 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
            Edit Profile
          </h1>
        </div>

        {/* ── Form body ── */}
        <div
          className="
            px-4 pt-5 pb-28 flex flex-col gap-4
            sm:px-8 sm:pt-7 sm:pb-28 sm:gap-5
            md:px-10 md:pt-8 md:pb-24 md:gap-5
            lg:px-10 lg:pt-8 lg:pb-24
          "
        >
          {/* Banner Image */}
          <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-48">
            <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
              {bannerPreview || form.bannerImage ? (
                <img
                  src={bannerPreview || getBannerImageDisplay(form.bannerImage)}
                  alt="Banner"
                  className="w-full h-full object-fit"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera size={24} className="mr-2" />
                  <span className="text-sm">Add Banner Image</span>
                </div>
              )}
              {bannerUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                  <span className="text-white text-xs font-medium">
                    Uploading...
                  </span>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  onClick={() => setPhotoDrawer("banner")}
                  className="bg-white p-1 rounded-full shadow-md md:p-2 hover:bg-gray-50"
                >
                  <img
                    src="/assets/logos/edit.svg"
                    alt="Edit"
                    className="text-[#C94621]"
                  />
                </button>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerImageChange}
              className="hidden"
            />
          </div>

          {/* Profile Image */}
          <div className="relative -mt-16 sm:-mt-20 md:-mt-20 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-lg">
                {profilePreview || form.profileImage ? (
                  <img
                    src={
                      profilePreview ||
                      getProfileImageDisplay(form.profileImage)
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Upload size={24} />
                  </div>
                )}
                {profileUploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                    <span className="text-white text-[10px] font-medium">
                      Uploading...
                    </span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <button
                    onClick={() => setPhotoDrawer("profile")}
                    className="bg-white p-0.5 md:p-2 rounded-full shadow-md hover:bg-gray-50"
                  >
                    <img
                      src="/assets/logos/edit.svg"
                      alt="Edit"
                      className="text-[#C94621]"
                    />
                  </button>
                </div>
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Full Name */}
          <div
            className={`transition-all [&_label]:text-sm [&_label]:text-gray-900 ${!isEditing ? "opacity-50 pointer-events-none select-none" : ""
              }`}
          >
            <InputFields
              label="Full Name"
              placeholder="Enter Full Name"
              value={isEditing ? form.fullName : saved.fullName}
              isEditing={isEditing}
              onChange={(e) => set("fullName")(e.target.value)}
            />
          </div>

          {/* Date of Birth */}
          <div
            onClick={() => isEditing && setShowDatePicker(true)}
            className={`
              w-full px-4 py-3.5 lg:py-4 rounded-xl border bg-white transition-all text-sm lg:text-base
              flex items-center justify-between
              ${isEditing
                ? "border-gray-200 cursor-pointer hover:border-gray-300"
                : "border-gray-200 bg-white opacity-50 cursor-not-allowed select-none pointer-events-none"
              }
            `}
          >
            <span
              className={form.dateOfBirth ? "text-gray-900" : "text-gray-400"}
            >
              {isEditing
                ? form.dateOfBirth || "Select Date of Birth"
                : saved.dateOfBirth || "Not set"}
            </span>
            <img
              src="/assets/logos/calender.svg"
              alt="Calendar"
              className="text-gray-400 shrink-0 w-5"
            />
          </div>

          {/* Gender Selection */}
          <div
            className={`flex flex-col gap-1.5 transition-all text-sm ${!isEditing ? "opacity-50 pointer-events-none select-none" : ""
              }`}
          >
            <label className="text-sm font-medium text-gray-900">Gender</label>
            <div className="flex gap-3">
              {["male", "female", "other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => isEditing && set("gender")(g)}
                  className={`
                    flex-1 py-3.5 lg:py-4 rounded-xl border text-sm lg:text-base font-medium capitalize transition-all
                    ${isEditing
                      ? "cursor-pointer hover:border-gray-300"
                      : "cursor-not-allowed opacity-50 pointer-events-none"
                    }
                    ${(isEditing ? form.gender : saved.gender) === g
                      ? "bg-[#C94621] text-white border-[#C94621]"
                      : "bg-white text-gray-600 border-gray-200"
                    }
                  `}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Edit Mode Actions ── */}
        {isEditing && (
          <div
            className="
              px-4 pb-8 pt-2 flex gap-3
              sm:px-8 sm:pb-10
              md:px-10 md:pb-10
              lg:px-10 lg:pb-10
            "
          >
            <button
              onClick={handleCancel}
              disabled={isSaving || isUploading}
              className="
                flex-1 py-4 rounded-2xl
                bg-gray-100 text-gray-700 font-semibold
                hover:bg-gray-200 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isUploading}
              className="
                flex-1 py-4 rounded-2xl
                bg-[#C94621] text-white font-semibold
                hover:bg-[#A8432A] transition-colors disabled:opacity-50
              "
            >
              {isUploading
                ? "Uploading..."
                : isSaving
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </div>
        )}

        {/* Desktop / Tablet FAB */}
        <div className="hidden md:block absolute bottom-6 right-8">
          <FabButton isEditing={isEditing} onClick={() => setIsEditing(true)} />
        </div>

        {/* Mobile FAB */}
        <div className="md:hidden">
          <FabButton
            isEditing={isEditing}
            onClick={() => setIsEditing(true)}
            className="fixed z-20 bottom-8 right-5"
          />
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DatePicker
            value={form.dateOfBirth}
            onConfirm={(date) => {
              set("dateOfBirth")(date);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {/* ── Photo Action Drawer ── */}
        {photoDrawer && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setPhotoDrawer(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Drawer panel */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="
                relative w-full bg-white rounded-t-2xl shadow-xl
                px-5 pt-3 pb-6
                sm:max-w-md sm:mx-auto sm:rounded-2xl sm:mb-8
                animate-[slideUp_0.2s_ease-out]
              "
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

              <h3 className="text-base font-semibold text-gray-900 mb-3 px-1">
                {photoDrawer === "profile" ? "Profile photo" : "Banner photo"}
              </h3>

              <div className="flex flex-col">
                <button
                  onClick={handleUploadClick}
                  className="flex items-center gap-3 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FDECE5] flex items-center justify-center">
                    <ImagePlus size={20} className="text-[#C94621]" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Upload a photo
                  </span>
                </button>

                <button
                  onClick={drawerHasPhoto ? handleRemoveClick : undefined}
                  disabled={!drawerHasPhoto}
                  className={`flex items-center gap-3 py-4 px-2 rounded-xl transition-colors text-left ${drawerHasPhoto
                    ? "hover:bg-red-50 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-red-500">
                    Remove photo
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
