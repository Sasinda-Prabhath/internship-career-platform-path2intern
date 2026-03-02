import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: false, // INVITED staff have no password yet
      default: null,
    },

    // ── Roles ────────────────────────────────────────────────────────────────
    globalRole: {
      type: String,
      required: true,
      enum: ["SYSTEM_ADMIN", "UNIVERSITY_ADMIN", "STAFF", "ORGANIZATION", "STUDENT"],
      default: "STUDENT",
    },

    // STAFF-specific: sub-role and module assignments
    staffRole: {
      type: String,
      enum: ["MODULE_MANAGER", "MODULE_OPERATOR"],
      default: null,
    },

    moduleScopes: {
      type: [{ type: String, enum: ["DS", "SE", "QA", "BA", "PM"] }],
      default: [],
    },

    // ── Account Status ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["INVITED", "PENDING", "ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    // ── Email Verification (students via OTP) ────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCodeHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },

    // ── Staff Invite Token ───────────────────────────────────────────────────
    // Plain code is given to the admin, stored here as a bcrypt hash
    inviteToken: { type: String, default: null },
    inviteExpiresAt: { type: Date, default: null },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Organisation fields ───────────────────────────────────────────────────
    organizationName: { type: String, default: null, trim: true },
    documentUrl: { type: String, default: null },   // uploaded PDF path
    approvalNote: { type: String, default: null },  // UniAdmin decline reason

    // ── Optional relations ───────────────────────────────────────────────────
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: "University", default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);