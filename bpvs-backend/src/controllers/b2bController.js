const B2b = require("../models/B2b");
const User = require("../models/User");

/**
 * POST /api/b2b
 * Create a new B2B entry.
 *   - addedBy → logged-in user (req.user)
 *   - memberId → selected member from the form
 */
exports.addB2b = async (req, res) => {
  try {
    const { memberId, memberName, initiatedBy, location, topicOfConversation, eventMaster } =
      req.body;
    const addedBy = req.user._id;

    // Prevent self B2B
    if (memberId.toString() === addedBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add a B2B with yourself.",
      });
    }

    // Verify the selected member exists and is active
    const member = await User.findById(memberId);
    if (!member || member.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    const b2b = await B2b.create({
      addedBy,
      memberId,
      memberName,
      initiatedBy,
      location,
      topicOfConversation,
      eventMaster,
    });

    // Push B2B reference into the creator's array
    await User.findByIdAndUpdate(addedBy, {
      $push: { totalB2b: b2b._id },
    });

    res.status(201).json({
      success: true,
      message: "B2B added successfully.",
      data: { b2b },
    });
  } catch (err) {
    console.error("Add B2B error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};

/**
 * GET /api/b2b
 * Fetch the logged-in user's B2B entries.
 */
exports.getMyB2b = async (req, res) => {
  try {
    const userId = req.user._id;

    const b2bList = await B2b.find({ addedBy: userId })
      .populate(
        "memberId",
        "fullName businessInformation.companyName businessInformation.brandName",
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { b2bList },
    });
  } catch (err) {
    console.error("Get B2B error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
