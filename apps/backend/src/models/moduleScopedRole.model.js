import mongoose from "mongoose";

const moduleScopedRoleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        module: {
            type: String,
            required: true,
            enum: ["DS", "SE", "QA", "BA", "PM"],
        },

        // MODULE_MANAGER: full control (assign operators, review MCQs, manage content)
        // MODULE_OPERATOR: can submit MCQs (requires manager approval before visible)
        role: {
            type: String,
            required: true,
            enum: ["MODULE_MANAGER", "MODULE_OPERATOR"],
        },

        // Who assigned this role (for audit trail)
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

// A user can only hold one role per module at a time
moduleScopedRoleSchema.index({ userId: 1, module: 1 }, { unique: true });

export const ModuleScopedRole = mongoose.model("ModuleScopedRole", moduleScopedRoleSchema);
