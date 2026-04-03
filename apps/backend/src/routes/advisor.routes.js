import { Router } from "express";
import { getMissingSkillsAdvice } from "../controllers/advisor.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("STUDENT"), getMissingSkillsAdvice);

export default router;
