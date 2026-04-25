import { ArrowLeft } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "../../components/forms/DatePicker";
import FabButton from "../../components/ui/FabButton";
import { AuthContext } from "../../context/AuthContext";
import InputFields from "../../components/forms/InputFields";
import { apiGet, apiPut } from "../../api/api";
import { formatDate, parseDateDisplay } from "../../utils/dateUtils";
import LoadingScreen from "../../components/ui/LoadingScreen";

const INITIAL_DATA = {
  dateOfJoin: "",
  companyName: "",
  brandName: "",
  gstNo: "",
  profession: "",
  aboutBusiness: "",
  goals: "",
  keywords: "",
};

// Helper to convert backend format to frontend format
const formatFromBackend = (user) => {
  if (!user) return INITIAL_DATA;
  return {
    dateOfJoin: formatDate(user.businessInformation?.dateOfJoin, ""),
    companyName: user.businessInformation?.companyName || "",
    brandName: user.businessInformation?.brandName || "",
    gstNo: user.businessInformation?.gstNo || "",
    profession: user.businessInformation?.profession || "",
    aboutBusiness: user.businessInformation?.aboutBusiness || "",
    goals: user.otherInformation?.goals || "",
    keywords: user.otherInformation?.keywords || "",
  };
};

// Helper to convert frontend format to backend format
const formatToBackend = (formData) => {
  return {
    businessInformation: {
      companyName: formData.companyName,
      brandName: formData.brandName,
      gstNo: formData.gstNo,
      dateOfJoin: parseDateDisplay(formData.dateOfJoin),
      profession: formData.profession,
      aboutBusiness: formData.aboutBusiness,
    },
    otherInformation: {
      goals: formData.goals,
      keywords: formData.keywords,
    },
  };
};

export default function BusinessInfo() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const loading = auth?.loading;

  const [showPicker, setShowPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(INITIAL_DATA);
  const [form, setForm] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState({});

  // Fetch business info from database
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const res = await apiGet("/users/profile");
        if (res.success && res.data.user) {
          const formatted = formatFromBackend(res.data.user);
          setSaved(formatted);
          setForm(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch business information:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [user]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    setErrors({});
    if (form.gstNo) {
      if (!/^[A-Z0-9]{15}$/.test(form.gstNo)) {
        setErrors({
          gstNo: "GST number must be exactly 15 characters and contain only uppercase letters and numbers.",
        });
        return;
      }
    }

    try {
      setIsLoading(true);
      const dataToSend = formatToBackend(form);
      const res = await apiPut("/users/profile", dataToSend);
      if (res.success) {
        setSaved({ ...form });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save business information:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth or fetching data
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
            Business Information
          </h1>
        </div>

        {/* ── Form body ── */}
        <div
          className="px-4 pt-5 pb-28 flex flex-col gap-4
          sm:px-8 sm:pt-7 sm:pb-28 sm:gap-5
          lg:px-10 lg:pt-8 lg:pb-24
          lg:grid lg:grid-cols-2 lg:gap-x-7 lg:gap-y-6 lg:items-start"
        >
          <InputFields
            label="Company Name"
            placeholder="Enter Company Name"
            value={isEditing ? form.companyName : saved.companyName}
            isEditing={isEditing}
            onChange={set("companyName")}
          />

          <InputFields
            label="Brand Name"
            placeholder="Enter Brand Name"
            value={isEditing ? form.brandName : saved.brandName}
            isEditing={isEditing}
            onChange={set("brandName")}
          />

          <InputFields
            label="GST No"
            maxLength={15}
            minLength={15}
            placeholder="Enter GST No"
            value={isEditing ? form.gstNo : saved.gstNo}
            isEditing={isEditing}
            onChange={set("gstNo")}
            error={errors.gstNo}
          />

          {/* ── Date of Join ── */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-900 block mb-1.5 lg:text-base">
              Date of Join
            </label>
            <button
              disabled={!isEditing}
              onClick={() => isEditing && setShowPicker(true)}
              className={`
                w-full flex items-center justify-between
                px-4 py-3.5 lg:py-4 rounded-xl border
                text-sm lg:text-base transition-all
                ${isEditing
                  ? "border-gray-200 bg-white text-gray-800 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-[#D64B2A] focus:ring-2 focus:ring-[#D64B2A]/10"
                  : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed opacity-60"
                }
              `}
            >
              <span>{isEditing ? form.dateOfJoin : saved.dateOfJoin}</span>
              <img
                src="/assets/logos/calender.svg"
                className="text-gray-400 shrink-0 w-5"
              />
            </button>
          </div>

          <InputFields
            label="Profession"
            placeholder="Enter Profession"
            value={isEditing ? form.profession : saved.profession}
            isEditing={isEditing}
            onChange={set("profession")}
          />

          {/* About Business — full width on desktop */}
          <div className="w-full lg:col-span-2">
            <InputFields
              textarea
              label="About Business"
              placeholder="Enter About Business"
              value={isEditing ? form.aboutBusiness : saved.aboutBusiness}
              isEditing={isEditing}
              onChange={set("aboutBusiness")}
            />
          </div>

          {/* Submit — only shown in edit mode */}
          {isEditing && (
            <div className="w-full lg:col-span-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="
                  w-full py-4 rounded-2xl
                  bg-[#C0503A] text-white text-sm font-semibold
                  hover:bg-[#ab4432] active:scale-[0.98]
                  transition-all duration-150
                  sm:text-base
                  disabled:opacity-70 disabled:cursor-not-allowed
                "
              >
                {isLoading ? "Saving..." : "Submit"}
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

      {/* ── Date Picker ── */}
      {showPicker && (
        <DatePicker
          onConfirm={(date) => {
            setForm((p) => ({ ...p, dateOfJoin: date }));
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
