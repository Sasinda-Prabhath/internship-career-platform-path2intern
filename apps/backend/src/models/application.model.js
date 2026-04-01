import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cvUrl: { type: String, required: true },
        cvOriginalName: { type: String, required: true },
        status: {
            type: String,
            enum: ["submitted", "shortlisted", "rejected"],
            default: "submitted",
        },
    },
    { timestamps: true }
);

applicationSchema.index({ job: 1, student: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);