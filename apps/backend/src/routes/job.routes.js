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

// Org-only routes
router.use(requireAuth);
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

export default router;
