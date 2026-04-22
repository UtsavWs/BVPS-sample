import { memo } from "react";
import { Plus } from "lucide-react";

const MENU_ITEMS = [
  { label: "Add B2B", img: "/assets/logos/b2b.svg", route: "/add-b2b" },
  {
    label: "Add Visitor",
    img: "/assets/logos/visitors.svg",
    route: "/add-visitor",
  },
  {
    label: "Add Referrals",
    img: "/assets/logos/referralsG.svg",
    route: "/add-referral",
  },
  {
    label: "Add Thankyou Slip",
    img: "/assets/logos/thankYouslipG.svg",
    route: "/add-thankyouslip",
  },
];

function FabMenu({
  mobile = false,
  wrapRef,
  menuOpen,
  setMenuOpen,
  isApproved,
  navigate,
}) {
  return (
    <div
      ref={wrapRef}
      style={{ backdropFilter: menuOpen ? "blur(2px)" : "" }}
      className={[
        "flex flex-col items-end gap-2.5",
        mobile
          ? "fixed bottom-5 right-5 z-200"
          : "absolute bottom-8 right-8 z-60",
      ].join(" ")}
    >
      {isApproved &&
        MENU_ITEMS.map((item, i) => {
          const delay = menuOpen
            ? `${(MENU_ITEMS.length - 1 - i) * 50}ms`
            : `${i * 30}ms`;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5"
              style={{
                transitionProperty: "opacity, transform",
                transitionDuration: "220ms",
                transitionTimingFunction: "ease",
                transitionDelay: delay,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? "translateY(0) scale(1)"
                  : "translateY(10px) scale(0.9)",
                pointerEvents: menuOpen ? "auto" : "none",
              }}
            >
              <span
                onClick={() => {
                  setMenuOpen(false);
                  if (item.route) navigate(item.route);
                }}
                className="bg-white text-gray-800 text-[13px] font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap border border-gray-100 select-none"
              >
                {item.label}
              </span>
              <button
                type="button"
                className={[
                  mobile
                    ? "w-13 h-13"
                    : "w-11 h-11 md:w-15 md:h-15 lg:w-16 lg:h-16",
                  "rounded-full bg-white shadow-lg border border-gray-100",
                  "flex items-center justify-center overflow-hidden",
                  "active:scale-95 transition-transform cursor-pointer",
                ].join(" ")}
                onClick={() => {
                  setMenuOpen(false);
                  if (item.route) navigate(item.route);
                }}
              >
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          );
        })}
      <button
        type="button"
        className={[
          mobile
            ? "w-14 h-14 rounded-2xl"
            : "w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl",
          "bg-[#D64B2A] text-white flex items-center justify-center",
          "shadow-[0_6px_20px_rgba(214,75,42,0.45)]",
          "hover:bg-[#c0392b] active:scale-95 border-none cursor-pointer",
        ].join(" ")}
        style={{
          transform: menuOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease, background-color 0.2s ease",
        }}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <Plus className={mobile ? "w-7 h-7" : "w-6 h-6 lg:w-7 lg:h-7"} />
      </button>
    </div>
  );
}

export default memo(FabMenu);
