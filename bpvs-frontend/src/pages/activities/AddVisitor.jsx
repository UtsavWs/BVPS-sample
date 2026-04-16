import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import InputFields from "../../components/InputFields";
import Dropdown from "../../components/Dropdown";
import { apiPost } from "../../api/api";

const PROFESSION_OPTIONS = [
  "Select Profession",
  "Doctor",
  "Engineer",
  "Lawyer",
  "Accountant",
  "Architect",
  "Teacher",
  "Business Owner",
  "Other",
];

const CHAPTER_OPTIONS = [
  "Select",
  "Chapter A",
  "Chapter B",
  "Chapter C",
  "Chapter D",
];

const AddVisitor = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    profession: "Select Profession",
    specialty: "",
    companyName: "",
    contactNumber: "",
    email: "",
    chapterOfInvite: "Select",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (form.profession === "Select Profession")
      e.profession = "Please select a profession";
    if (!form.specialty.trim()) e.specialty = "Specialty is required";
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.contactNumber.trim())
      e.contactNumber = "Contact number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (form.chapterOfInvite === "Select")
      e.chapterOfInvite = "Please select a chapter";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost("/visitors", form);
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => navigate(-1), 1200);
      } else {
        setErrors({ submit: res.message || "Something went wrong." });
      }
    } catch (err) {
      setErrors({ submit: "Network error. Please try again." });
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
            Add Visitor
          </h1>
        </div>

        {/* ── Form body ── */}
        <div
          className="
            px-4 pt-5 pb-5 flex flex-col gap-4
            lg:px-10 lg:pt-8 lg:pb-24
            lg:grid lg:grid-cols-2 lg:gap-x-7 lg:gap-y-6 lg:items-start
          "
        >
          {/* First Name */}
          <InputFields
            label="First Name"
            placeholder="Enter First Name"
            value={form.firstName}
            isEditing={true}
            onChange={(e) => set("firstName", e.target.value)}
            error={errors.firstName}
          />

          {/* Last Name */}
          <InputFields
            label="Last Name"
            placeholder="Enter Last Name"
            value={form.lastName}
            isEditing={true}
            onChange={(e) => set("lastName", e.target.value)}
            error={errors.lastName}
          />

          {/* Profession */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Profession
            </label>
            <Dropdown
              value={form.profession}
              options={PROFESSION_OPTIONS}
              onChange={(v) => set("profession", v)}
            />
            {errors.profession && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.profession}
              </p>
            )}
          </div>

          {/* Specialty */}
          <InputFields
            label="Specialty"
            placeholder="Enter Specialty"
            value={form.specialty}
            isEditing={true}
            onChange={(e) => set("specialty", e.target.value)}
            error={errors.specialty}
          />

          {/* Company Name */}
          <InputFields
            label="Company Name"
            placeholder="Enter Company Name"
            value={form.companyName}
            isEditing={true}
            onChange={(e) => set("companyName", e.target.value)}
            error={errors.companyName}
          />

          {/* Contact Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Contact Number
            </label>
            <div
              className={`flex items-center rounded-xl border bg-white transition-colors overflow-hidden
              ${errors.contactNumber ? "border-red-400" : "border-gray-200 focus-within:border-[#D64B2A]"}`}
            >
              <span className="px-4 text-[15px] text-gray-800 font-medium border-r border-gray-200 h-13 flex items-center shrink-0 bg-white">
                +91
              </span>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) =>
                  set(
                    "contactNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="Enter mobile number"
                className="flex-1 h-13 px-3 text-[15px] text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {errors.contactNumber && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.contactNumber}
              </p>
            )}
          </div>

          {/* Email */}
          <InputFields
            label="Email"
            placeholder="Enter Email"
            value={form.email}
            isEditing={true}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />

          {/* Chapter of Invite */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Chapter of Invite
            </label>
            <Dropdown
              value={form.chapterOfInvite}
              options={CHAPTER_OPTIONS}
              onChange={(v) => set("chapterOfInvite", v)}
            />
            {errors.chapterOfInvite && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.chapterOfInvite}
              </p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="w-full lg:col-span-2">
              <p className="text-[13px] text-red-500 text-center">{errors.submit}</p>
            </div>
          )}

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
    </div>
  );
};

export default AddVisitor;