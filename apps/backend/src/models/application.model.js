import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        },
        cvUrl: { type: String, default: null }, // path to uploaded CV
        coverLetter: { type: String, default: "" },
        appliedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// A student can only apply once per job
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
