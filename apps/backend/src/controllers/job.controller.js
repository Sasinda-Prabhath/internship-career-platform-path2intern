import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
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
        const now = Date.now();
        const annotated = jobs.map((j) => ({
            ...j,
            salaryDisplay: salaryDisplay(j),
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
        await Job.deleteOne({ _id: job._id });
        // Also remove all applications for this job
        await Application.deleteMany({ jobId: job._id });
        res.json({ message: "Job deleted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

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
