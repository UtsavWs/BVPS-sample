import { ArrowLeft } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FabButton from "../components/FabButton";
import { AuthContext } from "../context/AuthContext";
import InputFields from "../components/InputFields";
import { apiGet, apiPut } from "../api/api";
import LoadingScreen from "../components/LoadingScreen";

const INITIAL_DATA = {
  skill: "",
  accomplishments: "",
  interest: "",
  networkCircle: "",
  goals: "",
  keywords: "",
};

// Helper to convert backend format to frontend format
const formatFromBackend = (otherInfo) => {
  if (!otherInfo) return INITIAL_DATA;
  return {
    skill: otherInfo.skill || "",
    accomplishments: otherInfo.accomplishments || "",
    interest: otherInfo.interest || "",
    networkCircle: otherInfo.networkCircle || "",
    goals: otherInfo.goals || "",
    keywords: otherInfo.keywords || "",
  };
};

// Helper to convert frontend format to backend format
const formatToBackend = (formData) => {
  return {
    otherInformation: {
      skill: formData.skill,
      accomplishments: formData.accomplishments,
      interest: formData.interest,
      networkCircle: formData.networkCircle,
      goals: formData.goals,
      keywords: formData.keywords,
    },
  };
};

export default function OtherInfo() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const loading = auth?.loading;

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(INITIAL_DATA);
  const [form, setForm] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auth protection - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // Fetch saved otherInformation from database
  useEffect(() => {
    const fetchOtherInfo = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const res = await apiGet("/users/profile");
        if (res.success && res.data.user.otherInformation) {
          const formatted = formatFromBackend(res.data.user.otherInformation);
          setSaved(formatted);
          setForm(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch other information:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOtherInfo();
    }
  }, [user]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const updateData = formatToBackend(form);
      const res = await apiPut("/users/profile", updateData);

      if (res.success) {
        setSaved({ ...form });
        setIsEditing(false);
      } else {
        console.error("Failed to save:", res.message);
      }
    } catch (err) {
      console.error("Failed to save other information:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while fetching data from database
  if (loading || isLoading) {
    return (
      <LoadingScreen bg="bg-stone-50" />
    );
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
            Other Information
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
            label="Skill"
            placeholder="Enter Skill"
            value={isEditing ? form.skill : saved.skill}
            isEditing={isEditing}
            onChange={set("skill")}
          />

          <InputFields
            label="Accomplishments"
            placeholder="Enter Accomplishments"
            value={isEditing ? form.accomplishments : saved.accomplishments}
            isEditing={isEditing}
            onChange={set("accomplishments")}
          />

          <InputFields
            label="Interest"
            placeholder="Enter Interest"
            value={isEditing ? form.interest : saved.interest}
            isEditing={isEditing}
            onChange={set("interest")}
          />

          <InputFields
            label="Network/Circle"
            placeholder="Enter Network/Circle"
            value={isEditing ? form.networkCircle : saved.networkCircle}
            isEditing={isEditing}
            onChange={set("networkCircle")}
          />

          <InputFields
            label="Goals"
            placeholder="Enter Goals"
            value={isEditing ? form.goals : saved.goals}
            isEditing={isEditing}
            onChange={set("goals")}
          />

          <InputFields
            label="Keywords"
            placeholder="Enter Keywords"
            value={isEditing ? form.keywords : saved.keywords}
            isEditing={isEditing}
            onChange={set("keywords")}
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

        {/* Desktop FAB — absolute inside card, hidden while editing */}
        <div className="hidden lg:block absolute bottom-6 right-8">
          <FabButton isEditing={isEditing} onClick={() => setIsEditing(true)} />
        </div>
      </div>

      {/* Mobile / Tablet FAB — fixed to viewport, hidden while editing */}
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
