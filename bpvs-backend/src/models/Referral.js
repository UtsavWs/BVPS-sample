const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema(
  {
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "givenBy (sender) is required"],
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "receivedBy (receiver) is required"],
    },
    memberName: {
      type: String,
      trim: true,
      required: [true, "Member name is required"],
    },
    contactNumber: {
      type: String,
      trim: true,
      required: [true, "Contact number is required"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
    },
    address: {
      type: String,
      trim: true,
      required: [true, "Address is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

ReferralSchema.index({ givenBy: 1, createdAt: -1 });
ReferralSchema.index({ receivedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Referral", ReferralSchema);
