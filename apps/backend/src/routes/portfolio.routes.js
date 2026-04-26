import { Router } from "express";
import { getMine, upsert, getPublicByUsername } from "../controllers/portfolio.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, requireRole("STUDENT"), getMine);
router.post("/", requireAuth, requireRole("STUDENT"), upsert);
router.get("/:username", getPublicByUsername);

export default router;
