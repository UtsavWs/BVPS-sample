const ThankyouSlip = require("../models/ThankyouSlip");
const User = require("../models/User");

/**
 * POST /api/thankyouslip
 * Create a new Thank-You Slip.
 *   - givenBy  → logged-in user (req.user)
 *   - receivedBy → selected member from the form
 * Both users get the slip reference pushed into their respective arrays.
 *
 * Note: Input validation (required fields, types, enums) is handled
 * by Joi in the route middleware. This controller only has business logic checks.
 */
exports.addThankyouSlip = async (req, res) => {
  try {
    const { receivedBy, businessType, referenceType, reference, amount } =
      req.body;
    const givenBy = req.user._id;

    // Business logic: prevent self-slip
    if (receivedBy.toString() === givenBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a thank-you slip to yourself.",
      });
    }

    // Business logic: verify receiver exists and is active
    const receiver = await User.findById(receivedBy);
    if (!receiver || receiver.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    // Create the slip
    const slip = await ThankyouSlip.create({
      givenBy,
      receivedBy,
      businessType,
      referenceType,
      reference,
      amount,
    });

    // Push slip reference into both users
    await User.findByIdAndUpdate(givenBy, {
      $push: { thankyouslipGiven: slip._id },
    });

    await User.findByIdAndUpdate(receivedBy, {
      $push: { thankyouslipReceived: slip._id },
    });

    res.status(201).json({
      success: true,
      message: "Thank-you slip added successfully.",
      data: { slip },
    });
  } catch (err) {
    console.error("Add thank-you slip error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};

/**
 * GET /api/thankyouslip
 * Fetch the logged-in user's thank-you slips, split into `given` and `received`.
 * Each slip is populated with the counterparty's name and company.
 */
exports.getMyThankyouSlips = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields =
      "fullName businessInformation.companyName businessInformation.brandName";

    const [given, received] = await Promise.all([
      ThankyouSlip.find({ givenBy: userId })
        .populate("receivedBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      ThankyouSlip.find({ receivedBy: userId })
        .populate("givenBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: { given, received },
    });
  } catch (err) {
    console.error("Get thank-you slips error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
