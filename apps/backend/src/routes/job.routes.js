import { Router } from "express";
import { getJobs, getMyJobs, createJob, updateJob, deleteJob, downloadJobsPDF } from "../controllers/job.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

// Org-only routes
router.use(requireAuth);
router.get("/mine", requireRole("ORGANIZATION"), getMyJobs);
router.get("/download-pdf", requireRole("ORGANIZATION"), downloadJobsPDF);
router.post("/", requireRole("ORGANIZATION"), createJob);
router.put("/:id", requireRole("ORGANIZATION"), updateJob);
router.delete("/:id", requireRole("ORGANIZATION"), deleteJob);

export default router;
