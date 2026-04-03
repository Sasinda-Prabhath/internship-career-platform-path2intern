import { Router } from "express";
import { getMyApplications } from "../controllers/application.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Student — view their own applications
router.get("/mine", requireRole("STUDENT"), getMyApplications);

export default router;
