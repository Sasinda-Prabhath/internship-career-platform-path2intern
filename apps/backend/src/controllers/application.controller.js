import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ────────────────────────────────────────────────────────────────────────────
// POST /api/applications/parse-cv - Parse uploaded CV files
// ────────────────────────────────────────────────────────────────────────────
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
            cvText: data.text,
        });
    } catch (e) {
        console.error("PDF Parsing Error:", e);
        res.status(500).json({ message: "Failed to parse CV: " + e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/applications/cv - Delete a student's CV
// ────────────────────────────────────────────────────────────────────────────
export const deleteCv = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.cvFilename = null;
        user.cvText = null;
        await user.save();

        res.json({ message: "CV deleted successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/applications - Student applies for a job with skill matching
// ────────────────────────────────────────────────────────────────────────────
export const applyForJob = async (req, res) => {
    try {
        const { jobId, resumeFilename, cvText } = req.body;

        if (!jobId || !resumeFilename) {
            return res.status(400).json({
                message: "jobId and resumeFilename are required",
            });
        }

        const job = await Job.findById(jobId);
        if (!job || job.status !== "active") {
            return res.status(404).json({
                message: "Job not found or is no longer active",
            });
        }

        const existingApp = await Application.findOne({
            job: jobId,
            applicant: req.user.userId,
        });

        if (existingApp) {
            return res.status(400).json({
                message: "You have already applied for this job",
            });
        }

        // Skill Matching Logic: Search cvText for the required job skills
        const text = (cvText || "").toLowerCase();
        let missingSkills = [];
        let matchPercentage = 100;

        if (job.skills && job.skills.length > 0) {
            missingSkills = job.skills.filter((s) => {
                const skill = s.trim();
                const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const regex = new RegExp(`(^|\\W)${escapedSkill}(\\W|$)`, "i");
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
            missingSkills,
        });

        res.status(201).json({
            message: "Application submitted successfully",
            application,
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/applications/mine - Get all applications for a student
// ────────────────────────────────────────────────────────────────────────────
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            applicant: req.user.userId,
        })
            .populate("job", "title company location type workMode status")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/applications/job/:jobId - Get all applications for a specific job
// ────────────────────────────────────────────────────────────────────────────
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                message:
                    "You can only view applications for your own job posts",
            });
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

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/applications/:id/status - Update application status
// ────────────────────────────────────────────────────────────────────────────
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        if (!["Pending", "Shortlisted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const job = await Job.findById(application.job);
        if (job.postedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You can only update applications for your own jobs",
            });
        }

        application.status = status;
        if (notes) {
            application.notes = notes;
        }
        await application.save();

        res.json({
            message: "Application status updated successfully",
            application,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/applications/org - Get all applications for an organization
// ────────────────────────────────────────────────────────────────────────────
export const getOrgApplications = async (req, res) => {
    try {
        // Find all jobs posted by this organization
        const jobs = await Job.find({ postedBy: req.user.userId });
        const jobIds = jobs.map((job) => job._id);

        // Find all applications for those jobs
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate("job", "title company location type workMode status")
            .populate("applicant", "name email phone")
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            totalApplications: applications.length,
            applications,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/applications/check/:jobId - Check if student has applied for a job
// ────────────────────────────────────────────────────────────────────────────
export const checkApplication = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const application = await Application.findOne({
            job: jobId,
            applicant: req.user.userId,
        });

        if (application) {
            return res.json({
                hasApplied: true,
                status: application.status,
                matchPercentage: application.matchPercentage,
                missingSkills: application.missingSkills,
            });
        }

        res.json({
            hasApplied: false,
            status: null,
            matchPercentage: null,
            missingSkills: null,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
