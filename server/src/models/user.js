const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SYSTEM_ADMIN", "STUDENT", "ORGANIZATION"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SUSPENDED"],
      default: "ACTIVE",
    },
    profileImage: { type: String, default: null }, // URL or path to profile image
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
