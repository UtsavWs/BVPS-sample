
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { MemberContext } from "../../context/MemberContext";
import Dropdown from "../../components/forms/Dropdown";
import InputFields from "../../components/forms/InputFields";
import DatePicker from "../../components/forms/DatePicker";
import { parseDateDisplay } from "../../utils/dateUtils";

const INITIAL = {
  memberName: "Select Member",
  amount: "",
  activityDate: "",
};

// Allow dates within the last 30 days (matches AddB2b).
const getMinDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
};

const AddThankYouSlip = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    members: rawMembers,
    loadMore,
    loadingMore,
    hasMore,
    setSearchQuery,
  } = useContext(MemberContext);

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    if (!form.amount.trim()) e.amount = "Amount is required";
    else if (isNaN(Number(form.amount))) e.amount = "Enter a valid amount";
    if (!form.activityDate) e.activityDate = "Please select a date";
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

    const dateObj = parseDateDisplay(form.activityDate);
    if (!dateObj) {
      setErrors({ activityDate: "Invalid date" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost("/thankyouslip", {
        receivedBy: receiverId,
        amount: form.amount,
        activityDate: dateObj.toISOString(),
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

          {/* Activity Date */}
          <div className="w-full lg:col-span-2">
            <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
              Date of Thank-you
            </label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className={`w-full flex items-center justify-between rounded-xl border bg-white h-13 px-4 py-3.5 lg:py-4 text-sm lg:text-base text-left transition-all duration-150 cursor-pointer ${
                errors.activityDate ? "border-red-400" : "border-gray-200"
              }`}
            >
              <span
                className={
                  form.activityDate ? "text-gray-800" : "text-gray-400"
                }
              >
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

          {/* Server error message */}
          {errors.submit && (
            <div className="lg:col-span-2">
              <p className="text-[13px] text-red-500 text-center">
                {errors.submit}
              </p>
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
              {submitted
                ? "✓ Submitted!"
                : submitting
                  ? "Submitting…"
                  : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <DatePicker
          mode="single"
          onConfirm={(dateStr) => {
            set("activityDate", dateStr);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          minDate={getMinDate()}
        />
      )}
    </div>
  );
};

export default AddThankYouSlip;
