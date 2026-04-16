import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import InputFields from "../../components/InputFields";
import Dropdown from "../../components/Dropdown";
import { apiPost } from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";
import { ArrowLeft } from "lucide-react";

const REFERENCE_TYPES = ["Inside", "Outside"];

const EVENT_OPTIONS = [
  "Select",
  "Event A",
  "Event B",
  "Event C",
  "Event D",
  "Event E",
];

const INITIAL = {
  referenceType: "Inside",
  memberName: "Select Member",
  contactNumber: "",
  email: "",
  address: "",
  eventMaster: "Select",
  description: "",
};

const AddReferral = () => {
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

  // Filter out current user and map to names for dropdown
  const filteredMembers = useMemo(() => {
    return rawMembers.filter((m) => m._id !== user?.id);
  }, [rawMembers, user]);

  const memberNames = useMemo(() => {
    return ["Select Member", ...filteredMembers.map((m) => m.fullName)];
  }, [filteredMembers]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.memberName.trim() || form.memberName === "Select Member")
      e.memberName = "Please select a member";
    if (!form.contactNumber.trim())
      e.contactNumber = "Contact number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.address.trim()) e.address = "Address is required";
    if (form.eventMaster === "Select")
      e.eventMaster = "Please select an event master";
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
      const selectedMember = filteredMembers.find(
        (m) => m.fullName === form.memberName
      );
      const payload = {
        ...form,
        receivedBy: selectedMember?._id,
      };
      const res = await apiPost("/referrals", payload);
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => navigate(-1), 1200);
      } else {
        setErrors({ submit: res.message || "Something went wrong" });
      }
    } catch (err) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 lg:flex lg:items-center lg:justify-center lg:h-screen lg:overflow-hidden lg:p-6">
      <div
        className="
          relative w-full
          lg:max-w-3xl lg:mx-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:bg-white
          lg:max-h-full lg:flex lg:flex-col lg:overflow-hidden
        "
      >
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-center relative px-4 py-4 lg:px-10 lg:py-6 lg:rounded-t-2xl lg:shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 lg:left-10 p-1 text-gray-900 border-none bg-transparent cursor-pointer"
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 lg:text-xl">
            Add Referral
          </h1>
        </div>

        {/* ── Form body (scrollable on desktop) ── */}
        <div
          className="
            px-4 pt-5 pb-5 flex flex-col gap-4
            lg:px-10 lg:pt-8 lg:pb-10
            lg:grid lg:grid-cols-2 lg:gap-x-7 lg:gap-y-6 lg:items-start
            lg:flex-1 lg:overflow-y-auto lg:min-h-0
          "
        >
          {/* Reference Type toggle — full width */}
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-[13px] font-semibold text-gray-700">
              Reference Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REFERENCE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("referenceType", type)}
                  className={`h-13 rounded-xl border text-[15px] font-semibold transition-all duration-200 cursor-pointer
                    ${
                      form.referenceType === type
                        ? "bg-[#F9EDE8] text-[#C94621] border-[#C94621]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Member Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Member Name
            </label>
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
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.memberName}
              </p>
            )}
          </div>

          {/* Contact Number */}
          <InputFields
            label="Contact Number"
            placeholder="Enter mobile number"
            value={form.contactNumber}
            prefix="+91"
            isEditing={true}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
              set("contactNumber", cleaned);
            }}
            error={errors.contactNumber}
          />

          {/* Email */}
          <InputFields
            label="Email"
            placeholder="Enter Email"
            value={form.email}
            isEditing={true}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />

          {/* Event Master */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Event Master
            </label>
            <Dropdown
              value={form.eventMaster}
              options={EVENT_OPTIONS}
              onChange={(v) => set("eventMaster", v)}
              error={errors.eventMaster}
            />
            {errors.eventMaster && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.eventMaster}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="lg:col-span-2">
            <InputFields
              label="Address"
              placeholder="Enter Address"
              value={form.address}
              textarea={true}
              cols={2}
              isEditing={true}
              onChange={(e) => set("address", e.target.value)}
              error={errors.address}
            />
          </div>

          {/* Description — full width */}
          <div className="lg:col-span-2">
            <InputFields
              label="Description"
              placeholder="Enter Description"
              value={form.description}
              textarea={true}
              isEditing={true}
              onChange={(e) => set("description", e.target.value)}
              error={errors.description}
            />
          </div>

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

export default AddReferral;
