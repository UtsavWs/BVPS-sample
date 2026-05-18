const express = require("express");
const router = express.Router();
const {
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
} = require("../controllers/authController");
const {
  validate,
  loginSchema,
  forgotPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordSchema,
} = require("../middlewares/validationMiddleware");

// Public routes
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post(
  "/verify-forgot-password-otp",
  validate(verifyForgotPasswordOtpSchema),
  verifyForgotPasswordOtp,
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
