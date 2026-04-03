import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// POST /api/applications/parse-cv
export const parseCv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "CV/Resume file is required" });
        }
        
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        
        if (req.user && req.user.userId) {
            const user = await User.findById(req.user.userId);
            if (user) {
                user.cvFilename = req.file.filename;
                user.cvText = data.text;
                await user.save();
            }
        }
        
        res.json({ 
            filename: req.file.filename, 
            cvText: data.text 
        });
    } catch (e) {
        console.error("PDF Parsing Error:", e);
        res.status(500).json({ message: "Failed to parse CV: " + e.message });
    }
};

// DELETE /api/applications/cv
export const deleteCv = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.cvFilename = null;
        user.cvText = null;
        await user.save();
        res.json({ message: "CV deleted successfully" });
    } catch(e) {
        res.status(500).json({ message: e.message });
    }
};

// POST /api/applications - Student applies for a job
export const applyForJob = async (req, res) => {
    try {
        const { jobId, resumeFilename, cvText } = req.body;
        
        if (!jobId || !resumeFilename) {
            return res.status(400).json({ message: "jobId and resumeFilename are required" });
        }

        const job = await Job.findById(jobId);
        if (!job || job.status !== "active") {
            return res.status(404).json({ message: "Job not found or is no longer active" });
        }

        const existingApp = await Application.findOne({
            job: jobId,
            applicant: req.user.userId,
        });

        if (existingApp) {
            return res.status(400).json({ message: "You have already applied for this job" });
        }

        // Skill Matching Logic: Search cvText for the required job skills
        const text = (cvText || "").toLowerCase();
        let missingSkills = [];
        let matchPercentage = 100;
        
        if (job.skills && job.skills.length > 0) {
            missingSkills = job.skills.filter(s => {
                const skill = s.trim();
                const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(^|\\W)${escapedSkill}(\\W|$)`, 'i');
                return !regex.test(text);
            });
            const matchedCount = job.skills.length - missingSkills.length;
            matchPercentage = Math.round((matchedCount / job.skills.length) * 100);
        }

        const application = await Application.create({
            job: jobId,
            applicant: req.user.userId,
            status: "Pending",
            resumeUrl: resumeFilename,
            matchPercentage,
            missingSkills
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
        res.status(400).json({ message: e.message });
    }
};

// GET /api/applications/mine - Student views their applications
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user.userId })
            .populate("job", "title company location type workMode status")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/applications/job/:jobId - Org views applications for a specific job
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You can only view applications for your own job posts" });
        }

        const applications = await Application.find({ job: jobId })
            .populate("applicant", "name email phone")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// PUT /api/applications/:id/status - Org updates application status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!["Pending", "Shortlisted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const application = await Application.findById(req.params.id).populate("job");
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (application.job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You can only update applications for your own job posts" });
        }

        application.status = status;
        await application.save();

        res.json({ message: "Application status updated", application });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// GET /api/applications/org - Org views all applications across their jobs (for dash metrics)
export const getOrgApplications = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.userId }).select("_id");
        const jobIds = jobs.map(j => j._id);
        
        const applications = await Application.find({ job: { $in: jobIds } })
            .select("status createdAt")
            .lean();
            
        res.json({ applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/applications/check/:jobId - Check if student has applied for a job
export const checkApplication = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        if (!jobId) {
            return res.status(400).json({ message: "jobId is required" });
        }

        const application = await Application.findOne({
            job: jobId,
            applicant: req.user.userId,
        });

        res.json({ hasApplied: !!application });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
