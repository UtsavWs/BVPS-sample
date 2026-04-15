const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  addThankyouSlipSchema,
} = require("../middlewares/validationMiddleware");
const {
  addThankyouSlip,
  // getMyThankyouSlips, // Unused — superseded by GET /api/activity-log
} = require("../controllers/thankyouSlipController");

// POST /api/thankyouslip — create a new thank-you slip (authenticated)
router.post("/", protect, validate(addThankyouSlipSchema), addThankyouSlip);

// GET /api/thankyouslip — get current user's given & received slips
// router.get("/", protect, getMyThankyouSlips);

module.exports = router;
