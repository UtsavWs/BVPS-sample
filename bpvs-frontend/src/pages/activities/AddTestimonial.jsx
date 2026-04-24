import { ArrowLeft, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "../../components/forms/DatePicker";
import { formatDate, formatISODate } from "../../utils/dateUtils";
import Dropdown from "../../components/forms/Dropdown";

const MEMBER_OPTIONS = [
  "Select Member",
  "Member A",
  "Member B",
  "Member C",
  "Member D",
];

const INITIAL = {
  memberName: "Select Member",
  date: "2026-03-04",
  description: "",
};

const AddTestimonial = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fileInputRef = useRef(null);

  const handleDateConfirm = (dateDisplay) => {
    set("date", formatISODate(dateDisplay));
    setShowDatePicker(false);
  };

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.memberName || form.memberName === "Select Member")
      e.memberName = "Please select a member";
    if (!form.date) e.date = "Please select a date";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate(-1), 1200);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.url));
      return [
        {
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

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 lg:flex lg:items-center lg:justify-center">
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
            className="absolute left-4 sm:left-8 lg:left-10 p-1 text-gray-900 border-none bg-transparent cursor-pointer"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
            Add Testimonial
          </h1>
        </div>

        {/* ── Form Body ── */}
        <div
          className="
          px-4 pt-5 flex flex-col gap-4
          sm:px-8 sm:pt-7 sm:gap-5
          lg:px-10 lg:pt-8 lg:pb-10 lg:gap-6
        "
        >
          {/* Member Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Member Name
            </label>
            <Dropdown
              value={form.memberName}
              options={MEMBER_OPTIONS}
              onChange={(v) => set("memberName", v)}
              error={errors.memberName}
              searchable
            />
            {errors.memberName && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.memberName}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Date
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={`w-full h-13 px-4 flex items-center justify-between rounded-xl border bg-white text-[15px] transition-colors cursor-pointer
                ${errors.date ? "border-red-400" : "border-gray-200 hover:border-gray-300"}`}
            >
              <span className={form.date ? "text-gray-800" : "text-gray-400"}>
                {form.date ? formatDate(form.date) : "Select Date"}
              </span>
              <img
                src="/assets/logos/calender.svg"
                alt="Calendar"
                className="text-gray-400 shrink-0 md:w-5"
              />
            </button>
            {errors.date && (
              <p className="text-[12px] text-red-500 mt-0.5">{errors.date}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Enter Description"
              rows={5}
              className={`w-full px-4 py-3.5 rounded-xl border bg-white text-[14px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none transition-colors
                ${errors.description ? "border-red-400" : "border-gray-200 focus:border-[#D64B2A]"}`}
            />
            {errors.description && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.description}
              </p>
            )}
          </div>

          {/* Upload Images */}
          <div className="flex flex-col gap-1.5">
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

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="
              w-full py-4 rounded-2xl
              bg-[#C0503A] text-white text-sm font-semibold
              hover:bg-[#ab4432] active:scale-[0.98]
              transition-all duration-150
              sm:text-base
              disabled:opacity-70 disabled:cursor-not-allowed
              cursor-pointer mt-1
            "
          >
            {submitted ? "✓ Submitted!" : submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {showDatePicker && (
        <DatePicker
          onConfirm={handleDateConfirm}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};

export default AddTestimonial;
