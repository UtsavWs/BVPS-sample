const mongoose = require("mongoose");

const ThankyouSlipSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    activityDate: {
      type: Date,
      required: [true, "Activity date is required"],
    },
  },
  { timestamps: true },
);

ThankyouSlipSchema.index({ givenBy: 1, createdAt: -1 });
ThankyouSlipSchema.index({ receivedBy: 1, createdAt: -1 });

module.exports = mongoose.model("ThankyouSlip", ThankyouSlipSchema);
