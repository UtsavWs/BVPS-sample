import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Handshake,
  Share2,
  UserPlus,
  HeartHandshake,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import LoadingScreen from "../../components/ui/LoadingScreen";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../api/api";
import { formatDate } from "../../utils/dateUtils";

const DEFAULT_PROFILE_IMAGE = "/assets/logos/myProfile.svg";
const ACCENT = "#C94621";
const ACCENT_SOFT = "#FEF8F6";

const formatINR = (n) => {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

const formatMonthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const buildMonthOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({
      value: ym,
      label: d.toLocaleString("en-IN", { month: "short", year: "numeric" }),
    });
  }
  return opts;
};

const GrowthPill = ({ value }) => {
  if (value == null) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
        up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
};

const HeaderStat = ({ label, value, icon: Icon, color, bg }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-100 bg-white">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      <Icon size={16} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-stone-400 leading-none mb-1 truncate">
        {label}
      </p>
      <p className="text-[18px] font-bold text-gray-900 leading-none">
        {value ?? "—"}
      </p>
    </div>
  </div>
);

const TooltipBox = ({ active, payload, label, suffix, prefix, month }) => {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  const [y, m] = (month || "").split("-").map(Number);
  const dateLabel =
    y && m && label ? formatDate(new Date(y, m - 1, Number(label))) : `Day ${label}`;
  return (
    <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-stone-100 text-[11px]">
      <div className="text-stone-400">{dateLabel}</div>
      <div className="font-semibold text-gray-900">
        {prefix || ""}
        {typeof v === "number" ? v.toLocaleString("en-IN") : v}
        {suffix || ""}
      </div>
    </div>
  );
};

const Sparkline = ({ data, prefix, suffix, month }) => (
  <div className="-mx-2">
    <ResponsiveContainer width="100%" height={80} minWidth={0}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" hide />
        <Tooltip
          content={<TooltipBox prefix={prefix} suffix={suffix} month={month} />}
          cursor={{ stroke: ACCENT, strokeOpacity: 0.2, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#sparkFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const TopPerformerRow = ({ rank, name, image, primary, secondary }) => (
  <li className="flex items-center gap-2.5 py-1.5">
    <span
      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
      style={{
        background:
          rank === 1
            ? "#FEF3C7"
            : rank === 2
              ? "#E5E7EB"
              : rank === 3
                ? "#FED7AA"
                : ACCENT_SOFT,
        color:
          rank === 1
            ? "#92400E"
            : rank === 2
              ? "#374151"
              : rank === 3
                ? "#9A3412"
                : ACCENT,
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
    <div className="min-w-0 flex-1">
      <p className="text-[12.5px] font-semibold text-gray-900 truncate leading-tight">
        {name}
      </p>
      {secondary && (
        <p className="text-[10.5px] text-stone-400 leading-tight mt-0.5">
          {secondary}
        </p>
      )}
    </div>
    <span className="text-[12.5px] font-bold text-gray-900 tabular-nums shrink-0">
      {primary}
    </span>
  </li>
);

const CategoryCard = ({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  count,
  countLabel,
  growth,
  daily,
  performers,
  performerLabel,
  prefix,
  suffix,
  rightControl,
  month,
}) => (
  <div className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide leading-none">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <p className="text-[22px] font-bold text-gray-900 leading-none">
            {prefix || ""}
            {typeof count === "number" ? count.toLocaleString("en-IN") : count}
            {suffix || ""}
          </p>
          <GrowthPill value={growth} />
        </div>
        {countLabel && (
          <p className="text-[10.5px] text-stone-400 mt-1">{countLabel}</p>
        )}
      </div>
      {rightControl}
    </div>

    <Sparkline data={daily} prefix={prefix} suffix={suffix} month={month} />

    <div className="border-t border-stone-100 pt-2.5">
      <p className="text-[10.5px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
        {performerLabel || "Top 3 this month"}
      </p>
      {performers.length === 0 ? (
        <p className="text-[12px] text-stone-400 py-2">No activity yet.</p>
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

export default function BvpsDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [month, setMonth] = useState(monthOptions[0].value);
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [tysMode, setTysMode] = useState("amount"); // 'amount' | 'count'

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const fetchDashboard = useCallback(async () => {
    setFetching(true);
    const res = await apiGet(`/dashboard?month=${month}`);
    if (res.success) setData(res.data);
    setFetching(false);
  }, [month]);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user, fetchDashboard]);

  if (loading || !user) return <LoadingScreen />;

  const b2b = data?.b2b;
  const referrals = data?.referrals;
  const visitors = data?.visitors;
  const thankyou = data?.thankyou;
  const users = data?.users;

  const b2bPerformers =
    b2b?.topPerformers?.map((p) => ({ ...p, display: p.count })) || [];
  const referralPerformers =
    referrals?.topPerformers?.map((p) => ({ ...p, display: p.count })) || [];
  const visitorPerformers =
    visitors?.topPerformers?.map((p) => ({ ...p, display: p.count })) || [];

  const tysPerformers =
    tysMode === "amount"
      ? (thankyou?.topByAmount || []).map((p) => ({
          ...p,
          display: formatINR(p.amount),
          secondary: `${p.count} slip${p.count === 1 ? "" : "s"}`,
        }))
      : (thankyou?.topByCount || []).map((p) => ({
          ...p,
          display: p.count,
        }));

  return (
    <div className="min-h-screen bg-[#F9EDE8] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-4 flex items-center gap-4 z-10 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1 text-gray-800 hover:text-[#C94621] transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={21} strokeWidth={2.2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-none">
            Dashboard
          </h1>
          {data?.month && (
            <p className="text-[11.5px] text-stone-400 mt-0.5">
              {formatMonthLabel(data.month)}
            </p>
          )}
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-gray-800 outline-none focus:border-[#C94621] cursor-pointer"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-5">
        {fetching && !data ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-7 h-7 rounded-full border-[3px] border-[#C94621]/20 border-t-[#C94621] animate-spin" />
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-stone-400">
            Failed to load dashboard.
          </div>
        ) : (
          <div className="w-full max-w-[1650px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
              <CategoryCard
                title="B2B Meetings"
                icon={Handshake}
                iconColor={ACCENT}
                iconBg={ACCENT_SOFT}
                count={b2b.count}
                growth={b2b.growth}
                daily={b2b.daily}
                performers={b2bPerformers}
                performerLabel="Top 3 givers"
                month={data.month}
              />
              <CategoryCard
                title="Referrals"
                icon={Share2}
                iconColor="#2563eb"
                iconBg="#eff6ff"
                count={referrals.count}
                growth={referrals.growth}
                daily={referrals.daily}
                performers={referralPerformers}
                performerLabel="Top 3 givers"
                month={data.month}
              />
              <CategoryCard
                title="Visitors"
                icon={UserPlus}
                iconColor="#16a34a"
                iconBg="#f0fdf4"
                count={visitors.count}
                countLabel="Approved this month"
                growth={visitors.growth}
                daily={visitors.daily}
                performers={visitorPerformers}
                performerLabel="Top 3 by visitors brought"
                month={data.month}
              />
              <CategoryCard
                title="Thank-you Slips"
                icon={HeartHandshake}
                iconColor="#9333ea"
                iconBg="#faf5ff"
                count={
                  tysMode === "amount"
                    ? formatINR(thankyou.amount)
                    : thankyou.count
                }
                growth={
                  tysMode === "amount"
                    ? thankyou.amountGrowth
                    : thankyou.countGrowth
                }
                daily={
                  tysMode === "amount" ? thankyou.daily : thankyou.dailyCount
                }
                performers={tysPerformers}
                performerLabel={
                  tysMode === "amount" ? "Top 3 by amount" : "Top 3 by count"
                }
                prefix=""
                suffix=""
                month={data.month}
                rightControl={
                  <div className="flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5 shrink-0">
                    {["amount", "count"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTysMode(m)}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer border-none ${
                          tysMode === m
                            ? "bg-white text-gray-900 shadow-sm"
                            : "bg-transparent text-stone-500"
                        }`}
                      >
                        {m === "amount" ? "₹" : "#"}
                      </button>
                    ))}
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
