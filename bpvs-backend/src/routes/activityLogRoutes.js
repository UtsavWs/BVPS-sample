const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getMyActivityLog } = require("../controllers/activityLogController");

// GET /api/activity-log — batched activity feed for the current user
router.get("/", protect, getMyActivityLog);

module.exports = router;
