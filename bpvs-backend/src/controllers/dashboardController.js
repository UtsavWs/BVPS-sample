const User = require("../models/User");
const B2b = require("../models/B2b");
const Referral = require("../models/Referral");
const Visitor = require("../models/Visitor");
const ThankyouSlip = require("../models/ThankyouSlip");

/**
 * GET /api/dashboard?month=YYYY-MM
 * Aggregated chapter dashboard: per-category counts, growth vs prev month,
 * daily sparklines, and top 3 performers (givers / addedBy).
 * For Thank-you, returns top by count AND by amount.
 * Visible to all logged-in users (members, subadmins, admins).
 */
exports.getDashboard = async (req, res) => {
  try {
    const monthParam = req.query.month;
    const now = new Date();
    const [yr, mo] = monthParam
      ? monthParam.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    if (!yr || !mo || mo < 1 || mo > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid month. Use YYYY-MM." });
    }

    const start = new Date(yr, mo - 1, 1);
    const end = new Date(yr, mo, 1);
    const prevStart = new Date(yr, mo - 2, 1);
    const prevEnd = start;
    const daysInMonth = new Date(yr, mo, 0).getDate();

    const roleFilter = { $in: ["member", "subadmin"] };

    const dailyBuckets = (matchField) => [
      { $match: { [matchField]: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: `$${matchField}` },
          count: { $sum: 1 },
        },
      },
    ];

    const dailyAmountBuckets = (matchField) => [
      { $match: { [matchField]: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: `$${matchField}` },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ];

    const topPerformers = (field) => [
      { $match: { activityDate: { $gte: start, $lt: end } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
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
      {
        $group: {
          _id: "$givenBy",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
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

    const [
      userTotal,
      userActive,
      userInactive,
      newUsersThisMonth,
      newUsersPrevMonth,
      b2bThis,
      b2bPrev,
      refThis,
      refPrev,
      visThis,
      visPrev,
      tysThis,
      tysPrev,
      b2bDaily,
      refDaily,
      visDaily,
      tysDaily,
      topB2b,
      topRef,
      topVis,
      topTysByCount,
      topTysByAmount,
    ] = await Promise.all([
      User.countDocuments({ role: roleFilter }),
      User.countDocuments({ role: roleFilter, status: "active" }),
      User.countDocuments({ role: roleFilter, status: "inactive" }),
      User.countDocuments({
        role: roleFilter,
        createdAt: { $gte: start, $lt: end },
      }),
      User.countDocuments({
        role: roleFilter,
        createdAt: { $gte: prevStart, $lt: prevEnd },
      }),
      B2b.countDocuments({ activityDate: { $gte: start, $lt: end } }),
      B2b.countDocuments({ activityDate: { $gte: prevStart, $lt: prevEnd } }),
      Referral.countDocuments({ activityDate: { $gte: start, $lt: end } }),
      Referral.countDocuments({
        activityDate: { $gte: prevStart, $lt: prevEnd },
      }),
      Visitor.countDocuments({
        status: "approved",
        activityDate: { $gte: start, $lt: end },
      }),
      Visitor.countDocuments({
        status: "approved",
        activityDate: { $gte: prevStart, $lt: prevEnd },
      }),
      ThankyouSlip.aggregate([
        { $match: { activityDate: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      ThankyouSlip.aggregate([
        { $match: { activityDate: { $gte: prevStart, $lt: prevEnd } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      B2b.aggregate(dailyBuckets("activityDate")),
      Referral.aggregate(dailyBuckets("activityDate")),
      Visitor.aggregate([
        {
          $match: {
            status: "approved",
            activityDate: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$activityDate" },
            count: { $sum: 1 },
          },
        },
      ]),
      ThankyouSlip.aggregate(dailyAmountBuckets("activityDate")),
      B2b.aggregate(topPerformers("givenBy")),
      Referral.aggregate(topPerformers("givenBy")),
      Visitor.aggregate([
        {
          $match: {
            status: "approved",
            activityDate: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: "$addedBy", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
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
      ]),
      ThankyouSlip.aggregate(topPerformers("givenBy")),
      ThankyouSlip.aggregate(topThankyouByAmount),
    ]);

    const fillDaily = (rows, key = "count") => {
      const map = new Map(rows.map((r) => [r._id, r[key]]));
      return Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        value: map.get(i + 1) || 0,
      }));
    };

    const growth = (curr, prev) => {
      if (!prev) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const tysThisVals = tysThis[0] || { count: 0, amount: 0 };
    const tysPrevVals = tysPrev[0] || { count: 0, amount: 0 };

    res.status(200).json({
      success: true,
      data: {
        month: `${yr}-${String(mo).padStart(2, "0")}`,
        users: {
          total: userTotal,
          active: userActive,
          inactive: userInactive,
          newThisMonth: newUsersThisMonth,
          growth: growth(newUsersThisMonth, newUsersPrevMonth),
        },
        b2b: {
          count: b2bThis,
          growth: growth(b2bThis, b2bPrev),
          daily: fillDaily(b2bDaily),
          topPerformers: topB2b,
        },
        referrals: {
          count: refThis,
          growth: growth(refThis, refPrev),
          daily: fillDaily(refDaily),
          topPerformers: topRef,
        },
        visitors: {
          count: visThis,
          growth: growth(visThis, visPrev),
          daily: fillDaily(visDaily),
          topPerformers: topVis,
        },
        thankyou: {
          count: tysThisVals.count,
          amount: tysThisVals.amount,
          countGrowth: growth(tysThisVals.count, tysPrevVals.count),
          amountGrowth: growth(tysThisVals.amount, tysPrevVals.amount),
          daily: fillDaily(tysDaily, "amount"),
          dailyCount: fillDaily(tysDaily, "count"),
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
