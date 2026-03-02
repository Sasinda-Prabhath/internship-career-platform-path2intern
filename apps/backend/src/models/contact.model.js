import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true },

        // Admin reply
        replied: { type: Boolean, default: false },
        replyText: { type: String, default: null },
        repliedAt: { type: Date, default: null },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
