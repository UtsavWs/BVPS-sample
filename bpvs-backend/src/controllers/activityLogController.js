const ThankyouSlip = require("../models/ThankyouSlip");
const Referral = require("../models/Referral");
const B2b = require("../models/B2b");

/**
 * GET /api/activity-log
 * Returns the logged-in user's thank-you slips, referrals, and B2B entries
 * (split into given/received) in a single response — all queries run in parallel.
 */
exports.getMyActivityLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const populateFields =
      "fullName businessInformation.companyName businessInformation.brandName";

    const [
      slipGiven,
      slipReceived,
      referralGiven,
      referralReceived,
      b2bGiven,
      b2bReceived,
    ] = await Promise.all([
      ThankyouSlip.find({ givenBy: userId })
        .populate("receivedBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      ThankyouSlip.find({ receivedBy: userId })
        .populate("givenBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      Referral.find({ givenBy: userId })
        .populate("receivedBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      Referral.find({ receivedBy: userId })
        .populate("givenBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      B2b.find({ addedBy: userId })
        .populate("memberId", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      B2b.find({ memberId: userId })
        .populate("addedBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        thankyouslip: { given: slipGiven, received: slipReceived },
        referrals: { given: referralGiven, received: referralReceived },
        b2b: { given: b2bGiven, received: b2bReceived },
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
