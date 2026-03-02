import { Router } from "express";
import { listPendingOrgs, listAllOrgs, approveOrg, declineOrg } from "../controllers/org.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All org management routes require UniAdmin or SysAdmin
router.use(requireAuth, requireRole("UNIVERSITY_ADMIN", "SYSTEM_ADMIN"));

router.get("/pending", listPendingOrgs);
router.get("/all", listAllOrgs);
router.patch("/:id/approve", approveOrg);
router.patch("/:id/decline", declineOrg);

export default router;
