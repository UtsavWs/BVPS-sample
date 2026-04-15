const express = require("express");
const router = express.Router();
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const adminRoutes = require("../routes/adminRoutes");
const memberRoutes = require("../routes/memberRoutes");
const thankyouSlipRoutes = require("../routes/thankyouSlipRoutes");
const referralRoutes = require("../routes/referralRoutes");
const visitorRoutes = require("../routes/visitorRoutes");
const b2bRoutes = require("../routes/b2bRoutes");
const activityLogRoutes = require("../routes/activityLogRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/members", memberRoutes);
router.use("/thankyouslip", thankyouSlipRoutes);
router.use("/referrals", referralRoutes);
router.use("/visitors", visitorRoutes);
router.use("/b2b", b2bRoutes);
router.use("/activity-log", activityLogRoutes);

module.exports = router;
