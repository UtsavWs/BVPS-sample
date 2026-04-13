const Visitor = require("../models/Visitor");
const User = require("../models/User");

/**
 * POST /api/visitors
 * Create a new visitor (authenticated).
 */
exports.addVisitor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      profession,
      specialty,
      companyName,
      contactNumber,
      email,
      chapterOfInvite,
    } = req.body;

    const visitor = await Visitor.create({
      firstName,
      lastName,
      profession,
      specialty,
      companyName,
      contactNumber,
      email,
      chapterOfInvite,
      addedBy: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { totalVisitors: visitor._id },
    });

    res.status(201).json({
      success: true,
      message: "Visitor added successfully.",
      data: { visitor },
    });
  } catch (err) {
    console.error("Add visitor error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};

/**
 * GET /api/visitors
 * Get all visitors invited by the logged-in user.
 */
exports.getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ addedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { visitors },
    });
  } catch (err) {
    console.error("Get visitors error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
