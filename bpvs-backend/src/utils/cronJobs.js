const User = require("../models/User");

/**
 * Initialize background cron jobs for the application.
 * Currently handles:
 * - Clearing expired OTPs every 1 minute.
 */
const initCronJobs = () => {
  console.log("⏰ Background cron jobs initialized.");

  const runCleanup = async () => {
    try {
      await User.clearExpiredOtps();
    } catch (error) {
      console.error("❌ Error in OTP cleanup job:", error.message);
    }
  };

  // Run immediately on start
  runCleanup();

  // Then run every 1 minute
  setInterval(runCleanup, 60 * 1000);
};

module.exports = initCronJobs;
