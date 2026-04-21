import { memo } from "react";

function StatsCard({ label, value, img, loading }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default overflow-hidden min-h-0">
      <div className="bg-transparent rounded-xl flex items-center justify-center shrink-0 w-13 h-13 md:w-[clamp(40px,min(8vh,7vw),110px)] md:h-[clamp(40px,min(8vh,7vw),110px)]">
        <img src={img} alt={label} className="object-contain w-full h-full" />
      </div>
      {loading ? (
        <div className="bg-gray-200 rounded animate-pulse w-10 h-7" />
      ) : (
        <p className="font-semibold text-gray-800 leading-none text-[22px] md:text-[26px]">
          {value}
        </p>
      )}
      <p className="font-medium text-gray-500 text-center leading-snug text-[11px] md:text-xs px-1">
        {label}
      </p>
    </div>
  );
}

export default memo(StatsCard);
