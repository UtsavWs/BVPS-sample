import { ArrowLeft } from "lucide-react";
import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import InputFields from "../../components/InputFields";
import Dropdown from "../../components/Dropdown";
import { apiPost } from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";

const REFERENCE_OPTIONS = [
  "Select Reference",
  "Reference A",
  "Reference B",
  "Reference C",
  "Reference D",
  "Reference E",
];

const BUSINESS_TYPES = ["New", "Repeat"];
const REFERENCE_TYPES = ["Inside", "Outside"];

const INITIAL = {
  memberName: "Select Member",
  businessType: "New",
  referenceType: "Inside",
  reference: "Select Reference",
  amount: "",
};

const AddThankYouSlip = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { 
    members: rawMembers, 
    loadMore, 
    loadingMore, 
    hasMore, 
    setSearchQuery 
  } = useContext(MemberContext);

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter and map members
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((m) => m._id !== user?.id);
  }, [rawMembers, user]);

  const memberNames = useMemo(() => {
    return ["Select Member", ...filteredMembers.map((m) => m.fullName)];
  }, [filteredMembers]);

  const memberMap = useMemo(() => {
    const map = {};
    filteredMembers.forEach((m) => {
      map[m.fullName] = m._id;
    });
    return map;
  }, [filteredMembers]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (form.memberName === "Select Member")
      e.memberName = "Please select a member";
    if (form.reference === "Select Reference")
      e.reference = "Please select a reference";
    if (!form.amount.trim()) e.amount = "Amount is required";
    else if (isNaN(Number(form.amount))) e.amount = "Enter a valid amount";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const receiverId = memberMap[form.memberName];
    if (!receiverId) {
      setErrors({ memberName: "Invalid member selected" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost("/thankyouslip", {
        receivedBy: receiverId,
        businessType: form.businessType,
        referenceType: form.referenceType,
        reference: form.reference,
        amount: form.amount,
      });

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => navigate(-1), 1200);
      } else {
        setErrors({ submit: res.message || "Something went wrong" });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Reusable toggle-button group ── */
  const ToggleGroup = ({ label, options, value, onChange, errorKey }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`h-13 rounded-xl border text-[15px] font-semibold transition-all duration-200 cursor-pointer
              ${
                value === opt
                  ? "bg-[#F9EDE8] text-[#C94621] border-[#C94621]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {errors[errorKey] && (
        <p className="text-[12px] text-red-500 mt-0.5">{errors[errorKey]}</p>
      )}
    </div>
  );

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
            className="absolute left-4 lg:left-10 p-1 text-gray-900 border-none bg-transparent cursor-pointer"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 lg:text-xl">
            Add Thank you Slip
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
          {/* Member Name — populated from API */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">Member Name</label>
            <Dropdown
              value={form.memberName}
              options={memberNames}
              onChange={(v) => set("memberName", v)}
              error={errors.memberName}
              searchable
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              onSearchChange={setSearchQuery}
            />
            {errors.memberName && (
              <p className="text-[12px] text-red-500 mt-0.5">{errors.memberName}</p>
            )}
          </div>

          {/* Business Type toggle */}
          <ToggleGroup
            label="Business Type"
            options={BUSINESS_TYPES}
            value={form.businessType}
            onChange={(v) => set("businessType", v)}
            errorKey="businessType"
          />

          {/* Reference Type toggle */}
          <ToggleGroup
            label="Reference Type"
            options={REFERENCE_TYPES}
            value={form.referenceType}
            onChange={(v) => set("referenceType", v)}
            errorKey="referenceType"
          />

          {/* Reference */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">Reference</label>
            <Dropdown
              value={form.reference}
              options={REFERENCE_OPTIONS}
              onChange={(v) => set("reference", v)}
              error={errors.reference}
            />
            {errors.reference && (
              <p className="text-[12px] text-red-500 mt-0.5">{errors.reference}</p>
            )}
          </div>

          {/* Amount */}
          <InputFields
            label="Amount"
            placeholder="Enter Amount"
            value={form.amount}
            isEditing={true}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              set("amount", val);
            }}
            error={errors.amount}
          />

          {/* Server error message */}
          {errors.submit && (
            <div className="lg:col-span-2">
              <p className="text-[13px] text-red-500 text-center">{errors.submit}</p>
            </div>
          )}

          {/* ── Submit button — full width on desktop ── */}
          <div className="w-full lg:col-span-2 pt-1">
            <button
              type="button"
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
              {submitted ? "✓ Submitted!" : submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddThankYouSlip;