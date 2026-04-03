import { Router } from "express";
import {
	getJobs,
	getMyJobs,
	createJob,
	updateJob,
	deleteJob,
	downloadJobsPDF,
	applyToJob,
	getMyApplications,
	getReceivedApplications,
	updateApplicationStatus,
	downloadApplicationCv,
} from "../controllers/job.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { uploadStudentCv } from "../middleware/upload.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

// Auth required for all routes below
router.use(requireAuth);

// Student — apply to a job (with optional CV file upload)
router.post("/:id/apply", requireRole("STUDENT"), uploadCV, applyToJob);

// Org-only routes
router.get("/mine", requireRole("ORGANIZATION"), getMyJobs);
router.get("/download-pdf", requireRole("ORGANIZATION"), downloadJobsPDF);
router.get("/applications/mine", requireRole("STUDENT"), getMyApplications);
router.get("/applications/received", requireRole("ORGANIZATION"), getReceivedApplications);
router.patch("/applications/:applicationId/status", requireRole("ORGANIZATION"), updateApplicationStatus);
router.get("/applications/:applicationId/download-cv", requireRole("ORGANIZATION"), downloadApplicationCv);
router.post("/:id/apply", requireRole("STUDENT"), uploadStudentCv, applyToJob);
router.post("/", requireRole("ORGANIZATION"), createJob);
router.put("/:id", requireRole("ORGANIZATION"), updateJob);
router.delete("/:id", requireRole("ORGANIZATION"), deleteJob);

// Org — applicant management
router.get("/:id/applicants", requireRole("ORGANIZATION"), getJobApplicants);
router.patch("/:id/applicants/:appId", requireRole("ORGANIZATION"), updateApplicantStatus);

// Public job detail (must be last to not conflict with other routes)
router.get("/:id", getJob);

export default router;
