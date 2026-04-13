import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function Dropdown({
  value,
  options,
  onChange,
  error,
  searchable = false,
  maxHeight = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isPlaceholder = typeof value === "string" && value.startsWith("Select");

  const toggle = () => {
    setIsOpen((v) => !v);
    setSearch("");
  };
  const close = () => {
    setIsOpen(false);
    setSearch("");
  };
  const select = (opt) => {
    onChange(opt);
    close();
  };

  const filtered = useMemo(
    () =>
      searchable
        ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search, searchable]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`w-full h-13 px-4 flex items-center justify-between rounded-xl border bg-white text-[15px] cursor-pointer focus:outline-none transition-colors
          ${error ? "border-red-400" : isOpen ? "border-[#D64B2A]" : "border-gray-200"}`}
      >
        <span className={isPlaceholder ? "text-gray-400" : "text-gray-800"}>
          {value}
        </span>
        <ChevronDown
          className="w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onMouseDown={close} />
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
          >
            {searchable && (
              <div className="border-b border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <ul className={`${maxHeight || "max-h-42"} overflow-y-auto`}>
              {filtered.length > 0 ? (
                filtered.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => select(opt)}
                      className={`w-full text-left px-4 py-3 text-[14px] transition-colors hover:bg-[#F9EDE8] hover:text-[#D64B2A] cursor-pointer
                        ${value === opt ? "text-[#D64B2A] font-semibold bg-[#F9EDE8]" : "text-gray-700"}`}
                    >
                      {opt}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-gray-400 text-center">
                  No results found
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
