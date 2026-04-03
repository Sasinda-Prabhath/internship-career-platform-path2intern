import { Router } from "express";
import { generateBio, improveProject, suggestSkills } from "../controllers/ai.mock.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/generate-bio", requireAuth, requireRole("STUDENT"), generateBio);
router.post("/improve-project", requireAuth, requireRole("STUDENT"), improveProject);
router.post("/suggest-skills", requireAuth, requireRole("STUDENT"), suggestSkills);

export default router;
