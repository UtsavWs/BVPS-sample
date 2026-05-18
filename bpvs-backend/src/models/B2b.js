const mongoose = require("mongoose");

const B2bSchema = new mongoose.Schema(
  {
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "givenBy (creator) is required"],
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Member is required"],
    },
    location: {
      type: String,
      trim: true,
      required: [true, "Location is required"],
    },
    topicOfConversation: {
      type: String,
      trim: true,
      required: [true, "Topic of conversation is required"],
    },
    activityDate: {
      type: Date,
      required: [true, "Activity date is required"],
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

B2bSchema.index({ givenBy: 1, createdAt: -1 });
B2bSchema.index({ receivedBy: 1, createdAt: -1 });

module.exports = mongoose.model("B2b", B2bSchema);
