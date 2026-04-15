const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  validate,
  updateProfileSchema,
  changePasswordSchema,
} = require("../middlewares/validationMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  removeProfileImage,
  getDashboardStats,
  getDashboardStatsAll,
} = require("../controllers/userControllers");

// Protected routes - require authentication
router.get("/profile", protect, getProfile);
router.get("/dashboard-stats", protect, getDashboardStats);
router.get("/dashboard-stats-all", protect, getDashboardStatsAll);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);
router.delete("/profile/image", protect, removeProfileImage);

module.exports = router;
