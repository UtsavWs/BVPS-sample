const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect middleware — verifies JWT from Authorization header.
 * Usage: router.get('/protected', protect, handler)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Not authorized. No token provided.",
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

/**
 * Admin-only middleware — must be used after protect.
 * Usage: router.get('/admin-only', protect, adminOnly, handler)
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required." });
  }
  next();
};

const adminOrSubadmin = (req, res, next) => {
  if (!["admin", "subadmin"].includes(req.user.role)) {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required." });
  }
  next();
};

module.exports = { protect, adminOnly, adminOrSubadmin };
