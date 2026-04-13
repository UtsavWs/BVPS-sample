const Joi = require("joi");

// ── Auth Schemas ──────────────────────────────────────────────────────────────

exports.registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).required().messages({
    "string.empty": "Full name is required.",
    "string.min": "Full name must be at least 2 characters.",
    "any.required": "Full name is required.",
  }),
  mobile: Joi.string().trim().min(10).max(15).required().messages({
    "string.empty": "Mobile number is required.",
    "string.min": "Mobile number must be at least 10 digits.",
    "string.max": "Mobile number must not exceed 15 digits.",
    "any.required": "Mobile number is required.",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match.",
    "any.required": "Confirm password is required.",
  }),
});

exports.loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
});

exports.verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits.",
      "any.required": "OTP is required.",
    }),
});

exports.sendOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
});

exports.verifyForgotPasswordOtpSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits.",
      "any.required": "OTP is required.",
    }),
});

exports.resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits.",
      "any.required": "OTP is required.",
    }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters.",
    "any.required": "New password is required.",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match.",
      "any.required": "Confirm password is required.",
    }),
});

// ── User Schemas ─────────────────────────────────────────────────────────────

const contactInfoSchema = Joi.object({
  website: Joi.string()
    .trim()
    .allow("")
    .custom((value, helpers) => {
      if (!value) return value;
      // Accept URLs with or without protocol
      const urlPattern =
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
      if (!urlPattern.test(value)) {
        return helpers.error("string.uri");
      }
      return value;
    })
    .messages({
      "string.uri":
        "Website must be a valid URL (e.g. example.com or https://example.com).",
    }),
  location: Joi.string().trim().allow(""),
  nativePlace: Joi.string().trim().allow(""),
});

const businessInfoSchema = Joi.object({
  companyName: Joi.string().trim().allow(""),
  brandName: Joi.string().trim().allow(""),
  gstNo: Joi.string().trim().allow(""),
  dateOfJoin: Joi.date().allow(null),
  profession: Joi.string().trim().allow(""),
  aboutBusiness: Joi.string().trim().allow(""),
});

const otherInfoSchema = Joi.object({
  skill: Joi.string().trim().allow(""),
  accomplishments: Joi.string().trim().allow(""),
  interest: Joi.string().trim().allow(""),
  networkCircle: Joi.string().trim().allow(""),
  goals: Joi.string().trim().allow(""),
  keywords: Joi.string().trim().allow(""),
});

exports.updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).messages({
    "string.min": "Full name must be at least 2 characters.",
  }),
  mobile: Joi.string().trim().min(10).max(15).messages({
    "string.min": "Mobile number must be at least 10 digits.",
    "string.max": "Mobile number must not exceed 15 digits.",
  }),
  profileImage: Joi.string().trim().allow(""),
  bannerImage: Joi.string().trim().allow(""),
  dateOfBirth: Joi.date().allow(null),
  gender: Joi.string().valid("male", "female", "other", "").messages({
    "any.only": "Gender must be male, female, or other.",
  }),
  contactInformation: contactInfoSchema,
  businessInformation: businessInfoSchema,
  otherInformation: otherInfoSchema,
}).options({ allowUnknown: true });

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required.",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters.",
    "any.required": "New password is required.",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match.",
      "any.required": "Confirm password is required.",
    }),
});

// ── Thank-You Slip Schema ────────────────────────────────────────────────────

exports.addThankyouSlipSchema = Joi.object({
  receivedBy: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Please select a member.",
      "string.pattern.base": "Invalid member selected.",
      "any.required": "Please select a member.",
    }),
  businessType: Joi.string().valid("New", "Repeat").required().messages({
    "any.only": "Business type must be New or Repeat.",
    "any.required": "Business type is required.",
  }),
  referenceType: Joi.string().valid("Inside", "Outside").required().messages({
    "any.only": "Reference type must be Inside or Outside.",
    "any.required": "Reference type is required.",
  }),
  reference: Joi.string().trim().required().messages({
    "string.empty": "Reference is required.",
    "any.required": "Reference is required.",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a valid number.",
    "number.positive": "Amount must be positive.",
    "any.required": "Amount is required.",
  }),
});

// ── Referral Schema ─────────────────────────────────────────────────────────

exports.addReferralSchema = Joi.object({
  receivedBy: Joi.string().trim().required().messages({
    "string.empty": "Please select a receiver.",
    "any.required": "Receiver is required.",
  }),
  referenceType: Joi.string().valid("Inside", "Outside").required().messages({
    "any.only": "Reference type must be Inside or Outside.",
    "any.required": "Reference type is required.",
  }),
  memberName: Joi.string().trim().required().messages({
    "string.empty": "Please select a member.",
    "any.required": "Please select a member.",
  }),
  contactNumber: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.empty": "Contact number is required.",
      "string.pattern.base": "Contact number must be 10 digits.",
      "any.required": "Contact number is required.",
    }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required.",
    "any.required": "Address is required.",
  }),
  eventMaster: Joi.string().trim().required().messages({
    "string.empty": "Please select an event master.",
    "any.required": "Please select an event master.",
  }),
  description: Joi.string().trim().allow("").optional(),
});

// ── B2B Schema ──────────────────────────────────────────────────────────────

exports.addB2bSchema = Joi.object({
  memberId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Please select a member.",
      "string.pattern.base": "Invalid member selected.",
      "any.required": "Please select a member.",
    }),
  memberName: Joi.string().trim().required().messages({
    "string.empty": "Member name is required.",
    "any.required": "Member name is required.",
  }),
  initiatedBy: Joi.string().valid("My self", "Other Member").required().messages({
    "any.only": "Initiated by must be 'My self' or 'Other Member'.",
    "any.required": "Initiated by is required.",
  }),
  location: Joi.string().trim().required().messages({
    "string.empty": "Location is required.",
    "any.required": "Location is required.",
  }),
  topicOfConversation: Joi.string().trim().required().messages({
    "string.empty": "Topic of conversation is required.",
    "any.required": "Topic of conversation is required.",
  }),
  eventMaster: Joi.string().trim().required().messages({
    "string.empty": "Please select an event master.",
    "any.required": "Please select an event master.",
  }),
});

// ── Visitor Schema ─────────────────────────────────────────────────────────

exports.addVisitorSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required().messages({
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters.",
    "any.required": "First name is required.",
  }),
  lastName: Joi.string().trim().min(2).required().messages({
    "string.empty": "Last name is required.",
    "string.min": "Last name must be at least 2 characters.",
    "any.required": "Last name is required.",
  }),
  profession: Joi.string().trim().required().messages({
    "string.empty": "Profession is required.",
    "any.required": "Profession is required.",
  }),
  specialty: Joi.string().trim().required().messages({
    "string.empty": "Specialty is required.",
    "any.required": "Specialty is required.",
  }),
  companyName: Joi.string().trim().required().messages({
    "string.empty": "Company name is required.",
    "any.required": "Company name is required.",
  }),
  contactNumber: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.empty": "Contact number is required.",
      "string.pattern.base": "Contact number must be 10 digits.",
      "any.required": "Contact number is required.",
    }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  chapterOfInvite: Joi.string().trim().required().messages({
    "string.empty": "Chapter of invite is required.",
    "any.required": "Chapter of invite is required.",
  }),
});

// ── Validation Middleware Factory ────────────────────────────────────────────

exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
        errors: messages,
      });
    }
    next();
  };
};
