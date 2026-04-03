import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

// ── Multer configuration for CV uploads ─────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cvStorage = multer.diskStorage({
    destination: path.join(__dirname, "../../uploads/cvs"),
    filename: (_req, file, cb) => {
        const safeExt = path.extname(file.originalname).toLowerCase();
        cb(null, `cv-${Date.now()}${safeExt}`);
    },
});
const cvFileFilter = (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and Word documents are allowed for CVs"));
};
export const uploadCV = multer({
    storage: cvStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: cvFileFilter,
}).single("cv");

// ── Apply to a job (student) ─────────────────────────────────────────────────
// POST /api/jobs/:id/apply
export const applyToJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.status !== "active") return res.status(400).json({ message: "This job is no longer accepting applications" });

        // Prevent duplicate applications
        const existing = await Application.findOne({ jobId: job._id, studentId: req.user.userId });
        if (existing) return res.status(409).json({ message: "You have already applied to this job" });

        const { coverLetter } = req.body;
        const cvUrl = req.file ? `/uploads/cvs/${req.file.filename}` : (req.body.cvUrl || null);

        const application = await Application.create({
            jobId: job._id,
            studentId: req.user.userId,
            coverLetter: coverLetter || "",
            cvUrl,
        });

        res.status(201).json({ message: "Application submitted successfully", application });
    } catch (e) {
        if (e.code === 11000) return res.status(409).json({ message: "You have already applied to this job" });
        res.status(500).json({ message: e.message });
    }
};

// ── My applications (student) ────────────────────────────────────────────────
// GET /api/applications/mine
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ studentId: req.user.userId })
            .populate("jobId", "title company location workMode type status deadline")
            .sort({ appliedAt: -1 })
            .lean();

        res.json({ total: applications.length, applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

