const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  addThankyouSlipSchema,
} = require("../middlewares/validationMiddleware");
const { addThankyouSlip } = require("../controllers/thankyouSlipController");

// POST /api/thankyouslip — create a new thank-you slip (authenticated)
router.post("/", protect, validate(addThankyouSlipSchema), addThankyouSlip);

module.exports = router;
