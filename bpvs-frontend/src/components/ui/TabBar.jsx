// ── Pill-Inset TabBar ─────────────────────────────────────────────────────────
// Used in: ActivityLog, BvpsMembers
// Style: active tab filled #C94621, inactive uses peachy container bg #FEF0EA

const TabBar = ({ tabs, active, onChange, className = "" }) => (
  <div
    className={`p-1 rounded-2xl flex ${className}`}
    style={{ background: "#FEF0EA" }}
  >
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`
          flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
          ${
            active === tab
              ? "bg-[#C94621] text-white shadow-sm"
              : "text-[#C94621] bg-transparent"
          }
        `}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabBar;
