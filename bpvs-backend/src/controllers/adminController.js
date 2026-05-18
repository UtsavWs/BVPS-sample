const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { welcomeEmailHtml } = require("../utils/emailTemplates");

/**
 * GET /api/admin/stats
 * Returns counts: total, active, inactive
 */
exports.getAdminStats = async (req, res) => {
  try {
    const roleFilter =
      req.user.role === "admin" ? { $in: ["member", "subadmin"] } : "member";

    const [total, active, inactive] = await Promise.all([
      User.countDocuments({ role: roleFilter }),
      User.countDocuments({ role: roleFilter, status: "active" }),
      User.countDocuments({ role: roleFilter, status: "inactive" }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, active, inactive },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /api/admin/users
 * Query params: tab (active|inactive|all), page, limit
 * Returns paginated list of non-admin users
 */
exports.getUsers = async (req, res) => {
  try {
    const { tab = "all", page = 1, limit = 10 } = req.query;
    const roleFilter =
      req.user.role === "admin" ? { $in: ["member", "subadmin"] } : "member";
    const filter = { role: roleFilter };

    if (tab === "active") {
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
        "fullName email mobile profileImage status role createdAt businessInformation",
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
 * POST /api/admin/users
 * Create a new user from the admin panel.
 * The user is immediately active and verified.
 */
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;
    const lowerEmail = email.toLowerCase();
    const defaultPassword = "Bvps@123";

    // Check if email or mobile already exists
    const existing = await User.findOne({
      $or: [{ email: lowerEmail }, { mobile }],
    });
    if (existing) {
      const field = existing.email === lowerEmail ? "Email" : "Mobile";
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    const user = await User.create({
      fullName,
      email: lowerEmail,
      mobile,
      password: defaultPassword,
      isVerified: true,
      status: "active",
      role: "member",
      createdBy: { id: req.user._id, name: req.user.fullName },
    });

    // Send welcome email with credentials (fire-and-forget)
    sendEmail({
      to: lowerEmail,
      subject: "Welcome to BPVS — Your Account Details",
      html: welcomeEmailHtml(fullName, lowerEmail, defaultPassword),
    }).catch((e) => console.error("Welcome email failed:", e.message));

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          status: user.status,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
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
