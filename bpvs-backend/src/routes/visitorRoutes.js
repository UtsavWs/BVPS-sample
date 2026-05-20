const express = require("express");
const router = express.Router();
const { protect, adminOrSubadmin } = require("../middlewares/authMiddleware");
const {
  validate,
  addVisitorSchema,
} = require("../middlewares/validationMiddleware");
const {
  addVisitor,
  getMyVisitors,
  getVisitorsForAdmin,
  approveVisitor,
  rejectVisitor,
} = require("../controllers/visitorController");

// Member-facing
router.post("/", protect, validate(addVisitorSchema), addVisitor);
router.get("/", protect, getMyVisitors);

// Admin / sub-admin moderation
router.get("/admin", protect, adminOrSubadmin, getVisitorsForAdmin);
router.post("/:id/approve", protect, adminOrSubadmin, approveVisitor);
router.post("/:id/reject", protect, adminOrSubadmin, rejectVisitor);

module.exports = router;
