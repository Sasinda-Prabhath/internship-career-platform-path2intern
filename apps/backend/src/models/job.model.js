import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        company: { type: String, required: true, trim: true },

        // Location
        province: { type: String, default: "" },
        district: { type: String, default: "" },
        location: { type: String, required: true, trim: true }, // stored as "District, Province"

        workMode: {
            type: String,
            enum: ["Remote", "Hybrid", "On-site"],
            default: "Hybrid",
        },

        type: {
            type: String,
            enum: ["Internship", "Part-time", "Full-time"],
            default: "Internship",
        },

        duration: { type: String, default: "" },
        // Salary range
        salaryMin: { type: Number, default: null },
        salaryMax: { type: Number, default: null },
        salaryCurrency: { type: String, default: "LKR" },
        salaryPeriod: { type: String, default: "month" }, // month / year

        skills: { type: [String], default: [] },
        requirements: { type: String, default: "" },

        deadline: { type: Date, default: null },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
        },
    },
    { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
