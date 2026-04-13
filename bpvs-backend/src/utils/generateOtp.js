const crypto = require("crypto");

/**
 * Generates a 6-digit cryptographically secure OTP.
 * @returns {string} 6-digit OTP string (to be hashed before storage)
 */
const generateOtp = () => {
  // crypto.randomInt(min, max) is available from Node 14.10+
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

module.exports = generateOtp;
