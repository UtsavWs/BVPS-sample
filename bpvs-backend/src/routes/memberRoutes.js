const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");

// GET /api/members — list all active members (authenticated users only)
router.get("/", protect, async (req, res) => {
  try {
    const { page, limit, search, tab, days, status, role } = req.query;

    const filter = { role: { $in: ["member", "subadmin"] } };

    // Status: honor explicit filter if provided, otherwise default to active
    if (status) {
      const statuses = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length === 1) filter.status = statuses[0];
      else if (statuses.length > 1) filter.status = { $in: statuses };
    } else {
      filter.status = "active";
    }

    // Date window (createdAt within the last N days)
    const daysNum = parseInt(days);
    if (Number.isFinite(daysNum) && daysNum > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysNum);
      filter.createdAt = { $gte: cutoff };
    }

    // NOTE: `role` query param (President/Vice President/Member) is not yet
    // backed by a schema field. Accepted but ignored until a designation
    // field is added to the User model.

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        {
          "businessInformation.companyName": { $regex: search, $options: "i" },
        },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Fetch up to 200 by default only if explicitly NOT a paginated request
    // However, to support unified infinite scroll, we enforce pagination.
    // If client doesn't pass 'page', we still return paginated results starting at page 1.
    
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
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
