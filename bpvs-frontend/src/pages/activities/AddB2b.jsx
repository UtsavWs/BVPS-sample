import { useState, useMemo, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";
import { apiPost } from "../../api/api";
import Dropdown from "../../components/forms/Dropdown";
import InputFields from "../../components/forms/InputFields";
import DatePicker from "../../components/forms/DatePicker";
import { parseDateDisplay } from "../../utils/dateUtils";
import { uploadToCloudinary } from "../../utils/cloudinary";


// Min date = 30 days ago (at start of day)
const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
};

const AddB2B = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    members: rawMembers,
    loadMore,
    loadingMore,
    setSearchQuery,
  } = useContext(MemberContext);

  // Filter out the current user and build dropdown options
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((m) => m._id !== user?.id);
  }, [rawMembers, user]);

  const memberOptions = useMemo(() => {
    return ["Select Member", ...filteredMembers.map((m) => m.fullName)];
  }, [filteredMembers]);

  const [form, setForm] = useState({
    memberName: "Select Member",
    receivedBy: "",
    companyName: "",
    activityDate: "",
    location: "",
    topicOfConversation: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  // When a member is selected from the dropdown, also store their _id
  // and auto-populate companyName from the member's businessInformation.
  const handleMemberSelect = (name) => {
    const selected = filteredMembers.find((m) => m.fullName === name);
    setForm((f) => ({
      ...f,
      memberName: name,
      receivedBy: selected?._id || "",
      companyName: selected?.businessInformation?.companyName || "",
    }));
    setErrors((e) => ({ ...e, memberName: "" }));
  };

  const handleDateConfirm = (dateStr) => {
    set("activityDate", dateStr);
    setShowDatePicker(false);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.url));
      return [
        {
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          id: Date.now() + Math.random(),
        },
      ];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFile(files[0]);
  };

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const validate = () => {
    const e = {};
    if (!form.memberName || form.memberName === "Select Member")
      e.memberName = "Please select a member";
    if (!form.activityDate) e.activityDate = "Please select a date";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.topicOfConversation.trim())
      e.topicOfConversation = "Topic is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    // Convert display date to ISO for the API
    const dateObj = parseDateDisplay(form.activityDate);
    if (!dateObj) {
      setErrors({ activityDate: "Invalid date" });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "";
      const pendingFile = uploadedImages[0]?.file;
      if (pendingFile) {
        try {
          imageUrl = await uploadToCloudinary(pendingFile, { folder: "bpvs/b2b" });
        } catch (uploadErr) {
          console.error("Cloudinary upload error:", uploadErr);
          setErrors({ memberName: "Failed to upload image. Please try again." });
          setSubmitting(false);
          return;
        }
      }

      const res = await apiPost("/b2b", {
        receivedBy: form.receivedBy,
        initiatedBy: "My self",
        activityDate: dateObj.toISOString(),
        location: form.location,
        topicOfConversation: form.topicOfConversation,
        image: imageUrl,
      });
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => navigate(-1), 1200);
      } else {
        setErrors({ memberName: res.message || "Something went wrong" });
      }
    } catch (err) {
      console.error("B2B submit error:", err);
      setErrors({ memberName: "Failed to submit. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 lg:flex lg:items-center lg:justify-center">
      <div
        className="
          relative w-full
          lg:max-w-3xl lg:mx-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:bg-white lg:overflow-visible
        "
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-center relative px-4 py-4 lg:px-10 lg:py-6 lg:rounded-t-2xl">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 lg:left-10 p-1 text-gray-900"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 lg:text-xl">
            Business to Business
          </h1>
        </div>

        {/* ── Form body ── */}
        <div
          className="
            px-4 pt-5 pb-28 flex flex-col gap-4
            lg:px-10 lg:pt-8 lg:pb-24
            lg:grid lg:grid-cols-2 lg:gap-x-7 lg:gap-y-6 lg:items-start
          "
        >
          {/* Member Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Member Name
            </label>
            <Dropdown
              value={form.memberName}
              options={memberOptions}
              onChange={handleMemberSelect}
              error={errors.memberName}
              searchable
              maxHeight="max-h-60"
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              onSearchChange={setSearchQuery}
            />
            {errors.memberName && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.memberName}
              </p>
            )}
          </div>

          {/* Company Name — auto-filled from selected member's business details, editable */}
          <InputFields
            label="Company Name"
            placeholder="Enter Company Name"
            value={form.companyName}
            isEditing={true}
            onChange={(e) => set("companyName", e.target.value)}
          />

          {/* Activity Date */}
          <div className="w-full">
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              Date of B2B
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={`
                w-full flex items-center justify-between
                rounded-xl border bg-white
                h-13 px-4 py-3.5 lg:py-4
                text-sm lg:text-base text-left
                transition-all duration-150 cursor-pointer
                ${errors.activityDate
                  ? "border-red-400"
                  : "border-gray-200"
                }
              `}
            >
              <span className={form.activityDate ? "text-gray-800" : "text-gray-400"}>
                {form.activityDate || "Select Date"}
              </span>
              <CalendarDays size={18} className="text-gray-400 shrink-0" />
            </button>
            {errors.activityDate && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.activityDate}
              </p>
            )}
          </div>

          {/* Location */}
          <InputFields
            label="Location"
            placeholder="Enter Location"
            value={form.location}
            isEditing={true}
            onChange={(e) => set("location", e.target.value)}
            error={errors.location}
          />

          {/* Topic of Conversation — full width on desktop */}
          <div className="w-full lg:col-span-2">
            <InputFields
              label="Topic of Conversation"
              placeholder="Enter Topic"
              value={form.topicOfConversation}
              textarea={true}
              rows={5}
              isEditing={true}
              onChange={(e) => set("topicOfConversation", e.target.value)}
              error={errors.topicOfConversation}
            />
          </div>

          {/* Upload Images — full width on desktop */}
          <div className="w-full lg:col-span-2 flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Upload Images
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed px-5 py-6 flex flex-col items-center gap-4 transition-all
                ${dragging ? "border-[#D64B2A] bg-[#FDF3EE]" : "border-[#E8C8BC] bg-[#FDF8F6]"}`}
            >
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center w-full">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="relative">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className="text-[11px] text-gray-500 max-w-20 truncate">
                        {img.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <p className="text-[13px] text-gray-600 text-center">
                  Drag and Drop or{" "}
                  <span className="text-[#111111] font-medium">
                    Browse for files
                  </span>
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-[#C0441F] hover:bg-[#A63818] active:scale-[0.98] text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
              >
                Browse File
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div className="w-full lg:col-span-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className="
                w-full py-4 rounded-2xl
                bg-[#C0503A] text-white text-sm font-semibold
                hover:bg-[#ab4432] active:scale-[0.98]
                transition-all duration-150
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {submitted
                ? "✓ Submitted!"
                : submitting
                  ? "Submitting…"
                  : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* DatePicker Modal */}
      {showDatePicker && (
        <DatePicker
          mode="single"
          onConfirm={handleDateConfirm}
          onClose={() => setShowDatePicker(false)}
          minDate={getMinDate()}
        />
      )}
    </div>
  );
};

export default AddB2B;
