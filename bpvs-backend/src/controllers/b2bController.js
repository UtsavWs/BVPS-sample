const B2b = require("../models/B2b");
const User = require("../models/User");

/**
 * POST /api/b2b
 * Create a new B2B entry.
 *   - givenBy → logged-in user (req.user)
 *   - receivedBy → selected member from the form
 */
exports.addB2b = async (req, res) => {
  try {
    const {
      receivedBy,
      initiatedBy,
      location,
      topicOfConversation,
      activityDate,
      images,
    } = req.body;
    const givenBy = req.user._id;

    const imageList = Array.isArray(images) ? images.filter(Boolean) : [];

    // Validate activityDate is within last 30 days
    const date = new Date(activityDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime()) || date > today || date < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: "Activity date must be within the last 30 days.",
      });
    }

    // Prevent self B2B
    if (receivedBy.toString() === givenBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a B2B with yourself",
      });
    }

    // verify member exists and is active
    const member = await User.findById(receivedBy);
    if (!member || member.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    const b2b = await B2b.create({
      givenBy,
      receivedBy,
      initiatedBy,
      location,
      topicOfConversation,
      activityDate: date,
      images: imageList,
    });

    // Push B2B reference into both users' arrays
    await Promise.all([
      User.findByIdAndUpdate(givenBy, {
        $push: { b2bGiven: b2b._id },
      }),
      User.findByIdAndUpdate(receivedBy, {
        $push: { b2bReceived: b2b._id },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: "B2B added successfully.",
      data: { b2b },
    });
  } catch (err) {
    console.error("Add B2B error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
