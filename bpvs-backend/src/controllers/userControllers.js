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
    console.log("[updateProfile] req.body:", JSON.stringify(updates));

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
        if (
          typeof updates[field] === "object" &&
          !Array.isArray(updates[field])
        ) {
          updateData[field] = {
            ...(user[field]?.toObject ? user[field].toObject() : user[field]),
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
        user[field].includes("cloudinary.com")
      ) {
        await deleteCloudinaryImage(user[field]);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

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
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
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

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const [
      referralGivenCount,
      referralReceivedCount,
      thankyouslipGivenCount,
      thankyouslipReceivedCount,
      visitorCount,
      b2bCount,
    ] = await Promise.all([
      Referral.countDocuments({ givenBy: userId, ...dateFilter }),
      Referral.countDocuments({ receivedBy: userId, ...dateFilter }),
      ThankyouSlip.countDocuments({ givenBy: userId, ...dateFilter }),
      ThankyouSlip.countDocuments({ receivedBy: userId, ...dateFilter }),
      Visitor.countDocuments({ addedBy: userId, ...dateFilter }),
      B2b.countDocuments({
        $or: [{ addedBy: userId }, { memberId: userId }],
        ...dateFilter,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        referralGivenCount,
        referralReceivedCount,
        thankyouslipGivenCount,
        thankyouslipReceivedCount,
        visitorCount,
        b2bCount,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
