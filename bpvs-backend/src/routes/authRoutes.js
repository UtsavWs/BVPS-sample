const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  sendOtp,
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
} = require("../controllers/authController");
const {
  validate,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  sendOtpSchema,
  forgotPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordSchema,
} = require("../middlewares/validationMiddleware");

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/resend-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post(
  "/verify-forgot-password-otp",
  validate(verifyForgotPasswordOtpSchema),
  verifyForgotPasswordOtp,
);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
