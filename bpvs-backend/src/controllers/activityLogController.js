const ThankyouSlip = require("../models/ThankyouSlip");
const Referral = require("../models/Referral");
const B2b = require("../models/B2b");

/**
 * GET /api/activity-log
 * Paginated, merged activity feed for the current user.
 * Query params:
 *   tab        - "Given" | "Received" (default "Given")
 *   page       - 1-based page number (default 1)
 *   limit      - items per page (default 20, max 100)
 *   startDate  - ISO date (inclusive) — applied to createdAt
 *   endDate    - ISO date (inclusive)
 *
 * The feed is sorted/filtered by `createdAt` (when the entry was logged).
 * `activityDate` is data that travels along on each record for the UI to
 * display, but it never drives sorting or filtering here.
 */
exports.getMyActivityLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const tab = req.query.tab === "Received" ? "Received" : "Given";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const { startDate, endDate } = req.query;

    const matchField = tab === "Given" ? "givenBy" : "receivedBy";
    const populateField = tab === "Given" ? "receivedBy" : "givenBy";
    const populateFields =
      "fullName businessInformation.companyName businessInformation.brandName";

    const filter = { [matchField]: userId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d)) {
          d.setHours(0, 0, 0, 0);
          filter.createdAt.$gte = d;
        }
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d)) {
          d.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = d;
        }
      }
    }

    // Over-fetch from each collection so we can merge-sort across them and
    // slice the requested page. Acceptable while per-user activity volume
    // stays modest; switch to a $unionWith cursor approach if it grows.
    const fetchLimit = page * limit;

    const [
      slipCount,
      refCount,
      b2bCount,
      givenSlipTotal,
      givenRefTotal,
      givenB2bTotal,
      receivedSlipTotal,
      receivedRefTotal,
      receivedB2bTotal,
      slips,
      refs,
      b2bs,
    ] = await Promise.all([
      ThankyouSlip.countDocuments(filter),
      Referral.countDocuments(filter),
      B2b.countDocuments(filter),
      ThankyouSlip.countDocuments({ givenBy: userId }),
      Referral.countDocuments({ givenBy: userId }),
      B2b.countDocuments({ givenBy: userId }),
      ThankyouSlip.countDocuments({ receivedBy: userId }),
      Referral.countDocuments({ receivedBy: userId }),
      B2b.countDocuments({ receivedBy: userId }),
      ThankyouSlip.find(filter)
        .populate(populateField, populateFields)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean(),
      Referral.find(filter)
        .populate(populateField, populateFields)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean(),
      B2b.find(filter)
        .populate(populateField, populateFields)
        .sort({ createdAt: -1 })
        .limit(fetchLimit)
        .lean(),
    ]);

    const total = slipCount + refCount + b2bCount;

    const merged = [
      ...slips.map((s) => ({ ...s, logType: "thankyouslip" })),
      ...refs.map((r) => ({ ...r, logType: "referral" })),
      ...b2bs.map((b) => ({ ...b, logType: "b2b" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIdx = (page - 1) * limit;
    const items = merged.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      data: {
        tab,
        items,
        totals: {
          given: givenSlipTotal + givenRefTotal + givenB2bTotal,
          received: receivedSlipTotal + receivedRefTotal + receivedB2bTotal,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (err) {
    console.error("Get activity log error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
