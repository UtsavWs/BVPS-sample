const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const MONTHS_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Backend Date/ISO → "04 Mar, 2026"
export const formatDateDisplay = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
};

// "04 Mar, 2026" → Date object (for sending to backend)
export const parseDateDisplay = (dateStr) => {
  if (!dateStr) return null;
  const monthMap = Object.fromEntries(MONTHS_SHORT.map((m, i) => [m, i]));
  const parts = dateStr.match(/(\d{2})\s+(\w+),\s+(\d{4})/);
  if (!parts) return null;
  // Set time to noon to prevent timezone shifts when converting to UTC
  const date = new Date(Number(parts[3]), monthMap[parts[2]], parseInt(parts[1]), 12, 0, 0);
  return date;
};

// Format a {d, m, y} selection → "04 Mar, 2026"
export const formatSel = (sel) =>
  sel
    ? `${String(sel.d).padStart(2, "0")} ${MONTHS_SHORT[sel.m]}, ${sel.y}`
    : null;

// Compare two {d, m, y} selections. Returns -1, 0, or 1.
export const compareSel = (a, b) => {
  if (!a || !b) return 0;
  const da = new Date(a.y, a.m, a.d);
  const db = new Date(b.y, b.m, b.d);
  return da < db ? -1 : da > db ? 1 : 0;
};

// Calendar grid math for a given year/month
export const getCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const total = firstDay + daysInMonth;
  const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
  return { firstDay, daysInMonth, daysInPrev, remainder };
};

// Export arrays so DatePicker and other components import from one place
export { MONTHS_SHORT, MONTHS_FULL, WEEKDAYS };