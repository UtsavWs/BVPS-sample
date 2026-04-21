import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";
import { apiPost } from "../../api/api";
import Dropdown from "../../components/forms/Dropdown";
import InputFields from "../../components/forms/InputFields";

const INITIATED_BY_OPTIONS = ["My self", "Other Member"];
const EVENT_MASTER_OPTIONS = [
  "Select",
  "Event A",
  "Event B",
  "Event C",
  "Event D",
  "Event E",
];

const AddB2B = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    members: rawMembers,
    loadMore,
    loadingMore,
    hasMore,
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
    memberId: "",
    initiatedBy: "My self",
    location: "",
    topicOfConversation: "",
    eventMaster: "Select",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  // When a member is selected from the dropdown, also store their _id
  const handleMemberSelect = (name) => {
    const selected = filteredMembers.find((m) => m.fullName === name);
    setForm((f) => ({
      ...f,
      memberName: name,
      memberId: selected?._id || "",
    }));
    setErrors((e) => ({ ...e, memberName: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.memberName || form.memberName === "Select Member")
      e.memberName = "Please select a member";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.topicOfConversation.trim())
      e.topicOfConversation = "Topic is required";
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
      const res = await apiPost("/b2b", {
        memberId: form.memberId,
        initiatedBy: form.initiatedBy,
        location: form.location,
        topicOfConversation: form.topicOfConversation,
        eventMaster: form.eventMaster,
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

          {/* Initiated By */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Initiated By
            </label>
            <Dropdown
              value={form.initiatedBy}
              options={INITIATED_BY_OPTIONS}
              onChange={(v) => set("initiatedBy", v)}
            />
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

          {/* Event Master */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Event Master
            </label>
            <Dropdown
              value={form.eventMaster}
              options={EVENT_MASTER_OPTIONS}
              onChange={(v) => set("eventMaster", v)}
            />
            {errors.eventMaster && (
              <p className="text-[12px] text-red-500 mt-0.5">
                {errors.eventMaster}
              </p>
            )}
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
    </div>
  );
};

export default AddB2B;
