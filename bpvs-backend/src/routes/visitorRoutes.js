const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  addVisitorSchema,
} = require("../middlewares/validationMiddleware");
const {
  addVisitor,
  getMyVisitors,
} = require("../controllers/visitorController");

// POST /api/visitors — add a new visitor (authenticated)
router.post("/", protect, validate(addVisitorSchema), addVisitor);

// GET /api/visitors — get current user's visitors
router.get("/", protect, getMyVisitors);

module.exports = router;
