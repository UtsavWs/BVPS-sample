const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  addReferralSchema,
} = require("../middlewares/validationMiddleware");
const { addReferral } = require("../controllers/referralController");

// POST /api/referrals — create a new referral (authenticated)
router.post("/", protect, validate(addReferralSchema), addReferral);

module.exports = router;
