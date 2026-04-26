import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    tech: { type: [String], default: [] },
  },
  { _id: true }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: "" },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    projects: { type: [projectSchema], default: [] },
    education: { type: String, default: "" },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

portfolioSchema.index({ username: 1 });

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
