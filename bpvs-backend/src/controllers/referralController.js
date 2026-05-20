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
      memberName,
      contactNumber,
      email,
      address,
      description,
      activityDate,
    } = req.body;
    const givenBy = req.user._id;

    // prevent self-referral
    if (receivedBy.toString() === givenBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a referral to yourself.",
      });
    }

    // verify receiver exists and is active
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
      memberName,
      contactNumber,
      email,
      address,
      description,
      activityDate,
    });

    // Push referral reference into both users
    await Promise.all([
      User.findByIdAndUpdate(givenBy, {
        $push: { referralGiven: referral._id },
      }),
      User.findByIdAndUpdate(receivedBy, {
        $push: { referralReceived: referral._id },
      }),
    ]);

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
