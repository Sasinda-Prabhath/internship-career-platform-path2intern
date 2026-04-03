import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Shortlisted", "Rejected"],
            default: "Pending",
        },
        notes: {
            type: String,
            default: "", // For organizations to leave internal notes if they want
        },
        resumeUrl: {
            type: String,
            required: true,
        },
        matchPercentage: {
            type: Number,
            default: 0,
        },
        missingSkills: {
            type: [String],
            default: [],
        }
    },
    { timestamps: true }
);

// Prevent duplicate applications from the same student for the same job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
