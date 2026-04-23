const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const { otpEmailHtml } = require("../utils/emailTemplates");

// ── Helpers ──────────────────────────────────────────────────────────────────
const signToken = (user, rememberMe = false) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: rememberMe
      ? process.env.JWT_EXPIRE_LONG || "7d"
      : process.env.JWT_EXPIRE_SHORT || "1h",
  });

const serverError = (res) =>
  res
    .status(500)
    .json({ success: false, message: "Server error. Please try again later." });

const setOtp = async (user, action, email) => {
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  await User.findByIdAndUpdate(user._id, {
    $set: {
      "otp.code": hashedOtp,
      "otp.expiresAt": Date.now() + 5 * 60 * 1000,
    },
  });

  // Transactional email subject line.
  const subject = `Your BPVS Account Verification Code`;
  try {
    await sendEmail({
      to: email,
      subject,
      html: otpEmailHtml(otp, action, user.fullName),
    });
  } catch (error) {
    throw new Error("Failed to send verification email. Please try again.");
  }
};

// ── Clear Expired OTPs every minute ─────────────────────────────────────────
setInterval(async () => {
  await User.clearExpiredOtps();
}, 60 * 1000);

// ── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { fullName, mobile, email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    let user = await User.findOne({ $or: [{ email: lowerEmail }, { mobile }] });

    if (user) {
      if (user.isVerified)
        return res.status(409).json({
          success: false,
          message: `${user.email === lowerEmail ? "Email" : "Mobile"} is already registered.`,
        });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(user._id, {
        $set: {
          fullName,
          mobile,
          email: lowerEmail,
          password: hashedPassword,
        },
      });
    } else {
      const isFirstUser = (await User.countDocuments()) === 0;
      user = await User.create({
        fullName,
        mobile,
        email: lowerEmail,
        password,
        isVerified: false,
        role: isFirstUser ? "admin" : "member",
        status: isFirstUser ? "active" : "inactive",
        isApproved: isFirstUser ? true : null,
      });
    }

    await setOtp(user, "account verification", lowerEmail);

    res.status(201).json({
      success: true,
      message: "Account created. Please verify your email with the OTP sent.",
      data: { userId: user._id, email: user.email },
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    serverError(res);
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user?.otp?.code || user.otp.expiresAt < Date.now())
      return res.status(401).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });

    if (!(await bcrypt.compare(otp, user.otp.code)))
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });

    await User.findByIdAndUpdate(user._id, {
      $set: {
        isVerified: true,
        "otp.code": null,
        "otp.expiresAt": null,
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully! Your account is now pending admin approval.",
    });
  } catch (err) {
    serverError(res);
  }
};

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail }).select("+password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "No account found with this email." });
    if (user.isVerified)
      return res
        .status(400)
        .json({ success: false, message: "Account is already verified." });

    await setOtp(user, "account verification", lowerEmail);

    res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (err) {
    serverError(res);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const lowerEmail = email.toLowerCase();

    const user = await User.findOne({ email: lowerEmail }).select("+password");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    if (!(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });

    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please verify your email first.",
        data: { email: user.email },
      });

    if (user.status === "inactive")
      return res.status(403).json({
        inactive: true,
        success: false,
        message: "Your account is inactive. Please contact admin.",
      });

    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        token: signToken(user, !!rememberMe),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          status: user.status,
          isApproved: user.isApproved,
          profileImage: user.profileImage,
          bannerImage: user.bannerImage,
          contactInformation: user.contactInformation,
          businessInformation: user.businessInformation,
          otherInformation: user.otherInformation,
        },
      },
    });
  } catch (err) {
    serverError(res);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail }).select("+password");

    if (!user)
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });

    await setOtp(user, "password reset", lowerEmail);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email for password reset.",
    });
  } catch (err) {
    serverError(res);
  }
};

// ── POST /api/auth/verify-forgot-password-otp ─────────────────────────────────
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user?.otp?.code || user.otp.expiresAt < Date.now())
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });

    if (!(await bcrypt.compare(otp, user.otp.code)))
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully." });
  } catch (err) {
    serverError(res);
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail }).select(
      "+password +passwordHistory",
    );

    if (!user?.otp?.code || user.otp.expiresAt < Date.now())
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });

    if (!(await bcrypt.compare(otp, user.otp.code)))
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });

    if (await user.comparePassword(newPassword))
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your current password.",
      });

    if (await user.isPasswordInHistory(newPassword))
      return res.status(400).json({
        success: false,
        message:
          "New password cannot be the same as your recent passwords. Please choose a different password.",
      });

    await user.addToPasswordHistory();
    user.password = newPassword;
    user.otp = { code: null, expiresAt: null };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    serverError(res);
  }
};
