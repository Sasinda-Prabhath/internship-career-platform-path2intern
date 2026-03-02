import { Router } from "express";
import {
    assignManager,
    assignOperator,
    removeRole,
    listRoles,
    submitQuestion,
    getAllQuestions,
    getPendingQuestions,
    getApprovedQuestions,
    getMySubmissions,
    reviewQuestion,
    updateQuestion,
    deleteQuestion,
} from "../controllers/module.controller.js";
import { requireAuth, requireRole, requireModuleRole } from "../middleware/auth.middleware.js";

const router = Router();

// All module routes require authentication
router.use(requireAuth);

// ─── Role Assignment ──────────────────────────────────────────────────────────

/**
 * POST /api/module/assign-manager
 * University Admin assigns a MODULE_MANAGER to a module.
 */
router.post(
    "/assign-manager",
    requireRole("UNIVERSITY_ADMIN", "SYSTEM_ADMIN"),
    assignManager
);

/**
 * POST /api/module/assign-operator
 * MODULE_MANAGER assigns a MODULE_OPERATOR (module resolved from request body).
 * requireModuleRole with null module = reads from req.body.module at runtime.
 */
router.post(
    "/assign-operator",
    requireModuleRole(null, ["MODULE_MANAGER"]),
    assignOperator
);

/**
 * DELETE /api/module/remove-role
 * Uni Admin can remove anyone; Manager can remove only operators from their module.
 * No extra middleware — permission logic is inside the controller.
 */
router.delete("/remove-role", removeRole);

/**
 * GET /api/module/roles/:module
 * List all managers and operators for a module.
 * Accessible by: MODULE_MANAGER of that module OR system/uni admin.
 */
router.get("/roles/:module", listRoles);

// ─── MCQ Submission ───────────────────────────────────────────────────────────

/**
 * POST /api/module/questions
 * Submit a new MCQ. Both MANAGER and OPERATOR can submit.
 * Role check + auto-approve logic is inside the controller.
 */
router.post("/questions", submitQuestion);

/**
 * GET /api/module/questions/my-submissions
 * Current user's submitted questions across all modules (for operators' "My Submissions" panel).
 * MUST be declared BEFORE /questions/:module to avoid conflict.
 */
router.get("/questions/my-submissions", getMySubmissions);

/**
 * GET /api/module/questions/:module
 * All questions for a module (pending + approved + declined).
 * MODULE_MANAGER only.
 */
router.get(
    "/questions/:module",
    requireModuleRole(null, ["MODULE_MANAGER"]),
    getAllQuestions
);

/**
 * GET /api/module/questions/:module/pending
 * Pending-only questions for the review queue.
 * MODULE_MANAGER only.
 */
router.get(
    "/questions/:module/pending",
    requireModuleRole(null, ["MODULE_MANAGER"]),
    getPendingQuestions
);

/**
 * GET /api/module/questions/:module/approved
 * Approved questions visible to students (answers hidden by default).
 * Any authenticated user.
 */
router.get("/questions/:module/approved", getApprovedQuestions);

/**
 * PATCH /api/module/questions/:id/review
 * Approve or decline a pending question.
 * MODULE_MANAGER only (verified inside controller against the question's module).
 */
router.patch("/questions/:id/review", reviewQuestion);

/**
 * PATCH /api/module/questions/:id
 * Update a question. Submitter (pending only) OR module manager.
 */
router.patch("/questions/:id", updateQuestion);

/**
 * DELETE /api/module/questions/:id
 * Delete a question. Submitter OR module manager can delete.
 */
router.delete("/questions/:id", deleteQuestion);

export default router;
