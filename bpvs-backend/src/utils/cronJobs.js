const User = require("../models/User");

/**
 * Initialize background cron jobs for the application.
 * Currently handles:
 * - Clearing expired OTPs every 1 minute.
 */
const initCronJobs = () => {
  setInterval(async () => {
    try {
      await User.clearExpiredOtps();
    } catch (error) {
      console.error("Error in OTP cleanup job:", error.message);
    }
  }, 60 * 1000);

  console.log("Expired otp cleared.");
};

module.exports = initCronJobs;
