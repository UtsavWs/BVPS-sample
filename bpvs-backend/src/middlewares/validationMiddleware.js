const Joi = require("joi");

// ── common Validations ─────────────────────────────────────────────────────────
const baseValidations = {
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.email": "Please provide a valid email address.",
      "string.pattern.base": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/)
    .messages({
      "string.min": "Password must be at least 8 characters.",
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "any.required": "Password is required.",
    }),
  mobile: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .messages({
      "string.empty": "Mobile number is required.",
      "string.min": "Mobile number must be at least 10 digits.",
      "string.max": "Mobile number must not exceed 15 digits.",
      "any.required": "Mobile number is required.",
    }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .messages({
      "string.length": "OTP must be 6 digits.",
      "any.required": "OTP is required.",
    }),
  name: Joi.string()
    .trim()
    .min(2)
    .messages({
      "string.empty": "Full name is required.",
      "string.min": "Full name must be at least 2 characters.",
      "any.required": "Full name is required.",
    }),
  mongoId: Joi.string()
    .trim()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Please select a member.",
      "string.pattern.base": "Invalid member selected.",
      "any.required": "Please select a member.",
    }),
  website: Joi.string()
    .trim()
    .allow("")
    .custom((value, helpers) => {
      if (!value) return value;
      const urlPattern =
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
      if (!urlPattern.test(value)) {
        return helpers.error("string.uri");
      }
      return value;
    })
    .messages({
      "string.uri":
        "Website must be a valid URL (e.g. example.com or https://example.com).",
    }),
};

// ── Auth Schemas ──────────────────────────────────────────────────────────────

exports.loginSchema = Joi.object({
  email: baseValidations.email.required(),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
  rememberMe: Joi.boolean().optional(),
});

exports.forgotPasswordSchema = Joi.object({
  email: baseValidations.email.required(),
});

exports.verifyForgotPasswordOtpSchema = Joi.object({
  email: baseValidations.email.required(),
  otp: baseValidations.otp.required(),
});

exports.resetPasswordSchema = Joi.object({
  email: baseValidations.email.required(),
  otp: baseValidations.otp.required(),
  newPassword: baseValidations.password.required().messages({
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
  website: baseValidations.website,
  location: Joi.string().trim().allow(""),
  nativePlace: Joi.string().trim().allow(""),
});

const businessInfoSchema = Joi.object({
  companyName: Joi.string().trim().allow(""),
  brandName: Joi.string().trim().allow(""),
  gstNo: Joi.string()
    .trim()
    .allow("")
    .min(15)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      "string.min": "GST number must be at least 15 characters.",
      "string.pattern.base": "GST number must contain only uppercase letters and numbers.",
    }),
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
  fullName: baseValidations.name,
  mobile: baseValidations.mobile,
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
  newPassword: baseValidations.password.required().messages({
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
  receivedBy: baseValidations.mongoId.required(),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a valid number.",
    "number.positive": "Amount must be positive.",
    "any.required": "Amount is required.",
  }),
  activityDate: Joi.date().iso().required().messages({
    "date.format": "Activity date must be a valid date.",
    "any.required": "Activity date is required.",
  }),
});

// ── Referral Schema ─────────────────────────────────────────────────────────

exports.addReferralSchema = Joi.object({
  receivedBy: Joi.string().trim().required().messages({
    "string.empty": "Please select a receiver.",
    "any.required": "Receiver is required.",
  }),
  memberName: Joi.string().trim().required().messages({
    "string.empty": "Please select a member.",
    "any.required": "Please select a member.",
  }),
  contactNumber: baseValidations.mobile.required().messages({
    "string.pattern.base": "Contact number must be 10 digits.", // Matching specific override if needed, but base covers 10-15
  }),
  email: baseValidations.email.required(),
  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required.",
    "any.required": "Address is required.",
  }),
  description: Joi.string().trim().allow("").optional(),
  activityDate: Joi.date().iso().required().messages({
    "date.format": "Activity date must be a valid date.",
    "any.required": "Activity date is required.",
  }),
});

// ── Visitor Schema ─────────────────────────────────────────────────────────

exports.addVisitorSchema = Joi.object({
  firstName: baseValidations.name.required().messages({
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters.",
    "any.required": "First name is required.",
  }),
  lastName: baseValidations.name.required().messages({
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
  contactNumber: baseValidations.mobile.required().messages({
    "string.pattern.base": "Contact number must be 10 digits.",
  }),
  email: baseValidations.email.required(),
  nativePlace: Joi.string().trim().required().messages({
    "string.empty": "Native place is required.",
    "any.required": "Native place is required.",
  }),
  activityDate: Joi.date().iso().required().messages({
    "date.format": "Activity date must be a valid date.",
    "any.required": "Activity date is required.",
  }),
});

// ── B2B Schema ────────────────────────────────────────────────────────────

exports.addB2bSchema = Joi.object({
  receivedBy: baseValidations.mongoId.required(),
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
  activityDate: Joi.date().iso().required().messages({
    "date.format": "Activity date must be a valid date.",
    "any.required": "Activity date is required.",
  }),
  image: Joi.string().uri().allow("", null).optional().messages({
    "string.uri": "Image must be a valid URL.",
  }),
});

// ── Admin Create User Schema ─────────────────────────────────────────────────

exports.createUserSchema = Joi.object({
  fullName: baseValidations.name.required(),
  email: baseValidations.email.required(),
  mobile: baseValidations.mobile.required(),
});

// ── Validation Middleware Factory ────────────────────────────────────────────

exports.validate = (schema) => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
        errors: messages,
      });
    }
    // Overwrite req.body with the sanitized/transformed values from Joi
    req.body = value;
    next();
  };
};
