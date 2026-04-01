import { Router } from "express";
import { getJobs, getJobById, getMyJobs, createJob, updateJob, deleteJob } from "../controllers/job.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

// Org-only routes
// Important: /mine MUST be defined before /:id so it doesn't get swallowed
router.get("/mine", requireAuth, requireRole("ORGANIZATION"), getMyJobs);

router.get("/:id", getJobById);

router.use(requireAuth);
router.post("/", requireRole("ORGANIZATION"), createJob);
router.put("/:id", requireRole("ORGANIZATION"), updateJob);
router.delete("/:id", requireRole("ORGANIZATION"), deleteJob);

export default router;
