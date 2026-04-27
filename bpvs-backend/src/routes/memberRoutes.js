const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getAllMembers } = require("../controllers/memberController");

// GET /api/members — list all active members (authenticated users only)
router.get("/", protect, getAllMembers);

module.exports = router;
