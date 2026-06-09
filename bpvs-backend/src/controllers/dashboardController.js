const User = require("../models/User");
const B2b = require("../models/B2b");
const Referral = require("../models/Referral");
const Visitor = require("../models/Visitor");
const ThankyouSlip = require("../models/ThankyouSlip");

const ONE_DAY = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Server timezone offset as a Mongo "+05:30"-style string so $dateToString
// buckets activities by the SAME calendar day the range boundaries use.
const tzString = () => {
  const off = -new Date().getTimezoneOffset(); // minutes; IST → 330
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

/**
 * GET /api/dashboard
 * Supports either:
 *   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD   (date range — inclusive)
 *   ?month=YYYY-MM                             (single month — legacy)
 *   (no params)                                → current month
 *
 * Returns chapter-wide ("for all" members) cumulative stats over the window:
 * a summary (totals + growth), a combined daily trend, and per-category
 * counts, growth vs the equal-length preceding period, daily series, and
 * top-3 performers. Visible to all logged-in users.
 */
exports.getDashboard = async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    const now = new Date();

    // ── Resolve [start, end) window (end exclusive) ──────────────────────────
    let start, end, label;
    if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split("-").map(Number);
      const [ey, em, ed] = endDate.split("-").map(Number);
      if (!sy || !sm || !sd || !ey || !em || !ed)
        return res.status(400).json({ success: false, message: "Invalid date range." });
      start = new Date(sy, sm - 1, sd);
      end = new Date(ey, em - 1, ed + 1); // make endDate inclusive
      if (end <= start)
        return res.status(400).json({ success: false, message: "End date must be on or after start date." });
      label = `${isoDay(start)} → ${endDate}`;
    } else if (month) {
      const [yr, mo] = month.split("-").map(Number);
      if (!yr || !mo || mo < 1 || mo > 12)
        return res.status(400).json({ success: false, message: "Invalid month. Use YYYY-MM." });
      start = new Date(yr, mo - 1, 1);
      end = new Date(yr, mo, 1);
      label = month;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      label = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    }

    // Equal-length preceding window (for growth %)
    const spanMs = end - start;
    const prevStart = new Date(start.getTime() - spanMs);
    const prevEnd = start;

    const tz = tzString();
    const roleFilter = { $in: ["member", "subadmin"] };

    // Ordered list of calendar days in the window (drives sparklines + trend)
    const dayList = [];
    for (let c = new Date(start); c < end; c.setDate(c.getDate() + 1)) dayList.push(isoDay(c));

    // ── Aggregation building blocks ──────────────────────────────────────────
    const dailyCount = (field, extraMatch = {}) => [
      { $match: { [field]: { $gte: start, $lt: end }, ...extraMatch } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: tz } },
          value: { $sum: 1 },
        },
      },
    ];

    const dailyAmount = (field) => [
      { $match: { [field]: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: tz } },
          value: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ];

    const topPerformers = (field, extraMatch = {}) => [
      { $match: { activityDate: { $gte: start, $lt: end }, ...extraMatch } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          count: 1,
          fullName: "$user.fullName",
          profileImage: "$user.profileImage",
        },
      },
    ];

    const topThankyouByAmount = [
      { $match: { activityDate: { $gte: start, $lt: end } } },
      { $group: { _id: "$givenBy", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
      { $limit: 3 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          amount: 1,
          count: 1,
          fullName: "$user.fullName",
          profileImage: "$user.profileImage",
        },
      },
    ];

    const sumAmount = (match) => [
      { $match: match },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ];

    const approved = { status: "approved" };

    // ── Fire everything in parallel ──────────────────────────────────────────
    const [
      userTotal, userActive, userInactive, newUsers, newUsersPrev,
      b2bThis, b2bPrev, refThis, refPrev, visThis, visPrev,
      tysThisAgg, tysPrevAgg,
      b2bDaily, refDaily, visDaily, tysDaily,
      topB2b, topRef, topVis, topTysByCount, topTysByAmount,
      memberDailyAgg, membersBefore,
    ] = await Promise.all([
      User.countDocuments({ role: roleFilter }),
      User.countDocuments({ role: roleFilter, status: "active" }),
      User.countDocuments({ role: roleFilter, status: "inactive" }),
      User.countDocuments({ role: roleFilter, createdAt: { $gte: start, $lt: end } }),
      User.countDocuments({ role: roleFilter, createdAt: { $gte: prevStart, $lt: prevEnd } }),
      B2b.countDocuments({ activityDate: { $gte: start, $lt: end } }),
      B2b.countDocuments({ activityDate: { $gte: prevStart, $lt: prevEnd } }),
      Referral.countDocuments({ activityDate: { $gte: start, $lt: end } }),
      Referral.countDocuments({ activityDate: { $gte: prevStart, $lt: prevEnd } }),
      Visitor.countDocuments({ ...approved, activityDate: { $gte: start, $lt: end } }),
      Visitor.countDocuments({ ...approved, activityDate: { $gte: prevStart, $lt: prevEnd } }),
      ThankyouSlip.aggregate(sumAmount({ activityDate: { $gte: start, $lt: end } })),
      ThankyouSlip.aggregate(sumAmount({ activityDate: { $gte: prevStart, $lt: prevEnd } })),
      B2b.aggregate(dailyCount("activityDate")),
      Referral.aggregate(dailyCount("activityDate")),
      Visitor.aggregate(dailyCount("activityDate", approved)),
      ThankyouSlip.aggregate(dailyAmount("activityDate")),
      B2b.aggregate(topPerformers("givenBy")),
      Referral.aggregate(topPerformers("givenBy")),
      Visitor.aggregate(topPerformers("addedBy", approved)),
      ThankyouSlip.aggregate(topPerformers("givenBy")),
      ThankyouSlip.aggregate(topThankyouByAmount),
      User.aggregate(dailyCount("createdAt", { role: roleFilter })),
      User.countDocuments({ role: roleFilter, createdAt: { $lt: start } }),
    ]);

    // ── Shape series ─────────────────────────────────────────────────────────
    const toMap = (rows, key = "value") => new Map(rows.map((r) => [r._id, r[key]]));
    const fill = (rows, key = "value") => {
      const m = toMap(rows, key);
      return dayList.map((d) => ({ date: d, value: m.get(d) || 0 }));
    };

    const b2bMap = toMap(b2bDaily);
    const refMap = toMap(refDaily);
    const visMap = toMap(visDaily);
    const tysCountMap = toMap(tysDaily);
    const tysAmountMap = toMap(tysDaily, "amount");

    const trend = dayList.map((d) => ({
      date: d,
      b2b: b2bMap.get(d) || 0,
      referrals: refMap.get(d) || 0,
      visitors: visMap.get(d) || 0,
      thankyou: tysCountMap.get(d) || 0,
    }));

    const growth = (curr, prev) => {
      if (!prev) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const tysThis = tysThisAgg[0] || { count: 0, amount: 0 };
    const tysPrev = tysPrevAgg[0] || { count: 0, amount: 0 };

    const totalThis = b2bThis + refThis + visThis + tysThis.count;
    const totalPrev = b2bPrev + refPrev + visPrev + tysPrev.count;

    res.status(200).json({
      success: true,
      data: {
        range: { start: isoDay(start), end: isoDay(new Date(end - ONE_DAY)), days: dayList.length, label },
        summary: {
          totalActivities: totalThis,
          activitiesGrowth: growth(totalThis, totalPrev),
          businessValue: tysThis.amount,
          businessValueGrowth: growth(tysThis.amount, tysPrev.amount),
          members: {
            total: userTotal,
            active: userActive,
            inactive: userInactive,
            newThisPeriod: newUsers,
            growth: growth(newUsers, newUsersPrev),
            newDaily: fill(memberDailyAgg), // new members joined per day
            beforeCount: membersBefore, // members existing before the window (seeds cumulative)
          },
        },
        trend,
        b2b: { count: b2bThis, growth: growth(b2bThis, b2bPrev), daily: fill(b2bDaily), topPerformers: topB2b },
        referrals: { count: refThis, growth: growth(refThis, refPrev), daily: fill(refDaily), topPerformers: topRef },
        visitors: { count: visThis, growth: growth(visThis, visPrev), daily: fill(visDaily), topPerformers: topVis },
        thankyou: {
          count: tysThis.count,
          amount: tysThis.amount,
          countGrowth: growth(tysThis.count, tysPrev.count),
          amountGrowth: growth(tysThis.amount, tysPrev.amount),
          daily: dayList.map((d) => ({ date: d, value: tysAmountMap.get(d) || 0 })),
          dailyCount: fill(tysDaily),
          topByCount: topTysByCount,
          topByAmount: topTysByAmount,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
