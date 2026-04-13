const User = require("../models/User");

/**
 * GET /api/admin/stats
 * Returns counts: total, active, pending, inactive
 */
exports.getStats = async (req, res) => {
  try {
    const [total, active, pending, inactive] = await Promise.all([
      User.countDocuments({ role: "member" }),
      User.countDocuments({ role: "member", status: "active" }),
      User.countDocuments({ role: "member", isApproved: null, isVerified: true }),
      User.countDocuments({ role: "member", status: "inactive" }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, active, pending, inactive },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /api/admin/users
 * Query params: tab (pending|active|inactive|all), page, limit
 * Returns paginated list of non-admin users
 */
exports.getUsers = async (req, res) => {
  try {
    const { tab = "all", page = 1, limit = 10 } = req.query;
    const filter = { role: "member" };

    if (tab === "pending") {
      filter.isApproved = null;
      filter.isVerified = true;
    } else if (tab === "active") {
      filter.status = "active";
    } else if (tab === "inactive") {
      filter.status = "inactive";
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select(
        "fullName email mobile profileImage status isApproved createdAt businessInformation",
      );

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * PATCH /api/admin/users/:id
 * Update user email, mobile, or status
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, mobile, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot modify admin account." });
    }

    const updates = {};
    if (email) updates.email = email.toLowerCase();
    if (mobile) updates.mobile = mobile;
    if (status && ["active", "inactive"].includes(status)) {
      updates.status = status;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          status: updatedUser.status,
          role: updatedUser.role,
        },
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(409)
        .json({ success: false, message: `${field} is already in use.` });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * POST /api/admin/users/:id/approve
 * Set user isApproved to true and status to 'active'
 */
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.isApproved = true;
    user.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User approved successfully.",
      data: { id: user._id, isApproved: user.isApproved, status: user.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * POST /api/admin/users/:id/reject
 * Set user isApproved to false
 */
exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.isApproved = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User rejected successfully.",
      data: { id: user._id, isApproved: user.isApproved },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a non-admin user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete admin account." });
    }

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
