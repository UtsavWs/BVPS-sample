const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { approvalEmailHtml } = require("../utils/emailTemplates");

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
    const roleFilter =
      req.user.role === "admin" ? { $in: ["member", "subadmin"] } : "member";
    const filter = { role: roleFilter };

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
        "fullName email mobile profileImage status isApproved role createdAt businessInformation",
      )
      .lean();

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

    const updates = {};
    if (email) updates.email = email.toLowerCase();
    if (mobile) updates.mobile = mobile;
    if (status && ["active", "inactive"].includes(status)) {
      updates.status = status;
    }

    const allowedRoles =
      req.user.role === "admin" ? ["member", "subadmin"] : ["member"];
    const filter = { _id: id, role: { $in: allowedRoles } };

    const updatedUser = await User.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    }).select("fullName email mobile status role");

    if (!updatedUser) {
      const exists = await User.exists({ _id: id });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to modify this user." });
    }

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
    const user = await User.findOneAndUpdate(
      { _id: id },
      { isApproved: true, status: "active" },
      { new: true },
    ).select("fullName email isApproved status");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    sendEmail({
      to: user.email,
      subject: "Your BPVS account has been approved",
      html: approvalEmailHtml(user.fullName),
    }).catch((e) => console.error("Approval email failed:", e.message));

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
    const user = await User.findOneAndUpdate(
      { _id: id },
      { isApproved: false },
      { new: true },
    ).select("isApproved");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

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
 * POST /api/admin/users/:id/promote
 * Admin-only: promote a member to subadmin
 */
exports.promoteToSubadmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, role: "member" },
      { role: "subadmin" },
      { new: true },
    ).select("role");

    if (!user) {
      const exists = await User.exists({ _id: id });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      return res.status(400).json({
        success: false,
        message: "Only members can be promoted to subadmin.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User promoted to subadmin.",
      data: { id: user._id, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * POST /api/admin/users/:id/demote
 * Admin-only: demote a subadmin back to member
 */
exports.demoteToMember = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, role: "subadmin" },
      { role: "member" },
      { new: true },
    ).select("role");

    if (!user) {
      const exists = await User.exists({ _id: id });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      return res.status(400).json({
        success: false,
        message: "Only subadmins can be demoted.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subadmin demoted to member.",
      data: { id: user._id, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /api/admin/subadmins
 * Admin-only: list all subadmins
 */
exports.getSubadmins = async (req, res) => {
  try {
    const subadmins = await User.find({ role: "subadmin" })
      .sort({ createdAt: -1 })
      .select("fullName email mobile profileImage status createdAt")
      .lean();

    res.status(200).json({ success: true, data: { subadmins } });
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
    const allowedRoles =
      req.user.role === "admin" ? ["member", "subadmin"] : ["member"];

    const deleted = await User.findOneAndDelete({
      _id: id,
      role: { $in: allowedRoles },
    });

    if (!deleted) {
      const exists = await User.exists({ _id: id });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete this user." });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
