import React from "react";

const InputFields = ({
  label,
  placeholder,
  value,
  textarea = false,
  isEditing,
  onChange,
  error,
  prefix,
  readOnly = false,
  rows = 4,
}) => {
  const borderColor = error
    ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
    : "border-gray-200 focus:border-[#D64B2A] focus:ring-2 focus:ring-[#D64B2A]/10";

  if (isEditing) {
    return (
      <div className="w-full">
        <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
          {label}
        </label>
        {textarea ? (
          <textarea
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`
              w-full rounded-xl px-4 py-3.5
              text-sm lg:text-base
              border ${borderColor} bg-white
              focus:outline-none
              resize-none
              min-h-27.5 sm:min-h-30 lg:min-h-32.5
              transition-all duration-150
              placeholder:text-gray-300
            `}
          />
        ) : (
          <div
            className={`
              flex items-center rounded-xl border ${borderColor} bg-white
              overflow-hidden transition-all duration-150
            `}
          >
            {prefix && (
              <span className="px-4 text-sm lg:text-base text-gray-800 font-medium border-r border-gray-200 h-13 flex items-center shrink-0 bg-white">
                {prefix}
              </span>
            )}
            <input
              type={prefix === "+91" ? "tel" : "text"}
              value={value || ""}
              onChange={onChange}
              placeholder={placeholder}
              readOnly={readOnly}
              className={`
                flex-1 h-13 px-4 py-3.5 lg:py-4
                text-sm lg:text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none
                transition-all duration-150
                ${readOnly ? "cursor-not-allowed select-none opacity-70" : ""}
              `}
            />
          </div>
        )}
        {error && <p className="text-[12px] text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">
        {label}
      </label>
      <div
        className={`
          w-full rounded-xl px-4 py-3.5 lg:py-4
          text-sm lg:text-base
          border border-gray-200 bg-white text-gray-800
          opacity-60 cursor-not-allowed select-none
          ${textarea ? "min-h-27.5 sm:min-h-30 lg:min-h-32.5" : ""}
        `}
      >
        {value ? <span className="text-gray-800">{value}</span> : <span className="text-gray-300">{placeholder}</span>}
      </div>
    </div>
  );
};

export default InputFields;
