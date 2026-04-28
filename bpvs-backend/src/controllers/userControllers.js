const User = require("../models/User");
const Referral = require("../models/Referral");
const ThankyouSlip = require("../models/ThankyouSlip");
const Visitor = require("../models/Visitor");
const B2b = require("../models/B2b");
const { deleteCloudinaryImage } = require("../utils/cloudinary");

/**
 * Sanitize image URL - return default if it's a base64 data URL
 */
const sanitizeImage = (image) => {
  if (!image) return ""; 
  // If it's a base64 data URL, return empty string to avoid payload too large
  if (image.startsWith("data:")) return "";
  return image;
};

/**
 * GET /api/user/profile
 * Get current user's profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          isVerified: user.isVerified,
          isApproved: user.isApproved,
          role: user.role,
          status: user.status,
          profileImage: sanitizeImage(user.profileImage),
          bannerImage: sanitizeImage(user.bannerImage),
          contactInformation: user.contactInformation,
          businessInformation: user.businessInformation,
          otherInformation: user.otherInformation,
          referralGivenCount: (user.referralGiven || []).length,
          referralReceivedCount: (user.referralReceived || []).length,
          thankyouslipGivenCount: (user.thankyouslipGiven || []).length,
          thankyouslipReceivedCount: (user.thankyouslipReceived || []).length,
          b2bCount:
            (user.b2bGiven || []).length + (user.b2bReceived || []).length,
          visitorCount: (user.totalVisitors || []).length,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    const allowedUpdates = [
      "fullName",
      "mobile",
      "profileImage",
      "bannerImage",
      "dateOfBirth",
      "gender",
      "contactInformation",
      "businessInformation",
      "otherInformation",
    ];

    const updateData = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        // Handle nested objects by merging with existing data
        if (
          typeof updates[field] === "object" &&
          updates[field] !== null &&
          !Array.isArray(updates[field]) &&
          !(updates[field] instanceof Date)
        ) {
          const existingData = user[field] || {};
          updateData[field] = {
            ...(existingData.toObject ? existingData.toObject() : existingData),
            ...updates[field],
          };
        } else {
          updateData[field] = updates[field];
        }
      }
    });

    // Delete old Cloudinary images when user explicitly clears them
    const imageFields = ["profileImage", "bannerImage"];
    for (const field of imageFields) {
      if (
        updateData[field] === "" &&
        user[field] &&
        typeof user[field] === "string" &&
        user[field].includes("cloudinary.com")
      ) {
        await deleteCloudinaryImage(user[field]);
      }
    }

    // Use findByIdAndUpdate but catch specific validation errors
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data updated successfully.",
      data: {
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          mobile: updatedUser.mobile,
          isVerified: updatedUser.isVerified,
          isApproved: updatedUser.isApproved,
          role: updatedUser.role,
          status: updatedUser.status,
          profileImage: updatedUser.profileImage,
          bannerImage: updatedUser.bannerImage,
          dateOfBirth: updatedUser.dateOfBirth,
          gender: updatedUser.gender,
          contactInformation: updatedUser.contactInformation,
          businessInformation: updatedUser.businessInformation,
          otherInformation: updatedUser.otherInformation,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);

    // Handle Mongoose validation errors explicitly
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle unique constraint errors (e.g. mobile number already exists)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already in use by another account.`,
      });
    }

    // Handle invalid data types (e.g. invalid date format)
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${err.path}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. " + (err.message || "Please try again later."),
    });
  }
};

/**
 * DELETE /api/users/profile/image
 * Remove profile or banner image — deletes from Cloudinary and clears the DB field
 */
exports.removeProfileImage = async (req, res) => {
  try {
    const user = req.user;
    const { imageType } = req.body; // "profileImage" or "bannerImage"

    if (!["profileImage", "bannerImage"].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "imageType must be 'profileImage' or 'bannerImage'.",
      });
    }

    const currentUrl = user[imageType];
    if (currentUrl && currentUrl.includes("cloudinary.com")) {
      await deleteCloudinaryImage(currentUrl);
    }

    await User.findByIdAndUpdate(user._id, { $set: { [imageType]: "" } });

    res
      .status(200)
      .json({ success: true, message: `${imageType} removed successfully.` });
  } catch (err) {
    console.error("Remove image error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * PUT /api/user/change-password
 * Change current user's password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    const userWithPassword = await User.findById(user._id).select(
      "+password +passwordHistory",
    );
    if (!userWithPassword) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isMatch = await userWithPassword.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // Check if new password is the same as current password
    const isSameAsCurrent = await userWithPassword.comparePassword(newPassword);
    if (isSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your current password.",
      });
    }

    // Check if new password was used recently (in password history)
    const isInHistory = await userWithPassword.isPasswordInHistory(newPassword);
    if (isInHistory) {
      return res.status(400).json({
        success: false,
        message:
          "New password cannot be the same as any of your recent passwords. Please choose a different password.",
      });
    }

    // Add current password to history before updating
    await userWithPassword.addToPasswordHistory();
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * GET /api/users/dashboard-stats?startDate=...&endDate=...
 * Get dashboard counts filtered by date range
 */
const computeStatsForRange = async (userId, startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const inRange = { $gte: start, $lte: end };

  const [
    refG,
    refR,
    tsG,
    tsR,
    visitorCount,
    b2bCount
  ] = await Promise.all([
    Referral.countDocuments({ givenBy: userId, createdAt: inRange }),
    Referral.countDocuments({ receivedBy: userId, createdAt: inRange }),
    ThankyouSlip.countDocuments({ givenBy: userId, createdAt: inRange }),
    ThankyouSlip.countDocuments({ receivedBy: userId, createdAt: inRange }),
    Visitor.countDocuments({ addedBy: userId, createdAt: inRange }),
    B2b.countDocuments({
      $or: [{ addedBy: userId }, { memberId: userId }],
      createdAt: inRange,
    }),
  ]);

  return {
    referralGivenCount: refG,
    referralReceivedCount: refR,
    thankyouslipGivenCount: tsG,
    thankyouslipReceivedCount: tsR,
    visitorCount: visitorCount,
    b2bCount: b2bCount,
  };
};

const getTabDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() + mondayOffset);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() + mondayOffset - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    "Current Week": { startDate: currentWeekStart, endDate: currentWeekEnd },
    "Last Week": { startDate: lastWeekStart, endDate: lastWeekEnd },
    Month: { startDate: monthStart, endDate: monthEnd },
  };
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate query params are required.",
      });
    }

    const data = await computeStatsForRange(userId, startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

exports.getDashboardStatsAll = async (req, res) => {
  try {
    const userId = req.user._id;
    const ranges = getTabDateRanges();

    const [currentWeek, lastWeek, month] = await Promise.all([
      computeStatsForRange(userId, ranges["Current Week"].startDate, ranges["Current Week"].endDate),
      computeStatsForRange(userId, ranges["Last Week"].startDate, ranges["Last Week"].endDate),
      computeStatsForRange(userId, ranges.Month.startDate, ranges.Month.endDate),
    ]);

    res.status(200).json({
      success: true,
      data: {
        "Current Week": currentWeek,
        "Last Week": lastWeek,
        Month: month,
      },
    });
  } catch (err) {
    console.error("Unable to fetch dashboard stats:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
