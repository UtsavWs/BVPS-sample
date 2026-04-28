import { ArrowLeft } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FabButton from "../../components/ui/FabButton";
import { AuthContext } from "../../context/AuthContext";
import InputFields from "../../components/forms/InputFields";
import LoadingScreen from "../../components/ui/LoadingScreen";

const INITIAL_DATA = {
  email: "",
  mobileNo: "",
  website: "",
  location: "",
  nativePlace: "",
};

// Helper to convert backend format to frontend format
const formatFromBackend = (user) => {
  if (!user) return INITIAL_DATA;
  return {
    email: user.email || "",
    mobileNo: user.mobile || "",
    website: user.contactInformation?.website || "",
    location: user.contactInformation?.location || "",
    nativePlace: user.contactInformation?.nativePlace || "",
  };
};

// Helper to convert frontend format to backend format
const formatToBackend = (formData) => {
  return {
    mobile: formData.mobileNo,
    contactInformation: {
      website: formData.website,
      location: formData.location,
      nativePlace: formData.nativePlace,
    },
  };
};

export default function ContactInfo() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const loading = auth?.loading;

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(INITIAL_DATA);
  const [form, setForm] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Use data from Context instead of fetching from API
  useEffect(() => {
    if (user) {
      const formatted = formatFromBackend(user);
      setSaved(formatted);
      setForm(formatted);
      setIsLoading(false);
    }
  }, [user]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const updateData = formatToBackend(form);
      const res = await auth.updateUser(updateData);

      if (res.success) {
        setSaved({ ...form });
        setIsEditing(false);
      } else {
        alert(res.message || "Failed to save. Please check your inputs.");
      }
    } catch (err) {
      console.error("Failed to save contact information:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while fetching data from database
  if (loading || isLoading) {
    return <LoadingScreen bg="bg-stone-50" />;
  }

  // Don't render if not logged in (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div
        className="
  relative w-full
  sm:max-w-2xl sm:mx-auto
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
          lg:px-10 lg:py-6
          lg:rounded-t-2xl
        "
        >
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 sm:left-8 lg:left-10 p-1 text-gray-900"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
            Contact Information
          </h1>
        </div>

        {/* ── Form body ── */}
        <div
          className="
          px-4 pt-5 pb-28 flex flex-col gap-4
          sm:px-8 sm:pt-7 sm:pb-28 sm:gap-5
          lg:px-10 lg:pt-8 lg:pb-24
          lg:grid lg:grid-cols-2 lg:gap-x-7 lg:gap-y-6 lg:items-start
        "
        >
          <InputFields
            label="Mobile No"
            type="tel"
            placeholder="Enter Mobile No"
            value={isEditing ? form.mobileNo : saved.mobileNo}
            isEditing={isEditing}
            onChange={set("mobileNo")}
          />

          <InputFields
            label="Email"
            placeholder="Enter Email"
            value={isEditing ? form.email : saved.email}
            isEditing={isEditing}
            readOnly={isEditing}
          />

          <InputFields
            label="Website"
            placeholder="Enter Website"
            value={isEditing ? form.website : saved.website}
            isEditing={isEditing}
            onChange={set("website")}
          />

          <InputFields
            label="Location"
            placeholder="Enter Location"
            value={isEditing ? form.location : saved.location}
            isEditing={isEditing}
            onChange={set("location")}
          />

          <InputFields
            label="Native Place"
            placeholder="Enter Native Place"
            value={isEditing ? form.nativePlace : saved.nativePlace}
            isEditing={isEditing}
            onChange={set("nativePlace")}
          />

          {/* Submit — only shown in edit mode */}
          {isEditing && (
            <div className="w-full lg:col-span-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="
                  w-full py-4 rounded-2xl
                  bg-[#C0503A] text-white text-sm font-semibold
                  hover:bg-[#ab4432] active:scale-[0.98]
                  transition-all duration-150
                  sm:text-base
                  disabled:opacity-70 disabled:cursor-not-allowed
                "
              >
                {isSaving ? "Saving..." : "Submit"}
              </button>
            </div>
          )}
        </div>

        {/* Desktop FAB — absolute inside card */}
        <div className="hidden lg:block absolute bottom-6 right-8">
          <FabButton isEditing={isEditing} onClick={() => setIsEditing(true)} />
        </div>
      </div>

      {/* Mobile / Tablet FAB — fixed to viewport */}
      <div className="lg:hidden">
        <FabButton
          isEditing={isEditing}
          onClick={() => setIsEditing(true)}
          className="fixed z-20 bottom-8 right-5"
        />
      </div>
    </div>
  );
}
