import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Handshake,
  Share2,
  UserPlus,
  HeartHandshake,
  Activity,
  IndianRupee,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import LoadingScreen from "../../components/ui/LoadingScreen";
import DatePicker from "../../components/forms/DatePicker";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../api/api";
import {
  formatDate,
  formatISODate,
  parseDateDisplay,
  MONTHS_SHORT,
} from "../../utils/dateUtils";

// ─── Palette (matches the existing app) ───────────────────────────────────────
const ACCENT = "#C94621";
const BG = "#F9EDE8";

const SERIES = {
  b2b: { key: "b2b", color: "#C94621", soft: "#FEF8F6", label: "B2B Meetings", icon: Handshake },
  referrals: { key: "referrals", color: "#2563EB", soft: "#EFF6FF", label: "Referrals", icon: Share2 },
  visitors: { key: "visitors", color: "#16A34A", soft: "#F0FDF4", label: "Visitors", icon: UserPlus },
  thankyou: { key: "thankyou", color: "#9333EA", soft: "#FAF5FF", label: "Thank-You", icon: HeartHandshake },
};

const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR = (n) => {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

const dayLabel = (iso) => {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
};

const fullDayLabel = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return formatDate(new Date(y, m - 1, d));
};

const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Quick-range presets, all ending today.
const buildPresets = () => {
  const today = atMidnight(new Date());
  return [
    { key: "month", label: "This Month", start: new Date(today.getFullYear(), today.getMonth(), 1), end: today },
    { key: "30d", label: "Last 30 Days", start: addDays(today, -29), end: today },
    { key: "90d", label: "Last 90 Days", start: addDays(today, -89), end: today },
    { key: "year", label: "This Year", start: new Date(today.getFullYear(), 0, 1), end: today },
  ];
};

// ─── Small UI atoms ───────────────────────────────────────────────────────────
const GrowthPill = ({ value, size = "sm" }) => {
  if (value == null) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const pad = size === "lg" ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md font-semibold ${pad} ${
        up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      <Icon size={size === "lg" ? 13 : 11} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
};

const KpiCard = ({ icon, label, value, sub, growth, color, soft, spark, sparkFormat }) => {
  const Icon = icon;
  return (
  <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
    <div
      className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.18]"
      style={{ background: color }}
    />
    <div className="flex items-center justify-between relative">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: soft }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <GrowthPill value={growth} />
    </div>
    <div className="relative">
      <p className="text-[26px] sm:text-[28px] font-extrabold text-gray-900 leading-none tracking-tight">
        {value}
      </p>
      <p className="text-[12px] font-semibold text-stone-500 mt-1.5">{label}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
    {spark && spark.length > 0 && (
      <div className="mt-auto relative">
        <KpiSpark data={spark} color={color} formatter={sparkFormat} />
      </div>
    )}
  </div>
  );
};

const PresetChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer border ${
      active
        ? "bg-[#C94621] text-white border-[#C94621] shadow-sm"
        : "bg-white text-stone-600 border-stone-200 hover:border-[#C94621]/40 hover:text-[#C94621]"
    }`}
  >
    {children}
  </button>
);

const TopPerformerRow = ({ rank, name, image, primary, secondary }) => (
  <li className="flex items-center gap-2.5 py-1.5">
    <span
      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
      style={{
        background: rank === 1 ? "#FEF3C7" : rank === 2 ? "#E5E7EB" : "#FED7AA",
        color: rank === 1 ? "#92400E" : rank === 2 ? "#374151" : "#9A3412",
      }}
    >
      {rank}
    </span>
    <img
      src={image || DEFAULT_PROFILE_IMAGE}
      alt={name}
      className="w-7 h-7 rounded-lg object-cover shrink-0"
      style={{ border: "1px solid #F3F4F6" }}
    />
    <p className="text-[12.5px] font-semibold text-gray-900 truncate leading-tight flex-1 min-w-0">
      {name}
    </p>
    {secondary && <span className="text-[10.5px] text-stone-400 shrink-0">{secondary}</span>}
    <span className="text-[12.5px] font-bold text-gray-900 tabular-nums shrink-0">{primary}</span>
  </li>
);

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-stone-100 text-[11.5px] min-w-[140px]">
      <div className="text-stone-400 font-medium mb-1.5">{fullDayLabel(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {SERIES[p.dataKey]?.label || p.dataKey}
          </span>
          <span className="font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t border-stone-100">
        <span className="text-stone-500 font-medium">Total</span>
        <span className="font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
};

const SparkTooltip = ({ active, payload, label, prefix, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  const text = formatter
    ? formatter(v)
    : `${prefix || ""}${typeof v === "number" ? v.toLocaleString("en-IN") : v}`;
  return (
    <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-stone-100 text-[11px]">
      <div className="text-stone-400">{fullDayLabel(label)}</div>
      <div className="font-semibold text-gray-900">{text}</div>
    </div>
  );
};

// Tiny trend line shown inside each KPI card.
const KpiSpark = ({ data, color, formatter }) => {
  const id = `kpi-${color.replace("#", "")}`;
  return (
    <div className="-mx-1 mt-1 relative">
      <ResponsiveContainer width="100%" height={42}>
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <Tooltip
            content={<SparkTooltip formatter={formatter} />}
            cursor={{ stroke: color, strokeOpacity: 0.25 }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.8} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Category card ────────────────────────────────────────────────────────────
const CategoryCard = ({ meta, count, growth, daily, performers, performerLabel, prefix, rightControl }) => {
  const Icon = meta.icon;
  const id = `spark-${meta.key}`;
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.soft }}>
          <Icon size={16} style={{ color: meta.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide leading-none">
            {meta.label}
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-[22px] font-bold text-gray-900 leading-none">
              {prefix || ""}
              {typeof count === "number" ? count.toLocaleString("en-IN") : count}
            </p>
            <GrowthPill value={growth} />
          </div>
        </div>
        {rightControl}
      </div>

      <div className="-mx-2">
        <ResponsiveContainer width="100%" height={70} minWidth={0}>
          <AreaChart data={daily} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip content={<SparkTooltip prefix={prefix} />} cursor={{ stroke: meta.color, strokeOpacity: 0.2 }} />
            <Area type="monotone" dataKey="value" stroke={meta.color} strokeWidth={2} fill={`url(#${id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-stone-100 pt-2.5">
        <p className="text-[10.5px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
          {performerLabel}
        </p>
        {performers.length === 0 ? (
          <p className="text-[12px] text-stone-400 py-2">No activity in this period.</p>
        ) : (
          <ul className="divide-y divide-stone-50">
            {performers.map((p, idx) => (
              <TopPerformerRow
                key={p.userId || idx}
                rank={idx + 1}
                name={p.fullName || "—"}
                image={p.profileImage}
                primary={p.display}
                secondary={p.secondary}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BvpsDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const presets = useMemo(() => buildPresets(), []);
  const [range, setRange] = useState(() => ({
    start: presets[0].start,
    end: presets[0].end,
    presetKey: "month",
  }));
  const [showPicker, setShowPicker] = useState(false);
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [tysMode, setTysMode] = useState("amount"); // 'amount' | 'count'

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setFetching(true);
      const qs = `startDate=${formatISODate(range.start)}&endDate=${formatISODate(range.end)}`;
      const res = await apiGet(`/dashboard?${qs}`);
      if (!active) return;
      if (res.success) setData(res.data);
      setFetching(false);
    })();
    return () => {
      active = false;
    };
  }, [user, range.start, range.end]);

  const applyPreset = (p) => setRange({ start: p.start, end: p.end, presetKey: p.key });

  const handleRangeConfirm = ({ start, end }) => {
    const s = parseDateDisplay(start);
    const e = parseDateDisplay(end);
    if (s && e) setRange({ start: atMidnight(s), end: atMidnight(e), presetKey: "custom" });
  };

  if (loading || !user) return <LoadingScreen />;

  const summary = data?.summary;
  const members = summary?.members;
  const trend = data?.trend || [];

  const perf = (arr) => (arr || []).map((p) => ({ ...p, display: p.count }));
  const tysPerformers =
    tysMode === "amount"
      ? (data?.thankyou?.topByAmount || []).map((p) => ({
          ...p,
          display: formatINR(p.amount),
          secondary: `${p.count} slip${p.count === 1 ? "" : "s"}`,
        }))
      : (data?.thankyou?.topByCount || []).map((p) => ({ ...p, display: p.count }));

  const tickInterval = Math.max(0, Math.floor(trend.length / 7));
  const hasActivity = (summary?.totalActivities || 0) > 0;

  // ── Per-KPI mini trend series ──
  const activitiesDaily = trend.map((d) => ({
    date: d.date,
    value: d.b2b + d.referrals + d.visitors + d.thankyou,
  }));
  const valueDaily = data?.thankyou?.daily || []; // daily ₹ amount
  const newMembersDaily = members?.newDaily || [];
  // Active/total members over time = members before the window + running new joins.
  const membersBefore = members?.beforeCount || 0;
  const activeMembersDaily = newMembersDaily.reduce((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1].value : membersBefore;
    acc.push({ date: d.date, value: prev + d.value });
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* ── Header ── */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-4 flex items-center gap-4 z-10 shrink-0 sticky top-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1 text-gray-800 hover:text-[#C94621] transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-none flex items-center gap-2">
            Chapter Dashboard
            <Sparkles size={15} className="text-[#C94621]" />
          </h1>
          <p className="text-[11.5px] text-stone-400 mt-1">
            {data?.range
              ? `${fullDayLabel(data.range.start)} – ${fullDayLabel(data.range.end)} · ${data.range.days} days`
              : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-gray-800 hover:border-[#C94621] hover:text-[#C94621] transition cursor-pointer"
        >
          <Calendar size={15} />
          <span className="hidden sm:inline">
            {formatDate(range.start)} – {formatDate(range.end)}
          </span>
          <span className="sm:hidden">Range</span>
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-5">
        <div className="w-full max-w-[1650px] mx-auto flex flex-col gap-4 sm:gap-5">
          {/* ── Preset chips ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {presets.map((p) => (
              <PresetChip key={p.key} active={range.presetKey === p.key} onClick={() => applyPreset(p)}>
                {p.label}
              </PresetChip>
            ))}
            <PresetChip active={range.presetKey === "custom"} onClick={() => setShowPicker(true)}>
              Custom…
            </PresetChip>
          </div>

          {fetching && !data ? (
            <div className="flex items-center justify-center py-28">
              <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
            </div>
          ) : !data ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400">
              Failed to load dashboard.
            </div>
          ) : (
            <>
              {/* ── Hero KPI row ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                  icon={Activity}
                  label="Total Activities"
                  sub="across all members"
                  value={summary.totalActivities.toLocaleString("en-IN")}
                  growth={summary.activitiesGrowth}
                  color={ACCENT}
                  soft="#FEF8F6"
                  spark={activitiesDaily}
                  sparkFormat={(v) => `${v} activit${v === 1 ? "y" : "ies"}`}
                />
                <KpiCard
                  icon={IndianRupee}
                  label="Business Value"
                  sub="thank-you slips"
                  value={formatINR(summary.businessValue)}
                  growth={summary.businessValueGrowth}
                  color="#9333EA"
                  soft="#FAF5FF"
                  spark={valueDaily}
                  sparkFormat={formatINR}
                />
                <KpiCard
                  icon={Users}
                  label="Active Members"
                  sub={`${members.total} total · ${members.inactive} inactive`}
                  value={members.active.toLocaleString("en-IN")}
                  color="#16A34A"
                  soft="#F0FDF4"
                  spark={activeMembersDaily}
                  sparkFormat={(v) => `${v} members`}
                />
                <KpiCard
                  icon={UserPlus}
                  label="New Members"
                  sub="joined this period"
                  value={members.newThisPeriod.toLocaleString("en-IN")}
                  growth={members.growth}
                  color="#2563EB"
                  soft="#EFF6FF"
                  spark={newMembersDaily}
                  sparkFormat={(v) => `${v} new`}
                />
              </div>

              {/* ── Trend centerpiece ── */}
              <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">Activity Trend</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Daily activity across all categories</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {Object.values(SERIES).map((s) => (
                      <span key={s.key} className="flex items-center gap-1.5 text-[11.5px] font-medium text-stone-500">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {hasActivity ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        {Object.values(SERIES).map((s) => (
                          <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1ECE9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={dayLabel}
                        interval={tickInterval}
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickLine={false}
                        axisLine={{ stroke: "#F1ECE9" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <Tooltip content={<TrendTooltip />} cursor={{ stroke: ACCENT, strokeOpacity: 0.15, strokeWidth: 1 }} />
                      {Object.values(SERIES).map((s) => (
                        <Area
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          stackId="1"
                          stroke={s.color}
                          strokeWidth={1.5}
                          fill={`url(#grad-${s.key})`}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#FEF8F6] flex items-center justify-center">
                      <Activity size={22} className="text-[#C94621]" />
                    </div>
                    <p className="text-[13px] font-semibold text-gray-700">No activity in this period</p>
                    <p className="text-[11.5px] text-stone-400 max-w-[260px]">
                      Try a wider date range, or add referrals, B2Bs, visitors and thank-you slips.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Category cards ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <CategoryCard
                  meta={SERIES.b2b}
                  count={data.b2b.count}
                  growth={data.b2b.growth}
                  daily={data.b2b.daily}
                  performers={perf(data.b2b.topPerformers)}
                  performerLabel="Top 3 givers"
                />
                <CategoryCard
                  meta={SERIES.referrals}
                  count={data.referrals.count}
                  growth={data.referrals.growth}
                  daily={data.referrals.daily}
                  performers={perf(data.referrals.topPerformers)}
                  performerLabel="Top 3 givers"
                />
                <CategoryCard
                  meta={SERIES.visitors}
                  count={data.visitors.count}
                  growth={data.visitors.growth}
                  daily={data.visitors.daily}
                  performers={perf(data.visitors.topPerformers)}
                  performerLabel="Top 3 by visitors brought"
                />
                <CategoryCard
                  meta={SERIES.thankyou}
                  count={tysMode === "amount" ? formatINR(data.thankyou.amount) : data.thankyou.count}
                  growth={tysMode === "amount" ? data.thankyou.amountGrowth : data.thankyou.countGrowth}
                  daily={tysMode === "amount" ? data.thankyou.daily : data.thankyou.dailyCount}
                  performers={tysPerformers}
                  performerLabel={tysMode === "amount" ? "Top 3 by amount" : "Top 3 by count"}
                  prefix=""
                  rightControl={
                    <div className="flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5 shrink-0">
                      {["amount", "count"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setTysMode(m)}
                          className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer border-none ${
                            tysMode === m ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-stone-500"
                          }`}
                        >
                          {m === "amount" ? "₹" : "#"}
                        </button>
                      ))}
                    </div>
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showPicker && (
        <DatePicker
          mode="range"
          onConfirm={handleRangeConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
