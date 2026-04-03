import { Router } from "express";
import {
    parseCv,
    deleteCv,
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    getOrgApplications,
    checkApplication
} from "../controllers/application.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";

const router = Router();

router.use(requireAuth);

// Student routes
router.post("/parse-cv", requireRole("STUDENT"), uploadResume, parseCv);
router.delete("/cv", requireRole("STUDENT"), deleteCv);
router.post("/", requireRole("STUDENT"), applyForJob);
router.get("/mine", requireRole("STUDENT"), getMyApplications);
router.get("/check/:jobId", requireRole("STUDENT"), checkApplication);

// Organization routes
router.get("/org", requireRole("ORGANIZATION", "RECRUITER"), getOrgApplications);
router.get("/job/:jobId", requireRole("ORGANIZATION", "RECRUITER"), getJobApplications);
router.put("/:id/status", requireRole("ORGANIZATION", "RECRUITER"), updateApplicationStatus);

export default router;
