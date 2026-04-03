import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { User } from "../models/user.model.js";

const EDIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const salaryDisplay = (job) => {
    if (!job.salaryMin && !job.salaryMax) return "";
    const cur = job.salaryCurrency || "LKR";
    const per = job.salaryPeriod || "month";
    if (job.salaryMin && job.salaryMax) return `${cur} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} / ${per}`;
    if (job.salaryMin) return `From ${cur} ${job.salaryMin.toLocaleString()} / ${per}`;
    return `Up to ${cur} ${job.salaryMax.toLocaleString()} / ${per}`;
};

const resolveUploadPath = (fileUrl) => path.join(__dirname, "../../", fileUrl.replace(/^\//, ""));

const buildApplicationSummary = (application) => ({
    ...application,
    cvDownloadUrl: `/api/jobs/applications/${application._id}/download-cv`,
});

const allowedApplicationStatuses = ["submitted", "shortlisted", "rejected"];

// GET /api/jobs  — public, all active jobs newest first
// GET /api/jobs/:id  — public, get single job
export const getJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate("postedBy", "name email organizationName")
            .lean();
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.status !== "active") return res.status(404).json({ message: "Job not found" });

        const result = { ...job, salaryDisplay: salaryDisplay(job) };
        res.json(result);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
export const getJobs = async (req, res) => {
    try {
        const { search, workMode, type, province, district } = req.query;
        const filter = { status: "active" };
        if (workMode) filter.workMode = workMode;
        if (type) filter.type = type;
        if (province) filter.province = province;
        if (district) filter.district = district;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
                { skills: { $elemMatch: { $regex: search, $options: "i" } } },
                { location: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        const jobs = await Job.find(filter)
            .populate("postedBy", "name email organizationName")
            .sort({ createdAt: -1 })
            .lean();
        // Attach computed salary display string
        const result = jobs.map(j => ({ ...j, salaryDisplay: salaryDisplay(j) }));
        res.json({ total: result.length, jobs: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/jobs/mine  — org only, their own jobs
export const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();
        const applicationsByJob = await Application.aggregate([
            {
                $match: {
                    organization: jobObjectId(req.user.userId),
                },
            },
            {
                $group: {
                    _id: "$job",
                    total: { $sum: 1 },
                },
            },
        ]);
        const counts = new Map(applicationsByJob.map((entry) => [entry._id.toString(), entry.total]));
        const now = Date.now();
        const annotated = jobs.map((j) => ({
            ...j,
            salaryDisplay: salaryDisplay(j),
            applicationCount: counts.get(j._id.toString()) || 0,
            canEdit: now - new Date(j.createdAt).getTime() < EDIT_WINDOW_MS,
            editExpiresAt: new Date(new Date(j.createdAt).getTime() + EDIT_WINDOW_MS),
        }));
        res.json({ total: annotated.length, jobs: annotated });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// POST /api/jobs  — org only
export const createJob = async (req, res) => {
    try {
        const {
            title, description, company,
            province, district,
            workMode, type, duration,
            salaryMin, salaryMax, salaryCurrency, salaryPeriod,
            skills, requirements, deadline,
        } = req.body;

        // Use the org's registered name as fallback if company not provided
        let resolvedCompany = company;
        if (!resolvedCompany) {
            const orgUser = await User.findById(req.user.userId).select("organizationName name").lean();
            resolvedCompany = orgUser?.organizationName || orgUser?.name || "";
        }

        if (!title || !description || !resolvedCompany || !province || !district) {
            return res.status(400).json({ message: "title, description, company, province and district are required" });
        }

        const location = `${district}, ${province}`;

        const job = await Job.create({
            title, description, company: resolvedCompany, location,
            province, district,
            workMode: workMode || "Hybrid",
            type: type || "Internship",
            duration: duration || "",
            salaryMin: salaryMin ? Number(salaryMin) : null,
            salaryMax: salaryMax ? Number(salaryMax) : null,
            salaryCurrency: salaryCurrency || "LKR",
            salaryPeriod: salaryPeriod || "month",
            skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : []),
            requirements: requirements || "",
            deadline: deadline ? new Date(deadline) : null,
            postedBy: req.user.userId,
        });

        res.status(201).json({ message: "Job posted successfully", job });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// PUT /api/jobs/:id  — org only, within 10 min of creation
export const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.userId)
            return res.status(403).json({ message: "You can only edit your own job posts" });

        const age = Date.now() - new Date(job.createdAt).getTime();
        if (age > EDIT_WINDOW_MS)
            return res.status(403).json({ message: "The 2-minute edit window has expired. You can only delete this post now." });

        const {
            title, description, company,
            province, district,
            workMode, type, duration,
            salaryMin, salaryMax, salaryCurrency, salaryPeriod,
            skills, requirements, deadline,
        } = req.body;

        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (company !== undefined) job.company = company;
        if (province !== undefined) job.province = province;
        if (district !== undefined) job.district = district;
        if (province || district) job.location = `${district || job.district}, ${province || job.province}`;
        if (workMode !== undefined) job.workMode = workMode;
        if (type !== undefined) job.type = type;
        if (duration !== undefined) job.duration = duration;
        if (salaryMin !== undefined) job.salaryMin = salaryMin ? Number(salaryMin) : null;
        if (salaryMax !== undefined) job.salaryMax = salaryMax ? Number(salaryMax) : null;
        if (salaryCurrency !== undefined) job.salaryCurrency = salaryCurrency;
        if (salaryPeriod !== undefined) job.salaryPeriod = salaryPeriod;
        if (skills !== undefined) job.skills = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (requirements !== undefined) job.requirements = requirements;
        if (deadline !== undefined) job.deadline = deadline ? new Date(deadline) : null;

        await job.save();
        res.json({ message: "Job updated", job });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// DELETE /api/jobs/:id  — org only, anytime
export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.userId)
            return res.status(403).json({ message: "You can only delete your own job posts" });
        await Application.deleteMany({ job: job._id });
        await Job.deleteOne({ _id: job._id });
        // Also remove all applications for this job
        await Application.deleteMany({ jobId: job._id });
        res.json({ message: "Job deleted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

const jobObjectId = (id) => Application.db.base.Types.ObjectId.createFromHexString(id);

// POST /api/jobs/:id/apply  — student only
export const applyToJob = async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, status: "active" }).lean();
        if (!job) return res.status(404).json({ message: "Job not found" });

        if (!req.file) {
            return res.status(400).json({ message: "Please upload your CV as a PDF" });
        }

        if (String(job.postedBy) === req.user.userId) {
            return res.status(400).json({ message: "You cannot apply to your own job post" });
        }

        if (job.deadline && new Date(job.deadline).getTime() < Date.now()) {
            return res.status(400).json({ message: "This application deadline has passed" });
        }

        const existing = await Application.findOne({ job: job._id, student: req.user.userId }).lean();
        if (existing) {
            return res.status(409).json({ message: "You have already applied to this job" });
        }

        const application = await Application.create({
            job: job._id,
            student: req.user.userId,
            organization: job.postedBy,
            cvUrl: `/uploads/student-cvs/${req.file.filename}`,
            cvOriginalName: req.file.originalname,
        });

        res.status(201).json({
            message: "Application submitted successfully",
            application: buildApplicationSummary(application.toObject()),
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(409).json({ message: "You have already applied to this job" });
        }
        res.status(400).json({ message: e.message });
    }
};

// GET /api/jobs/applications/mine  — student only
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user.userId })
            .populate("job", "title company location type workMode deadline status")
            .populate("organization", "name organizationName")
            .sort({ createdAt: -1 })
            .lean();
        res.json({ total: applications.length, applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/jobs/applications/received  — organization only
export const getReceivedApplications = async (req, res) => {
    try {
        const applications = await Application.find({ organization: req.user.userId })
            .populate("student", "name email")
            .populate("job", "title company location type workMode deadline")
            .sort({ createdAt: -1 })
            .lean();

        const result = applications.map(buildApplicationSummary);
        res.json({ total: result.length, applications: result });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// PATCH /api/jobs/applications/:applicationId/status  — organization only
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!allowedApplicationStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid application status" });
        }

        const application = await Application.findOne({
            _id: req.params.applicationId,
            organization: req.user.userId,
        })
            .populate("student", "name email")
            .populate("job", "title company location type workMode deadline");

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        application.status = status;
        await application.save();

        res.json({
            message: "Application status updated",
            application: buildApplicationSummary(application.toObject()),
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/jobs/applications/:applicationId/download-cv  — organization only
export const downloadApplicationCv = async (req, res) => {
    try {
        const application = await Application.findOne({
            _id: req.params.applicationId,
            organization: req.user.userId,
        }).lean();
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const absolutePath = resolveUploadPath(application.cvUrl);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: "CV file not found" });
        }

        res.download(absolutePath, application.cvOriginalName);
// GET /api/jobs/:id/applicants  — org only, their own job
export const getJobApplicants = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.userId)
            return res.status(403).json({ message: "Not your job post" });

        const applications = await Application.find({ jobId: job._id })
            .populate("studentId", "name email")
            .sort({ appliedAt: -1 })
            .lean();

        res.json({ job: { _id: job._id, title: job.title, company: job.company }, total: applications.length, applications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/jobs/download-pdf  — org only, download PDF of their jobs
export const downloadJobsPDF = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        if (jobs.length === 0) {
            return res.status(404).json({ message: "No jobs found" });
        }

        // Create PDF document
        const doc = new PDFDocument();
        const filename = `jobs_${new Date().toISOString().split('T')[0]}.pdf`;

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('My Job Postings', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Add each job
        jobs.forEach((job, index) => {
            if (index > 0) doc.addPage();

            doc.fontSize(16).text(job.title, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Company: ${job.company}`);
            doc.text(`Location: ${job.location}`);
            doc.text(`Type: ${job.type} | Work Mode: ${job.workMode}`);
            if (job.duration) doc.text(`Duration: ${job.duration}`);
            const salary = salaryDisplay(job);
            if (salary) doc.text(`Salary: ${salary}`);
            if (job.deadline) doc.text(`Deadline: ${new Date(job.deadline).toLocaleDateString()}`);
            doc.text(`Posted: ${new Date(job.createdAt).toLocaleDateString()}`);
            doc.moveDown();

            doc.fontSize(14).text('Description:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).text(job.description);
            doc.moveDown();

            if (job.skills && job.skills.length > 0) {
                doc.fontSize(14).text('Required Skills:', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(10).list(job.skills);
                doc.moveDown();
            }

            if (job.requirements) {
                doc.fontSize(14).text('Requirements:', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(10).text(job.requirements);
                doc.moveDown();
            }
        });

        // Finalize PDF
        doc.end();
// PATCH /api/jobs/:id/applicants/:appId  — org only
export const updateApplicantStatus = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.postedBy.toString() !== req.user.userId)
            return res.status(403).json({ message: "Not your job post" });

        const { status } = req.body;
        if (!["Pending", "Accepted", "Rejected"].includes(status))
            return res.status(400).json({ message: "Invalid status. Use Pending, Accepted, or Rejected" });

        const app = await Application.findOneAndUpdate(
            { _id: req.params.appId, jobId: job._id },
            { status },
            { new: true }
        ).populate("studentId", "name email");

        if (!app) return res.status(404).json({ message: "Application not found" });
        res.json({ message: "Status updated", application: app });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
