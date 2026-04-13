const Referral = require("../models/Referral");
const User = require("../models/User");

/**
 * POST /api/referrals
 * Create a new referral.
 *   - givenBy  → logged-in user (req.user)
 *   - receivedBy → selected member from the form
 * Both users get the referral reference pushed into their respective arrays.
 */
exports.addReferral = async (req, res) => {
  try {
    const {
      receivedBy,
      referenceType,
      memberName,
      contactNumber,
      email,
      address,
      eventMaster,
      description,
    } = req.body;
    const givenBy = req.user._id;

    // Business logic: prevent self-referral
    if (receivedBy.toString() === givenBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a referral to yourself.",
      });
    }

    // Business logic: verify receiver exists and is active
    const receiver = await User.findById(receivedBy);
    if (!receiver || receiver.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    // Create the referral
    const referral = await Referral.create({
      givenBy,
      receivedBy,
      referenceType,
      memberName,
      contactNumber,
      email,
      address,
      eventMaster,
      description,
    });

    // Push referral reference into both users
    await User.findByIdAndUpdate(givenBy, {
      $push: { referralGiven: referral._id },
    });

    await User.findByIdAndUpdate(receivedBy, {
      $push: { referralReceived: referral._id },
    });

    res.status(201).json({
      success: true,
      message: "Referral added successfully.",
      data: { referral },
    });
  } catch (err) {
    console.error("Add referral error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};

/**
 * GET /api/referrals
 * Fetch the logged-in user's referrals, split into `given` and `received`.
 * Each referral is populated with the counterparty's name and company.
 */
exports.getMyReferrals = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields =
      "fullName businessInformation.companyName businessInformation.brandName";

    const [given, received] = await Promise.all([
      Referral.find({ givenBy: userId })
        .populate("receivedBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
      Referral.find({ receivedBy: userId })
        .populate("givenBy", populateFields)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: { given, received },
    });
  } catch (err) {
    console.error("Get referrals error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
