import { Router } from "express";
import { suggestResumeField } from "../controllers/resumeAi.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/ai", requireAuth, requireRole("STUDENT"), suggestResumeField);

export default router;
