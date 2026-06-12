import { ArrowLeft } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "../../components/forms/DatePicker";
import Dropdown from "../../components/forms/Dropdown";
import FabButton from "../../components/ui/FabButton";
import ImageUploader from "../../components/ui/ImageUploader";
import DocumentUploader from "../../components/ui/DocumentUploader";
import { AuthContext } from "../../context/AuthContext";
import InputFields from "../../components/forms/InputFields";
import { formatDate, parseDateDisplay } from "../../utils/dateUtils";
import { uploadToCloudinary, uploadDocumentToCloudinary } from "../../utils/cloudinary";
import LoadingScreen from "../../components/ui/LoadingScreen";

const CATEGORY_OPTIONS = [
  "Select Category",
  "Manufacturing",
  "Retail / Wholesale",
  "Services",
  "IT / Software",
  "Real Estate",
  "Finance / Insurance",
  "Healthcare",
  "Hospitality / Food",
  "Education",
  "Other",
];

const rid = () => `${Date.now()}-${Math.random()}`;
const extOf = (name = "") => name.split(".").pop()?.toLowerCase() || "";

const INITIAL_DATA = {
  dateOfJoin: "",
  companyName: "",
  brandName: "",
  category: "",
  gstNo: "",
  profession: "",
  aboutBusiness: "",
  line: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  goals: "",
  keywords: "",
};

const formatFromBackend = (user) => {
  if (!user) return INITIAL_DATA;
  const addr = user.businessInformation?.businessAddress || {};
  return {
    dateOfJoin: formatDate(user.businessInformation?.dateOfJoin, ""),
    companyName: user.businessInformation?.companyName || "",
    brandName: user.businessInformation?.brandName || "",
    category: user.businessInformation?.category || "",
    gstNo: user.businessInformation?.gstNo || "",
    profession: user.businessInformation?.profession || "",
    aboutBusiness: user.businessInformation?.aboutBusiness || "",
    line: addr.line || "",
    area: addr.area || "",
    city: addr.city || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    goals: user.otherInformation?.goals || "",
    keywords: user.otherInformation?.keywords || "",
  };
};

const resolveCategory = (cat) => {
  if (!cat) return { select: "Select Category", custom: "" };
  if (CATEGORY_OPTIONS.includes(cat)) return { select: cat, custom: "" };
  return { select: "Other", custom: cat };
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

  // Category dropdown + custom
  const [categorySelect, setCategorySelect] = useState("Select Category");
  const [categoryCustom, setCategoryCustom] = useState("");

  // Upload groups — items: { id, url? (saved), file? + preview? (pending), name }
  const [businessImages, setBusinessImages] = useState([]);
  const [cardFront, setCardFront] = useState([]);
  const [cardBack, setCardBack] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Hydrate from context user (runs on load + after a successful save).
  useEffect(() => {
    if (!user) return;
    const biz = user.businessInformation || {};
    setSaved(formatFromBackend(user));
    setForm(formatFromBackend(user));

    const cat = resolveCategory(biz.category);
    setCategorySelect(cat.select);
    setCategoryCustom(cat.custom);

    setBusinessImages((biz.businessImages || []).map((url) => ({ id: rid(), url })));
    setCardFront(biz.visitingCardFront ? [{ id: rid(), url: biz.visitingCardFront }] : []);
    setCardBack(biz.visitingCardBack ? [{ id: rid(), url: biz.visitingCardBack }] : []);
    setDocuments(
      (biz.documents || []).map((d) => ({ id: rid(), url: d.url, name: d.name, ext: extOf(d.name) })),
    );
    setIsLoading(false);
  }, [user]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // Resolve a list of image items to URLs (upload pending files).
  const resolveImages = (items, folder) =>
    Promise.all(items.map((it) => (it.url ? it.url : uploadToCloudinary(it.file, { folder }))));

  const handleSubmit = async () => {
    setErrors({});
    const newErrors = {};
    if (form.gstNo && !/^[A-Z0-9]{15}$/.test(form.gstNo)) {
      newErrors.gstNo =
        "GST number must be exactly 15 characters and contain only uppercase letters and numbers.";
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const category =
      categorySelect === "Other"
        ? categoryCustom.trim()
        : categorySelect.startsWith("Select")
          ? ""
          : categorySelect;

    try {
      setIsLoading(true);

      // Upload any pending files (existing URLs pass through untouched).
      let businessImageUrls, frontUrl, backUrl, docs;
      try {
        [businessImageUrls, frontUrl, backUrl] = await Promise.all([
          resolveImages(businessImages, "bpvs/business"),
          cardFront[0] ? resolveImages(cardFront, "bpvs/cards").then((r) => r[0]) : Promise.resolve(""),
          cardBack[0] ? resolveImages(cardBack, "bpvs/cards").then((r) => r[0]) : Promise.resolve(""),
        ]);
        docs = await Promise.all(
          documents.map(async (d) =>
            d.url
              ? { url: d.url, name: d.name }
              : { url: await uploadDocumentToCloudinary(d.file, { folder: "bpvs/documents" }), name: d.name },
          ),
        );
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        toast.error("Failed to upload one or more files. Please try again.");
        setIsLoading(false);
        return;
      }

      const dataToSend = {
        businessInformation: {
          companyName: form.companyName,
          brandName: form.brandName,
          category,
          gstNo: form.gstNo,
          dateOfJoin: parseDateDisplay(form.dateOfJoin),
          profession: form.profession,
          aboutBusiness: form.aboutBusiness,
          businessAddress: {
            line: form.line,
            area: form.area,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          businessImages: businessImageUrls,
          visitingCardFront: frontUrl,
          visitingCardBack: backUrl,
          documents: docs,
        },
        otherInformation: { goals: form.goals, keywords: form.keywords },
      };

      const res = await auth.updateUser(dataToSend);
      if (res.success) {
        setIsEditing(false);
        toast.success("Business information saved.");
        // Context user updates → the effect re-hydrates all fields/uploads.
      } else {
        toast.error(res.message || "Failed to save business information.");
      }
    } catch (err) {
      console.error("Failed to save business information:", err);
      toast.error("Failed to save business information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return <LoadingScreen bg="bg-stone-50" />;
  }

  if (!user) {
    return null;
  }

  const SectionLabel = ({ children }) => (
    <div className="w-full lg:col-span-2">
      <p className="text-sm font-semibold text-gray-900 lg:text-base">{children}</p>
    </div>
  );

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

          {/* ── Business Category (dropdown + custom) ── */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-900 block mb-1.5 lg:text-base">
              Business Category
            </label>
            {isEditing ? (
              <>
                <Dropdown
                  value={categorySelect}
                  options={CATEGORY_OPTIONS}
                  onChange={setCategorySelect}
                />
                {categorySelect === "Other" && (
                  <input
                    type="text"
                    value={categoryCustom}
                    onChange={(e) => setCategoryCustom(e.target.value)}
                    placeholder="Enter your category"
                    className="mt-2 w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-[#D64B2A] focus:ring-2 focus:ring-[#D64B2A]/10"
                  />
                )}
              </>
            ) : (
              <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 opacity-60">
                {saved.category || "—"}
              </div>
            )}
          </div>

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

          {/* ── Business Address (structured) ── */}
          <SectionLabel>Business Address</SectionLabel>

          <div className="w-full lg:col-span-2">
            <InputFields
              label="Address Line"
              placeholder="Building / Street (e.g. Shop 4, MG Road)"
              value={isEditing ? form.line : saved.line}
              isEditing={isEditing}
              onChange={set("line")}
            />
          </div>

          <InputFields
            label="Area / Locality"
            placeholder="Enter Area / Locality"
            value={isEditing ? form.area : saved.area}
            isEditing={isEditing}
            onChange={set("area")}
          />

          <InputFields
            label="City"
            placeholder="Enter City"
            value={isEditing ? form.city : saved.city}
            isEditing={isEditing}
            onChange={set("city")}
          />

          <InputFields
            label="State"
            placeholder="Enter State"
            value={isEditing ? form.state : saved.state}
            isEditing={isEditing}
            onChange={set("state")}
          />

          <InputFields
            label="Pincode"
            maxLength={6}
            placeholder="Enter 6-digit Pincode"
            value={isEditing ? form.pincode : saved.pincode}
            isEditing={isEditing}
            onChange={set("pincode")}
            error={errors.pincode}
          />

          {/* About Business — full width */}
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

          {/* ── Business Images ── */}
          <SectionLabel>Business Images</SectionLabel>
          <div className="w-full lg:col-span-2">
            <ImageUploader
              value={businessImages}
              onChange={setBusinessImages}
              max={10}
              disabled={!isEditing}
            />
          </div>

          {/* ── Visiting Card (front + back) ── */}
          <SectionLabel>Visiting Card</SectionLabel>
          <div className="w-full">
            <label className="text-sm font-medium text-gray-900 block mb-1.5 lg:text-base">
              Front Side
            </label>
            <ImageUploader value={cardFront} onChange={setCardFront} single disabled={!isEditing} />
          </div>
          <div className="w-full">
            <label className="text-sm font-medium text-gray-900 block mb-1.5 lg:text-base">
              Back Side
            </label>
            <ImageUploader value={cardBack} onChange={setCardBack} single disabled={!isEditing} />
          </div>

          {/* ── Documents ── */}
          <SectionLabel>Documents</SectionLabel>
          <div className="w-full lg:col-span-2">
            <DocumentUploader
              value={documents}
              onChange={setDocuments}
              max={5}
              disabled={!isEditing}
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
