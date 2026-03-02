import { api } from "./api";

// ─── Role Assignment ──────────────────────────────────────────────────────────

/** Assign a user as MODULE_MANAGER for a module (UniAdmin only) */
export const assignManager = (email, module) =>
    api.post("/api/module/assign-manager", { email, module });

/** Assign a user as MODULE_OPERATOR for a module (Manager only) */
export const assignOperator = (email, module) =>
    api.post("/api/module/assign-operator", { email, module });

/** Remove a scoped role from a user for a module */
export const removeRole = (email, module) =>
    api.delete("/api/module/remove-role", { data: { email, module } });

/** List all managers + operators for a module */
export const listRoles = (module) =>
    api.get(`/api/module/roles/${module}`);

// ─── Questions / MCQs ─────────────────────────────────────────────────────────

/**
 * Submit a new MCQ.
 * @param {{ module, questionText, options, correctOption, explanation? }} payload
 */
export const submitQuestion = (payload) =>
    api.post("/api/module/questions", payload);

/** All questions for a module (manager view — all statuses) */
export const getAllQuestions = (module) =>
    api.get(`/api/module/questions/${module}`);

/** Pending questions only — the manager's review queue */
export const getPendingQuestions = (module) =>
    api.get(`/api/module/questions/${module}/pending`);

/** Approved questions — visible to students (answers hidden by default) */
export const getApprovedQuestions = (module, withAnswers = false) =>
    api.get(`/api/module/questions/${module}/approved`, {
        params: withAnswers ? { withAnswers: "true" } : {},
    });

/** Current user's own submissions across all modules */
export const getMySubmissions = () =>
    api.get("/api/module/questions/my-submissions");

/** Approve or decline a pending question */
export const reviewQuestion = (id, action, reason = "") =>
    api.patch(`/api/module/questions/${id}/review`, { action, reason });

/** Delete a question (submitter or manager) */
export const deleteQuestion = (id) =>
    api.delete(`/api/module/questions/${id}`);
