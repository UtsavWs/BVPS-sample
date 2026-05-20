const Visitor = require("../models/Visitor");
const User = require("../models/User");

/**
 * POST /api/visitors
 * Member creates a visitor — starts in `pending` state and is NOT pushed to the
 * user's `totalVisitors` array until an admin/subadmin approves it.
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
      nativePlace,
      activityDate,
    } = req.body;

    const visitor = await Visitor.create({
      firstName,
      lastName,
      profession,
      specialty,
      companyName,
      contactNumber,
      email,
      nativePlace,
      activityDate,
      addedBy: req.user._id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Visitor submitted for approval. You'll see them in your dashboard once an admin approves.",
      data: { visitor },
    });
  } catch (err) {
    console.error("Add visitor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * GET /api/visitors
 * Returns the current user's visitors (any status) with newest first.
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
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * GET /api/visitors/admin?status=pending|approved|rejected|all&page=1&limit=20
 * Admin/sub-admin: list visitors filtered by status.
 */
exports.getVisitorsForAdmin = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const filter = {};
    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const [total, pendingCount, approvedCount, rejectedCount, visitors] =
      await Promise.all([
        Visitor.countDocuments(filter),
        Visitor.countDocuments({ status: "pending" }),
        Visitor.countDocuments({ status: "approved" }),
        Visitor.countDocuments({ status: "rejected" }),
        Visitor.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate("addedBy", "fullName email mobile profileImage")
          .populate("reviewedBy", "fullName")
          .lean(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        visitors,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
        pagination: {
          total,
          page: pageNum,
          pages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (err) {
    console.error("Get visitors (admin) error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * POST /api/visitors/:id/approve
 * Admin/sub-admin approves a pending visitor. The visitor is then attached to
 * the requesting user's totalVisitors array so they show up on the dashboard.
 */
exports.approveVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found." });
    }
    if (visitor.status === "approved") {
      return res
        .status(400)
        .json({ success: false, message: "Visitor is already approved." });
    }

    visitor.status = "approved";
    visitor.reviewedBy = req.user._id;
    visitor.reviewedAt = new Date();
    await visitor.save();

    await User.findByIdAndUpdate(visitor.addedBy, {
      $addToSet: { totalVisitors: visitor._id },
    });

    res.status(200).json({
      success: true,
      message: "Visitor approved.",
      data: { visitor },
    });
  } catch (err) {
    console.error("Approve visitor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * POST /api/visitors/:id/reject
 * Admin/sub-admin rejects a visitor. Soft-deletes by flipping status to
 * `rejected` and pulling the id from the user's totalVisitors array if it was
 * previously approved.
 */
exports.rejectVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found." });
    }
    if (visitor.status === "rejected") {
      return res
        .status(400)
        .json({ success: false, message: "Visitor is already rejected." });
    }

    const wasApproved = visitor.status === "approved";
    visitor.status = "rejected";
    visitor.reviewedBy = req.user._id;
    visitor.reviewedAt = new Date();
    await visitor.save();

    if (wasApproved) {
      await User.findByIdAndUpdate(visitor.addedBy, {
        $pull: { totalVisitors: visitor._id },
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor rejected.",
      data: { visitor },
    });
  } catch (err) {
    console.error("Reject visitor error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
