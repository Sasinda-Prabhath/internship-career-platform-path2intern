import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, enum: ["A", "B", "C", "D"] },
        text: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        // ── Content ──────────────────────────────────────────────────────────
        module: {
            type: String,
            required: true,
            enum: ["DS", "SE", "QA", "BA", "PM"],
            index: true,
        },

        questionText: {
            type: String,
            required: true,
            trim: true,
        },

        // Exactly 4 options: A, B, C, D
        options: {
            type: [optionSchema],
            validate: {
                validator: (arr) => arr.length === 4,
                message: "Exactly 4 options (A, B, C, D) are required.",
            },
        },

        correctOption: {
            type: String,
            required: true,
            enum: ["A", "B", "C", "D"],
        },

        explanation: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Authorship ────────────────────────────────────────────────────────
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        submitterRole: {
            type: String,
            required: true,
            enum: ["MODULE_MANAGER", "MODULE_OPERATOR"],
        },

        // ── Moderation ────────────────────────────────────────────────────────
        // MODULE_MANAGER submissions are auto-approved at creation.
        // MODULE_OPERATOR submissions start as "pending" and require manager review.
        status: {
            type: String,
            required: true,
            enum: ["pending", "approved", "declined"],
            default: "pending",
            index: true,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        declineReason: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index: fetch pending questions for a module efficiently
questionSchema.index({ module: 1, status: 1 });

export const Question = mongoose.model("Question", questionSchema);
