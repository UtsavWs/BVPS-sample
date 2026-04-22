// ── Pill TabBar ───────────────────────────────────────────────────────────────
// Used in: ActivityLog, BvpsMembers
// Style: matches UserDashboard mobile tabs —
//   active → solid #C94621 white text
//   inactive → translucent #C946211F with #D64B2A text

const TabBar = ({ tabs, active, onChange, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`
          flex-1 py-2 rounded-lg text-[12px] font-light transition-all cursor-pointer
          ${
            active === tab
              ? "bg-[#C94621] text-white"
              : "bg-[#C946211F] text-[#D64B2A]"
          }
        `}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabBar;
