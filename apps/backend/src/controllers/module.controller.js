import { User } from "../models/user.model.js";
import { ModuleScopedRole } from "../models/moduleScopedRole.model.js";
import { Question } from "../models/question.model.js";
import { resolveModuleRole } from "../middleware/auth.middleware.js";

const VALID_MODULES = ["DS", "SE", "QA", "BA", "PM"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateModule = (module) => {
    if (!VALID_MODULES.includes(module)) {
        throw new Error(`Invalid module "${module}". Must be one of: ${VALID_MODULES.join(", ")}`);
    }
};

// ─── Role Assignment ──────────────────────────────────────────────────────────

/**
 * POST /api/module/assign-manager
 * Body: { email, module }
 * Guard: UNIVERSITY_ADMIN (global role)
 *
 * University Admin assigns a user as MODULE_MANAGER for a module.
 */
export const assignManager = async (req, res) => {
    try {
        const { email, module } = req.body;
        if (!email || !module) {
            return res.status(400).json({ message: "email and module are required" });
        }
        validateModule(module);

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) return res.status(404).json({ message: "User not found with that email" });

        // Upsert: if they already have a role in this module, overwrite it
        const scopedRole = await ModuleScopedRole.findOneAndUpdate(
            { userId: targetUser._id, module },
            {
                role: "MODULE_MANAGER",
                assignedBy: req.user.userId,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            message: `${targetUser.name} assigned as MODULE_MANAGER for ${module}`,
            scopedRole: {
                userId: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                module,
                role: "MODULE_MANAGER",
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * POST /api/module/assign-operator
 * Body: { email, module }
 * Guard: MODULE_MANAGER for that module (checked by middleware — module from body)
 *
 * Module Manager assigns a user as MODULE_OPERATOR for their module.
 */
export const assignOperator = async (req, res) => {
    try {
        const { email, module } = req.body;
        if (!email || !module) {
            return res.status(400).json({ message: "email and module are required" });
        }
        validateModule(module);

        // Security: manager can only assign operators to modules they manage
        const managerRoleStr = await resolveModuleRole(req.user.userId, module, ["MODULE_MANAGER"]);
        if (!managerRoleStr) {
            return res.status(403).json({ message: `You are not a MODULE_MANAGER for ${module}` });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) return res.status(404).json({ message: "User not found with that email" });

        // Don't allow assigning someone who is already a manager for this module
        const existing = await ModuleScopedRole.findOne({ userId: targetUser._id, module });
        if (existing && existing.role === "MODULE_MANAGER") {
            return res.status(409).json({
                message: `${targetUser.name} is already a MODULE_MANAGER for ${module} and cannot be downgraded to operator`,
            });
        }

        const scopedRole = await ModuleScopedRole.findOneAndUpdate(
            { userId: targetUser._id, module },
            {
                role: "MODULE_OPERATOR",
                assignedBy: req.user.userId,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            message: `${targetUser.name} assigned as MODULE_OPERATOR for ${module}`,
            scopedRole: {
                userId: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                module,
                role: "MODULE_OPERATOR",
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * DELETE /api/module/remove-role
 * Body: { email, module }
 * Guard:
 *   - UNIVERSITY_ADMIN can remove anyone
 *   - MODULE_MANAGER can only remove MODULE_OPERATORs from their module
 */
export const removeRole = async (req, res) => {
    try {
        const { email, module } = req.body;
        if (!email || !module) {
            return res.status(400).json({ message: "email and module are required" });
        }
        validateModule(module);

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        const existing = await ModuleScopedRole.findOne({ userId: targetUser._id, module });
        if (!existing) {
            return res.status(404).json({ message: "No scoped role found for that user and module" });
        }

        // MODULE_MANAGER can only remove operators, not other managers
        if (req.user.globalRole === "UNIVERSITY_ADMIN") {
            // Can remove any role
        } else {
            // Must be a manager for this module
            const callerRoleStr = await resolveModuleRole(req.user.userId, module, ["MODULE_MANAGER"]);
            if (!callerRoleStr) {
                return res.status(403).json({ message: `You are not a MODULE_MANAGER for ${module}` });
            }
            if (existing.role === "MODULE_MANAGER") {
                return res.status(403).json({ message: "Only a University Admin can remove a Module Manager" });
            }
        }

        await ModuleScopedRole.deleteOne({ _id: existing._id });

        res.json({
            message: `Removed ${existing.role} role from ${targetUser.name} for module ${module}`,
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * GET /api/module/roles/:module
 * Guard: MODULE_MANAGER for that module OR UNIVERSITY_ADMIN
 *
 * Returns all managers and operators for a given module.
 */
export const listRoles = async (req, res) => {
    try {
        const { module } = req.params;
        validateModule(module);

        const roles = await ModuleScopedRole.find({ module })
            .populate("userId", "name email")
            .populate("assignedBy", "name email")
            .lean();

        const formatted = roles.map((r) => ({
            id: r._id,
            user: { id: r.userId?._id, name: r.userId?.name, email: r.userId?.email },
            role: r.role,
            module: r.module,
            assignedBy: r.assignedBy
                ? { name: r.assignedBy.name, email: r.assignedBy.email }
                : null,
            assignedAt: r.createdAt,
        }));

        res.json({ module, roles: formatted });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── MCQ Submission ───────────────────────────────────────────────────────────

/**
 * POST /api/module/questions
 * Body: { module, questionText, options: [{label, text}], correctOption, explanation? }
 * Guard: MODULE_MANAGER or MODULE_OPERATOR for the module in body
 *
 * Manager submissions are auto-approved.
 * Operator submissions start as "pending".
 */
export const submitQuestion = async (req, res) => {
    try {
        const { module, questionText, options, correctOption, explanation } = req.body;

        if (!module || !questionText || !options || !correctOption) {
            return res.status(400).json({
                message: "module, questionText, options, and correctOption are required",
            });
        }
        validateModule(module);

        // Validate options
        if (!Array.isArray(options) || options.length !== 4) {
            return res.status(400).json({ message: "Exactly 4 options (A, B, C, D) are required" });
        }
        const labels = options.map((o) => o.label);
        if (!["A", "B", "C", "D"].every((l) => labels.includes(l))) {
            return res.status(400).json({ message: "Options must have labels A, B, C, and D" });
        }
        if (!["A", "B", "C", "D"].includes(correctOption)) {
            return res.status(400).json({ message: "correctOption must be A, B, C, or D" });
        }

        // Determine submitter's scoped role for this module.
        // Use req.resolvedModuleRole if the middleware already resolved it,
        // otherwise fall back to resolveModuleRole() (handles both User model and legacy collection).
        const submitterRole =
            req.resolvedModuleRole ||
            (await resolveModuleRole(req.user.userId, module, ["MODULE_MANAGER", "MODULE_OPERATOR"]));

        if (!submitterRole) {
            return res.status(403).json({
                message: `You do not have a MODULE_MANAGER or MODULE_OPERATOR role for module ${module}`,
            });
        }
        // Managers' questions are immediately approved; operators' are pending
        const status = submitterRole === "MODULE_MANAGER" ? "approved" : "pending";

        const question = await Question.create({
            module,
            questionText,
            options,
            correctOption,
            explanation: explanation || null,
            submittedBy: req.user.userId,
            submitterRole,
            status,
            // Auto-fill review fields for manager submissions
            reviewedBy: status === "approved" ? req.user.userId : null,
            reviewedAt: status === "approved" ? new Date() : null,
        });

        res.status(201).json({
            message:
                status === "approved"
                    ? "Question published immediately (manager submission)."
                    : "Question submitted and is awaiting manager review.",
            question: {
                id: question._id,
                module: question.module,
                questionText: question.questionText,
                status: question.status,
                submitterRole,
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── MCQ Listing ──────────────────────────────────────────────────────────────

/**
 * GET /api/module/questions/:module
 * Guard: MODULE_MANAGER for the module
 *
 * Returns ALL questions (pending + approved + declined) for a module.
 * Useful for the manager's full question bank view.
 */
export const getAllQuestions = async (req, res) => {
    try {
        const { module } = req.params;
        validateModule(module);

        const questions = await Question.find({ module })
            .populate("submittedBy", "name email")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ module, total: questions.length, questions });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * GET /api/module/questions/:module/pending
 * Guard: MODULE_MANAGER for the module
 *
 * Returns only pending questions — the manager's review queue.
 */
export const getPendingQuestions = async (req, res) => {
    try {
        const { module } = req.params;
        validateModule(module);

        const questions = await Question.find({ module, status: "pending" })
            .populate("submittedBy", "name email")
            .sort({ createdAt: 1 }) // oldest first → review in order
            .lean();

        res.json({ module, pending: questions.length, questions });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * GET /api/module/questions/:module/approved
 * Guard: requireAuth (any authenticated user — students, managers, operators)
 *
 * Returns only approved questions (hides correct answers for student-facing use).
 * Managers/operators see full data; students see no correctOption.
 */
export const getApprovedQuestions = async (req, res) => {
    try {
        const { module } = req.params;
        validateModule(module);

        const { withAnswers } = req.query; // ?withAnswers=true for managers

        const questions = await Question.find({ module, status: "approved" })
            .sort({ createdAt: -1 })
            .lean();

        // Hide correct answers unless explicitly requested AND the user is a manager/operator
        const isPrivileged =
            req.user?.globalRole === "SYSTEM_ADMIN" ||
            req.user?.globalRole === "UNIVERSITY_ADMIN" ||
            withAnswers === "true";

        const formatted = questions.map((q) => {
            if (!isPrivileged) {
                // Strip correctOption and explanation for students
                // eslint-disable-next-line no-unused-vars
                const { correctOption, explanation, ...safe } = q;
                return safe;
            }
            return q;
        });

        res.json({ module, total: formatted.length, questions: formatted });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * GET /api/module/questions/my-submissions
 * Guard: requireAuth
 *
 * Returns all questions submitted by the currently authenticated user,
 * across all modules. Useful for operator's "My Submissions" panel.
 */
export const getMySubmissions = async (req, res) => {
    try {
        const questions = await Question.find({ submittedBy: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ total: questions.length, questions });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── MCQ Review ───────────────────────────────────────────────────────────────

/**
 * PATCH /api/module/questions/:id/review
 * Body: { action: "approve" | "decline", reason?: string }
 * Guard: MODULE_MANAGER for the question's module
 *
 * Approves or declines a pending question.
 */
export const reviewQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;

        if (!["approve", "decline"].includes(action)) {
            return res.status(400).json({ message: 'action must be "approve" or "decline"' });
        }

        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        // Verify the reviewer is a manager for *this* question's module
        const reviewerRole = await resolveModuleRole(req.user.userId, question.module, ["MODULE_MANAGER"]);
        if (!reviewerRole) {
            return res.status(403).json({
                message: `You are not a MODULE_MANAGER for module ${question.module}`,
            });
        }

        if (question.status !== "pending") {
            return res.status(409).json({
                message: `Question is already "${question.status}" and cannot be reviewed again`,
            });
        }

        question.status = action === "approve" ? "approved" : "declined";
        question.reviewedBy = req.user.userId;
        question.reviewedAt = new Date();
        question.declineReason = action === "decline" ? (reason || null) : null;
        await question.save();

        res.json({
            message: `Question ${question.status}.`,
            question: {
                id: question._id,
                questionText: question.questionText,
                status: question.status,
                reviewedAt: question.reviewedAt,
                declineReason: question.declineReason,
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * DELETE /api/module/questions/:id
 * Guard: MODULE_MANAGER for the question's module OR the original submitter
 *
 * Permanently deletes a question.
 */
export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        const isSubmitter = question.submittedBy.toString() === req.user.userId;
        const managerRoleStr = await resolveModuleRole(req.user.userId, question.module, ["MODULE_MANAGER"]);

        if (!isSubmitter && !managerRoleStr) {
            return res.status(403).json({ message: "Forbidden: you cannot delete this question" });
        }

        await Question.deleteOne({ _id: question._id });
        res.json({ message: "Question deleted." });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

/**
 * PATCH /api/module/questions/:id
 * Body: { questionText?, options?, correctOption?, explanation? }
 * Guard: original submitter (pending only) OR MODULE_MANAGER for that module
 */
export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        const isSubmitter = question.submittedBy.toString() === req.user.userId;
        const managerRole = await resolveModuleRole(req.user.userId, question.module, ["MODULE_MANAGER"]);

        if (!isSubmitter && !managerRole) {
            return res.status(403).json({ message: "Forbidden: you cannot edit this question" });
        }
        if (isSubmitter && !managerRole && question.status !== "pending") {
            return res.status(409).json({ message: "You can only edit questions still pending review" });
        }

        const { questionText, options, correctOption, explanation } = req.body;

        if (questionText !== undefined) question.questionText = questionText;
        if (explanation !== undefined) question.explanation = explanation;
        if (correctOption !== undefined) {
            if (!["A", "B", "C", "D"].includes(correctOption))
                return res.status(400).json({ message: "correctOption must be A, B, C, or D" });
            question.correctOption = correctOption;
        }
        if (options !== undefined) {
            if (!Array.isArray(options) || options.length !== 4)
                return res.status(400).json({ message: "Exactly 4 options required" });
            question.options = options;
        }

        await question.save();
        res.json({ message: "Question updated.", question: { id: question._id, module: question.module, questionText: question.questionText, status: question.status } });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};
