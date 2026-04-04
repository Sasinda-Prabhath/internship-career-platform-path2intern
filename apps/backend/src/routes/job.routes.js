import { Router } from "express";
import {
	getJobs,
	getJobById,
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
	getJobApplicants,
	updateApplicantStatus
} from "../controllers/job.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { uploadStudentCv } from "../middleware/upload.middleware.js";

const router = Router();

// Public — anyone can browse jobs
router.get("/", getJobs);

// Important: /mine MUST be defined before /:id so it doesn't get swallowed
router.get("/mine", requireAuth, requireRole("ORGANIZATION"), getMyJobs);

// Public route to get a single job by id
router.get("/:id", getJobById);

router.use(requireAuth);

// Student routes
router.post("/:id/apply", requireRole("STUDENT"), uploadStudentCv, applyToJob);
router.get("/applications/mine", requireRole("STUDENT"), getMyApplications);

// Org-only routes
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

export default router;
