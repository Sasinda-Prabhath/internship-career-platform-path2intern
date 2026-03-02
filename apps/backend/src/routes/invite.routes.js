import { Router } from "express";
import {
    inviteStaff,
    listStaff,
    acceptInvite,
    regenerateCode,
    updateStaff,
    updateStatus,
    deleteStaff,
} from "../controllers/invite.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public — no auth needed
router.post("/accept", acceptInvite);

// Protected — University Admin or System Admin
router.use(requireAuth, requireRole("UNIVERSITY_ADMIN", "SYSTEM_ADMIN"));

router.post("/staff", inviteStaff);
router.get("/staff", listStaff);
router.post("/staff/:id/regenerate", regenerateCode);
router.patch("/staff/:id", updateStaff);
router.patch("/staff/:id/status", updateStatus);
router.delete("/staff/:id", deleteStaff);

export default router;
