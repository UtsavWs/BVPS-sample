const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  addB2bSchema,
} = require("../middlewares/validationMiddleware");
const { addB2b } = require("../controllers/b2bController");

// POST /api/b2b — create a new B2B entry (authenticated)
router.post("/", protect, validate(addB2bSchema), addB2b);

module.exports = router;
