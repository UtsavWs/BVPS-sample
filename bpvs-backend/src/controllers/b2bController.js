const B2b = require("../models/B2b");
const User = require("../models/User");

/**
 * POST /api/b2b
 * Create a new B2B entry.
 *   - addedBy → logged-in user (req.user)
 *   - memberId → selected member from the form
 */
exports.addB2b = async (req, res) => {
  try {
    const { memberId, initiatedBy, location, topicOfConversation, eventMaster } =
      req.body;
    const addedBy = req.user._id;

    // Prevent self B2B
    if (memberId.toString() === addedBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a B2B with yourself",
      });
    }

    // verify member exists and is active
    const member = await User.findById(memberId);
    if (!member || member.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Selected member not found." });
    }

    const b2b = await B2b.create({
      addedBy,
      memberId,
      initiatedBy,
      location,
      topicOfConversation,
      eventMaster,
    });

    // Push B2B reference into both users' arrays
    await Promise.all([
      User.findByIdAndUpdate(addedBy, {
        $push: { b2bGiven: b2b._id },
      }),
      User.findByIdAndUpdate(memberId, {
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

// Unused — superseded by GET /api/activity-log (batched feed).
// /**
//  * GET /api/b2b
//  * Fetch the logged-in user's B2B entries.
//  */
// exports.getMyB2b = async (req, res) => {
//   try {
//     const userId = req.user._id;
//
//     const populateFields =
//       "fullName businessInformation.companyName businessInformation.brandName";
//
//     const [given, received] = await Promise.all([
//       B2b.find({ addedBy: userId })
//         .populate("memberId", populateFields)
//         .sort({ createdAt: -1 })
//         .lean(),
//       B2b.find({ memberId: userId })
//         .populate("addedBy", populateFields)
//         .sort({ createdAt: -1 })
//         .lean(),
//     ]);
//
//     res.status(200).json({
//       success: true,
//       data: { given, received },
//     });
//   } catch (err) {
//     console.error("Get B2B error:", err);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Server error. Please try again later.",
//       });
//   }
// };
