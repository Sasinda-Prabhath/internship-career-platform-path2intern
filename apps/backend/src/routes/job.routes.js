import { Router } from "express";
import {
	getJobs,
	getMyJobs,
	createJob,
	updateJob,
	deleteJob,
	getJobById,
	downloadJobsPDF,
	applyToJob,
	getMyApplications,
	getReceivedApplications,
	updateApplicationStatus,
	downloadApplicationCv,
	getJobApplicants,
	updateApplicantStatus,
} from "../controllers/job.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { uploadStudentCv } from "../middleware/upload.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

router.use(requireAuth);
// Auth required for all routes below

// Student — apply to a job (with optional CV file upload)
router.post("/:id/apply", requireRole("STUDENT"), uploadStudentCv, applyToJob);

// Student — view own applications
router.get("/applications/mine", requireRole("STUDENT"), getMyApplications);

// Org-only routes
router.get("/mine", requireRole("ORGANIZATION"), getMyJobs);
router.get("/download-pdf", requireRole("ORGANIZATION"), downloadJobsPDF);
router.get("/applications/received", requireRole("ORGANIZATION"), getReceivedApplications);
router.patch("/applications/:applicationId/status", requireRole("ORGANIZATION"), updateApplicationStatus);
router.get("/applications/:applicationId/download-cv", requireRole("ORGANIZATION"), downloadApplicationCv);
router.post("/", requireRole("ORGANIZATION"), createJob);
router.put("/:id", requireRole("ORGANIZATION"), updateJob);
router.delete("/:id", requireRole("ORGANIZATION"), deleteJob);

// Org — applicant management
router.get("/:id/applicants", requireRole("ORGANIZATION"), getJobApplicants);
router.patch("/:id/applicants/:appId", requireRole("ORGANIZATION"), updateApplicantStatus);
router.get("/:id", getJobById);

export default router;
