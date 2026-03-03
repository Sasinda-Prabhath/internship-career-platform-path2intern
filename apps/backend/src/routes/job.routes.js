import { Router } from "express";
import { getJobs, getJob, getMyJobs, createJob, updateJob, deleteJob, getJobApplicants, updateApplicantStatus } from "../controllers/job.controller.js";
import { applyToJob, uploadCV } from "../controllers/application.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

// Auth required for all routes below
router.use(requireAuth);

// Student — apply to a job (with optional CV file upload)
router.post("/:id/apply", requireRole("STUDENT"), uploadCV, applyToJob);

// Org-only routes
router.get("/mine", requireRole("ORGANIZATION"), getMyJobs);
router.post("/", requireRole("ORGANIZATION"), createJob);
router.put("/:id", requireRole("ORGANIZATION"), updateJob);
router.delete("/:id", requireRole("ORGANIZATION"), deleteJob);

// Org — applicant management
router.get("/:id/applicants", requireRole("ORGANIZATION"), getJobApplicants);
router.patch("/:id/applicants/:appId", requireRole("ORGANIZATION"), updateApplicantStatus);

// Public job detail (must be last to not conflict with other routes)
router.get("/:id", getJob);

export default router;
