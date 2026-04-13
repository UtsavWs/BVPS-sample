const mongoose = require("mongoose");

const B2bSchema = new mongoose.Schema(
  {
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "addedBy (creator) is required"],
    },
    memberName: {
      type: String,
      trim: true,
      required: [true, "Member name is required"],
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Member is required"],
    },
    initiatedBy: {
      type: String,
      enum: ["My self", "Other Member"],
      required: [true, "Initiated by is required"],
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
    eventMaster: {
      type: String,
      required: [true, "Event master is required"],
    },
  },
  { timestamps: true },
);

B2bSchema.index({ addedBy: 1, createdAt: -1 });

module.exports = mongoose.model("B2b", B2bSchema);
