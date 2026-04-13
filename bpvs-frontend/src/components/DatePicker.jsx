import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import {
  MONTHS_FULL as MONTHS,
  MONTHS_SHORT as SHORT_MONTHS,
  WEEKDAYS,
  formatSel,
  compareSel,
  getCalendarGrid,
} from "../utils/dateUtils";

/**
 * Unified date picker.
 *  mode="single" → onConfirm(formattedString)
 *  mode="range"  → onConfirm({ start, end })
 */
function DatePicker({ mode = "single", onConfirm, onClose, yearRange = 100 }) {
  const today = new Date();
  const isRange = mode === "range";

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState("date"); // "date" | "monthYear"

  // Single-mode selection
  const [selected, setSelected] = useState(null);
  // Range-mode selection
  const [startSel, setStartSel] = useState(null);
  const [endSel, setEndSel] = useState(null);

  const changeMonth = (dir) => {
    setMonth((prev) => {
      const next = prev + dir;
      if (next > 11) {
        setYear((y) => y + 1);
        return 0;
      }
      if (next < 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return next;
    });
  };

  const { firstDay, daysInMonth, daysInPrev, remainder } = getCalendarGrid(
    year,
    month
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const half = Math.floor(yearRange * 0.75);
    return Array.from({ length: yearRange }, (_, i) => {
      const y = currentYear - half + i;
      return (
        <option key={y} value={y}>
          {y}
        </option>
      );
    });
  }, [yearRange]);

  const isToday = (d) =>
    today.getDate() === d &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  // ── Single mode ────────────────────────────────────────────
  const isSel = (d) =>
    selected?.d === d && selected?.m === month && selected?.y === year;

  // ── Range mode ─────────────────────────────────────────────
  const isStart = (d) =>
    startSel && startSel.y === year && startSel.m === month && startSel.d === d;
  const isEnd = (d) =>
    endSel && endSel.y === year && endSel.m === month && endSel.d === d;
  const inRange = (d) => {
    if (!startSel || !endSel) return false;
    const cell = { y: year, m: month, d };
    return compareSel(cell, startSel) > 0 && compareSel(cell, endSel) < 0;
  };

  const handleDayClick = (d) => {
    if (!isRange) {
      setSelected({ d, m: month, y: year });
      return;
    }
    const clicked = { y: year, m: month, d };
    if (!startSel || endSel) {
      setStartSel(clicked);
      setEndSel(null);
    } else {
      const cmp = compareSel(clicked, startSel);
      if (cmp < 0) setStartSel(clicked);
      else if (cmp === 0) setEndSel(null);
      else setEndSel(clicked);
    }
  };

  const getDayClass = (d) => {
    const base =
      "aspect-square flex items-center justify-center text-[13px] transition cursor-pointer border-none ";
    if (isRange) {
      const start = isStart(d);
      const end = isEnd(d);
      if (start && end) return base + "rounded-full bg-[#D64B2A] text-white font-semibold";
      if (start) return base + "rounded-l-full bg-[#D64B2A] text-white font-semibold";
      if (end) return base + "rounded-r-full bg-[#D64B2A] text-white font-semibold";
      if (inRange(d)) return base + "bg-[#F9EDE8] text-[#D64B2A] rounded-none";
      if (isToday(d))
        return base + "rounded-full text-[#D64B2A] font-semibold bg-transparent";
      return base + "rounded-full text-gray-700 hover:bg-gray-100 bg-transparent";
    }
    // single
    if (isSel(d)) return base + "rounded-full bg-[#D64B2A] text-white font-semibold";
    if (isToday(d)) return base + "rounded-full text-[#D64B2A] font-semibold";
    return base + "rounded-full text-gray-700 hover:bg-gray-100";
  };

  const confirm = () => {
    if (isRange) {
      if (!startSel || !endSel) return onClose();
      onConfirm({ start: formatSel(startSel), end: formatSel(endSel) });
    } else {
      if (!selected) return onClose();
      onConfirm(formatSel(selected));
    }
    onClose();
  };

  const confirmDisabled = isRange ? !startSel || !endSel : false;

  // ── Sub-views ──────────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer border-none"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setView(view === "date" ? "monthYear" : "date")}
          className="text-sm font-semibold text-gray-900 w-32 text-center hover:text-[#D64B2A] transition cursor-pointer border-none bg-transparent"
        >
          {MONTHS[month]} {year}
        </button>
        <button
          onClick={() => changeMonth(1)}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer border-none"
        >
          <ArrowLeft size={14} strokeWidth={2.5} className="rotate-180" />
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 text-lg px-2 border-none bg-transparent cursor-pointer hover:text-gray-600 transition"
      >
        ✕
      </button>
    </div>
  );

  const RangeBar = () => (
    <div className="flex items-center justify-between bg-[#F9EDE8] rounded-xl px-4 py-2.5 mb-4 gap-2">
      <span
        className={`text-[13px] font-semibold flex-1 text-center ${
          startSel ? "text-[#D64B2A]" : "text-gray-400"
        }`}
      >
        {formatSel(startSel) || "Start date"}
      </span>
      <span className="text-gray-300 text-xs shrink-0">→</span>
      <span
        className={`text-[13px] font-semibold flex-1 text-center ${
          endSel ? "text-[#D64B2A]" : "text-gray-400"
        }`}
      >
        {formatSel(endSel) || "End date"}
      </span>
    </div>
  );

  const MonthYearView = () => (
    <div className="mb-4">
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="w-full mb-3 border rounded-lg px-3 py-2 text-sm"
      >
        {yearOptions}
      </select>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => {
              setMonth(i);
              setView("date");
            }}
            className={`py-2 rounded-lg text-sm cursor-pointer border-none ${
              month === i
                ? "bg-[#D64B2A] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {SHORT_MONTHS[i]}
          </button>
        ))}
      </div>
    </div>
  );

  const CalendarGrid = () => (
    <>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[11px] font-semibold text-gray-400 py-1"
          >
            {w}
          </div>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${isRange ? "gap-y-0.5" : "gap-0.5"}`}>
        {Array.from({ length: firstDay }, (_, i) => (
          <div
            key={`p${i}`}
            className="aspect-square flex items-center justify-center text-[13px] text-gray-200"
          >
            {daysInPrev - firstDay + 1 + i}
          </div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          return (
            <button
              key={d}
              onClick={() => handleDayClick(d)}
              className={getDayClass(d)}
            >
              {d}
            </button>
          );
        })}
        {Array.from({ length: remainder }, (_, i) => (
          <div
            key={`n${i}`}
            className="aspect-square flex items-center justify-center text-[13px] text-gray-200"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </>
  );

  const CalendarInner = () => (
    <>
      <Header />
      {isRange && <RangeBar />}
      {view === "monthYear" && <MonthYearView />}
      {view === "date" && <CalendarGrid />}
      <button
        onClick={confirm}
        disabled={confirmDisabled}
        className="mt-5 w-full py-3.5 bg-[#D64B2A] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer border-none"
      >
        {isRange ? "Confirm Range" : "Confirm Date"}
      </button>
    </>
  );

  return (
    <>
      {/* MOBILE: bottom sheet */}
      <div
        className="md:hidden fixed inset-0 bg-black/35 z-500 flex items-end justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-t-3xl w-full max-w-sm p-5 pb-9"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <CalendarInner />
        </div>
      </div>

      {/* DESKTOP: centered modal card */}
      <div
        className="hidden md:flex fixed inset-0 bg-black/30 z-500 items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-90 lg:w-100 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarInner />
        </div>
      </div>
    </>
  );
}

export default DatePicker;
