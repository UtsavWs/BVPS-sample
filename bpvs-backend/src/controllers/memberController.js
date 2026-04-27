const User = require("../models/User");

exports.getAllMembers = async (req, res) => {
  try {
    const { page, limit, search, days, status } = req.query;

    // Base filter: only show members and subadmins
    const filter = { role: { $in: ["member", "subadmin"] } };

    // Status filtering: default to "active" if not provided
    if (status) {
      const statuses = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      
      if (statuses.length > 0) {
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
      }
    } else {
      filter.status = "active";
    }

    // Date window: members joined in the last N days
    const daysNum = parseInt(days);
    if (Number.isFinite(daysNum) && daysNum > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysNum);
      filter.createdAt = { $gte: cutoff };
    }

    // Search logic: fullName, companyName, or mobile
    if (search) {
      // Escape regex special characters to prevent errors
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = { $regex: safeSearch, $options: "i" };
      
      filter.$or = [
        { fullName: searchRegex },
        { "businessInformation.companyName": searchRegex },
        { mobile: searchRegex },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const total = await User.countDocuments(filter);
    const members = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()
      .select(
        "fullName email mobile profileImage status role businessInformation contactInformation otherInformation createdAt",
      );

    res.status(200).json({
      success: true,
      data: {
        members,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    console.error("Error in getAllMembers:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching members." 
    });
  }
};