const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ───── Basic Auth Fields ─────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // Store the last 3 previous password hashes to prevent reuse.
    // Combined with the current password check, this blocks reuse of the
    // user's last 3 passwords on reset / change-password flows.
    passwordHistory: {
      type: [String],
      default: [],
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["member", "subadmin", "admin"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    isApproved: {
      type: Boolean,
      default: null,
    },

    // ───── OTP Fields ─────────────────────────────────────────────────────────────
    otp: {
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },

    profileImage: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },

    // ─────────────────────────────
    // CONTACT INFORMATION
    // ─────────────────────────────
    contactInformation: {
      website: {
        type: String,
        trim: true,
      },
      location: {
        type: String,
        trim: true,
      },
      nativePlace: {
        type: String,
        trim: true,
      },
    },

    // ─────────────────────────────
    // BUSINESS INFORMATION
    // ─────────────────────────────
    businessInformation: {
      companyName: {
        type: String,
        trim: true,
      },
      brandName: {
        type: String,
        trim: true,
      },
      gstNo: {
        type: String,
        trim: true,
      },
      dateOfJoin: {
        type: Date,
      },
      profession: {
        type: String,
        trim: true,
      },
      aboutBusiness: {
        type: String,
        trim: true,
      },
    },

    // ─────────────────────────────
    // OTHER INFORMATION
    // ─────────────────────────────
    otherInformation: {
      skill: {
        type: String,
        trim: true,
      },
      accomplishments: {
        type: String,
        trim: true,
      },
      interest: {
        type: String,
        trim: true,
      },
      networkCircle: {
        type: String,
        trim: true,
      },
      goals: {
        type: String,
        trim: true,
      },
      keywords: {
        type: String,
        trim: true,
      },
    },

    // ─────────────────────────────
    // VISITORS
    // ─────────────────────────────
    totalVisitors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visitor",
      },
    ],

    // ─────────────────────────────
    // REFERRALS
    // ─────────────────────────────
    referralGiven: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
      },
    ],
    referralReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
      },
    ],

    // ─────────────────────────────
    // THANK-YOU SLIPS
    // ─────────────────────────────
    thankyouslipGiven: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ThankyouSlip",
      },
    ],
    thankyouslipReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ThankyouSlip",
      },
    ],

    // ─────────────────────────────
    // B2B (Business to Business)
    // ─────────────────────────────
    b2bGiven: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "B2b",
      },
    ],
    b2bReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "B2b",
      },
    ],
  },
  { timestamps: true },
);

// ───── Password Hash ─────
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ───── Compare Password ─────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ───── Check Password History ─────
UserSchema.methods.isPasswordInHistory = async function (candidatePassword) {
  const history = this.passwordHistory || [];
  for (const hashedPassword of history) {
    const matches = await bcrypt.compare(candidatePassword, hashedPassword);
    if (matches) return true;
  }
  return false;
};

// ───── Add to Password History ─────
// Call this BEFORE assigning a new plaintext password and saving.
// At this point `this.password` is still the previously-saved hash, so we
// push it onto the history and keep at most the 3 most recent previous hashes.
// Together with the "new password !== current password" check in the
// controllers, this prevents reuse of the user's last 3 passwords.
UserSchema.methods.addToPasswordHistory = async function () {
  if (!this.password) return;

  const PASSWORD_HISTORY_LIMIT = 3;
  this.passwordHistory = [this.password, ...(this.passwordHistory || [])].slice(
    0,
    PASSWORD_HISTORY_LIMIT,
  );
};

// ───── Clear Expired OTPs (runs every minute) ─────
UserSchema.statics.clearExpiredOtps = async function () {
  const result = await this.updateMany(
    { "otp.expiresAt": { $lt: new Date() } },
    { $set: { "otp.code": null, "otp.expiresAt": null } },
  );
  if (result.modifiedCount > 0) {
    console.log(`🧹 Cleared ${result.modifiedCount} expired OTP(s)`);
  }
  return result.modifiedCount;
};

// ───── Indexes ─────
UserSchema.index({ role: 1, status: 1, isApproved: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "otp.expiresAt": 1 });

module.exports = mongoose.model("User", UserSchema);
