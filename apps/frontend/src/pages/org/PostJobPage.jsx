import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const EDIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const JOB_TYPES = ["Internship"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const CURRENCIES = ["LKR", "USD", "EUR"];
const PERIODS = ["month", "year"];

// Sri Lanka provinces and their districts
const SL_PROVINCES = {
  "Western Province": ["Colombo", "Gampaha", "Kalutara"],
  "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern Province": ["Galle", "Matara", "Hambantota"],
  "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern Province": ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western Province": ["Kurunegala", "Puttalam"],
  "North Central Province": ["Anuradhapura", "Polonnaruwa"],
  "Uva Province": ["Badulla", "Monaragala"],
  "Sabaragamuwa Province": ["Ratnapura", "Kegalle"],
};

// Shared input style — white theme
const inp =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm";
const selCls = `${inp} cursor-pointer`;

function TimeRemaining({ editExpiresAt }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!editExpiresAt) return;

    const update = () => {
      const ms = new Date(editExpiresAt).getTime() - Date.now();
      if (Number.isNaN(ms) || ms <= 0) {
        setRemaining("");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [editExpiresAt]);

  if (!remaining) return null;

  return (
    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
      ⏱ Edit: {remaining}
    </span>
  );
}

const buildEmptyForm = (orgName = "") => ({
  title: "",
  description: "",
  company: orgName,
  province: "",
  district: "",
  workMode: "Hybrid",
  type: "Internship",
  duration: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "LKR",
  salaryPeriod: "month",
  skills: "",
  requirements: "",
  deadline: "",
});

const alphaSpaceRegex = /^[A-Za-z\s]+$/;
const companyNameRegex = /^[A-Za-z][A-Za-z0-9\s&'.,()-]*$/;

function validateForm(form) {
    const errors = {};
    const title = form.title.trim();
    const company = form.company.trim();
    const description = form.description.trim();
    const requirements = form.requirements.trim();
    const skillsRaw = form.skills.trim();
    const minRaw = String(form.salaryMin).trim();
    const maxRaw = String(form.salaryMax).trim();

    if (!title) {
        errors.title = "Job title is required.";
    } else if (!alphaSpaceRegex.test(title)) {
        errors.title = "Job title must contain only letters.";
    } else if (title.length < 2) {
        errors.title = "Job title must be at least 2 characters.";
    } else if (title.length > 30) {
        errors.title = "Job title must be at most 30 characters.";
    }

    if (!company) {
        errors.company = "Company is required.";
    } else if (!companyNameRegex.test(company)) {
        errors.company = "Company name must start with a letter and cannot be only numbers.";
    } else if (company.length < 2) {
        errors.company = "Company must be at least 2 characters.";
    } else if (company.length > 30) {
        errors.company = "Company must be at most 30 characters.";
    }

    if (!minRaw) {
        errors.salaryMin = "Minimum salary is required.";
    } else {
        const minNum = Number(minRaw);
        if (Number.isNaN(minNum)) {
            errors.salaryMin = "Minimum salary must be a valid number.";
        } else if (minNum < 0) {
            errors.salaryMin = "Minimum salary must be 0 or greater.";
        }
    }

    if (!maxRaw) {
        errors.salaryMax = "Maximum salary is required.";
    } else {
        const maxNum = Number(maxRaw);
        if (Number.isNaN(maxNum)) {
            errors.salaryMax = "Maximum salary must be a valid number.";
        } else if (maxNum < 0) {
            errors.salaryMax = "Maximum salary must be 0 or greater.";
        }
    }

    if (!errors.salaryMin && !errors.salaryMax) {
        const minNum = Number(minRaw);
        const maxNum = Number(maxRaw);
        if (maxNum <= minNum) {
            errors.salaryMax = "Maximum salary must be greater than minimum salary.";
        }
    }

    if (!description) {
        errors.description = "Job description is required.";
    } else if (description.length < 20) {
        errors.description = "Job description must be at least 20 characters.";
    } else if (description.length > 1000) {
        errors.description = "Job description must be at most 1000 characters.";
    }

    if (requirements) {
        if (requirements.length < 20) {
            errors.requirements = "Requirements must be at least 20 characters when provided.";
        } else if (requirements.length > 500) {
            errors.requirements = "Requirements must be at most 500 characters.";
        }
    }

    if (skillsRaw) {
        const skillParts = form.skills.split(",");
        if (skillParts.some((s) => s.trim().length === 0)) {
            errors.skills = "Skills must be comma-separated without empty values.";
        }
    }

    const durationRaw = String(form.duration || "").trim();
    if (!durationRaw) {
        errors.duration = "Duration is required.";
    } else if (durationRaw.startsWith("-")) {
        errors.duration = "Duration cannot be a negative value.";
    } else {
        const durationMatch = durationRaw.match(/^(\d+)\s*months?$/i);
        if (!durationMatch) {
            errors.duration = "Duration must start with a number and include month(s), e.g. 6 months.";
        } else {
            const months = Number(durationMatch[1]);
            if (months < 3 || months > 12) {
                errors.duration = "Duration must be greater than or equal to 3 months and less than or equal to 12 months.";
            }
        }
    }

    if (form.type !== "Internship") {
        errors.type = "Job type must be Internship.";
    }

    return errors;
}

export default function PostJobPage() {
    const { user } = useAuth();
    const { jobId } = useParams();
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState(buildEmptyForm(user?.organizationName || ""));
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const markTouched = (k) => () => setTouched((prev) => ({ ...prev, [k]: true }));
    const districts = form.province ? SL_PROVINCES[form.province] || [] : [];
    const validationErrors = useMemo(() => validateForm(form), [form]);
    const showError = (field) => {
        if (submitAttempted || touched[field]) return true;
        const val = form[field];
        return typeof val === "string" ? val.trim().length > 0 : false;
    };

    useEffect(() => {
        if (jobId) {
            const loadJob = async () => {
                try {
                    const res = await api.get(`/api/jobs/${jobId}`);
                    const job = res.data.job || res.data; // Accommodate backend variations
                    setForm({
                        title: job.title ?? "",
                        description: job.description ?? "",
                        company: job.company ?? user?.organizationName ?? "",
                        province: job.province || "",
                        district: job.district || "",
                        workMode: job.workMode || "Hybrid",
                        type: job.type || "Internship",
                        duration: job.duration || "",
                        salaryMin: job.salaryMin ?? "",
                        salaryMax: job.salaryMax ?? "",
                        salaryCurrency: job.salaryCurrency || "LKR",
                        salaryPeriod: job.salaryPeriod || "month",
                        skills: Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills ?? ""),
                        requirements: job.requirements || "",
                        deadline: job.deadline ? job.deadline.slice(0, 10) : "",
                    });
                } catch (e) {
                    toast.error("Failed to load job details.");
                }
            };
            loadJob();
        }
    }, [jobId, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitAttempted(true);
        setFormLoading(true);
        try {
            const errors = validateForm(form);
            if (Object.keys(errors).length > 0) {
                throw new Error("Please fix validation errors before submitting.");
            }

            const salaryMinNumber = Number(form.salaryMin);
            const salaryMaxNumber = Number(form.salaryMax);

            if (salaryMinNumber < 0) throw new Error("Minimum salary must be 0 or greater.");
            if (salaryMaxNumber < 0) throw new Error("Maximum salary must be 0 or greater.");
            if (salaryMaxNumber <= salaryMinNumber) throw new Error("Maximum salary must be greater than minimum salary.");

            if (form.deadline) {
                const selectedDate = new Date(form.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) throw new Error("Application deadline cannot be in the past.");
            }

            const payload = {
                ...form,
                title: form.title.trim(),
                company: form.company.trim(),
                description: form.description.trim(),
                requirements: form.requirements.trim(),
                skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
                type: "Internship",
                deadline: form.deadline || null,
                salaryMin: salaryMinNumber,
                salaryMax: salaryMaxNumber,
            };

            if (jobId) {
                await api.put(`/api/jobs/${jobId}`, payload);
                toast.success("Job updated successfully.");
            } else {
                await api.post("/api/jobs", payload);
                toast.success("Job posted! You can edit within 2 minutes.");
                setForm(buildEmptyForm(user?.organizationName || ""));
                setTouched({});
                setSubmitAttempted(false);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || "Failed to save job");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <div className="bg-white border-b border-gray-200 px-8 py-8 mb-8">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">Organisation</span>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">{jobId ? "Edit Job Post" : "Post a New Job"}</h1>
                        <p className="text-gray-500 mt-1 text-sm">Post internships to reach SLIIT students. Fill out the details below.</p>
                    </div>
                    <Link to="/org/job-listings" className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm mt-1">
                        ← Back to Listings
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1: title + company */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Job Title *</label>
                                <input required value={form.title} onChange={set("title")} onBlur={markTouched("title")} className={inp} placeholder="e.g. Software Engineering Intern" />
                                {showError("title") && validationErrors.title && <p className="mt-1 text-xs text-red-600">{validationErrors.title}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Company *</label>
                                <input required value={form.company} onChange={set("company")} onBlur={markTouched("company")} className={inp} placeholder="Your company name" />
                                {showError("company") && validationErrors.company && <p className="mt-1 text-xs text-red-600">{validationErrors.company}</p>}
                            </div>
                        </div>

                        {/* Row 2: Province + District */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Province *</label>
                                <select required value={form.province} onChange={(e) => { setForm(f => ({ ...f, province: e.target.value, district: "" })); }} className={selCls}>
                                    <option value="">Select Province</option>
                                    {Object.keys(SL_PROVINCES).map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">District *</label>
                                <select required value={form.district} onChange={set("district")} className={selCls} disabled={!form.province}>
                                    <option value="">{form.province ? "Select District" : "Select Province first"}</option>
                                    {districts.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Work Mode + Job Type + Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Work Mode</label>
                                <select value={form.workMode} onChange={set("workMode")} className={selCls}>
                                    {WORK_MODES.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Job Type</label>
                                <select value={form.type} onChange={set("type")} className={selCls}>
                                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                                {showError("type") && validationErrors.type && <p className="mt-1 text-xs text-red-600">{validationErrors.type}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duration</label>
                                <input value={form.duration} onChange={set("duration")} onBlur={markTouched("duration")} className={`${inp} ${(showError("duration") && validationErrors.duration) ? "border-red-300 focus:ring-red-500" : ""}`} placeholder="e.g. 6 months" />
                                {showError("duration") && validationErrors.duration && <p className="mt-1 text-xs text-red-600">{validationErrors.duration}</p>}
                            </div>
                        </div>

                        {/* Row 4: Salary range */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Salary Range</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Min</label>
                                    <input required type="number" min="0" value={form.salaryMin} onChange={set("salaryMin")} onBlur={markTouched("salaryMin")} className={inp} placeholder="25000" />
                                    {showError("salaryMin") && validationErrors.salaryMin && <p className="mt-1 text-xs text-red-600">{validationErrors.salaryMin}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Max</label>
                                    <input required type="number" min="0" value={form.salaryMax} onChange={set("salaryMax")} onBlur={markTouched("salaryMax")} className={inp} placeholder="50000" />
                                    {(showError("salaryMax") || showError("salaryMin")) && validationErrors.salaryMax && <p className="mt-1 text-xs text-red-600">{validationErrors.salaryMax}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Currency</label>
                                    <select value={form.salaryCurrency} onChange={set("salaryCurrency")} className={selCls}>
                                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Per</label>
                                    <select value={form.salaryPeriod} onChange={set("salaryPeriod")} className={selCls}>
                                        {PERIODS.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Application deadline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Application Deadline</label>
                                <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.deadline} onChange={set("deadline")} className={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Skills (comma-separated)</label>
                                <input value={form.skills} onChange={set("skills")} onBlur={markTouched("skills")} className={inp} placeholder="React, Node.js, MongoDB" />
                                {showError("skills") && validationErrors.skills && <p className="mt-1 text-xs text-red-600">{validationErrors.skills}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Job Description *</label>
                            <textarea required rows={5} value={form.description} onChange={set("description")} onBlur={markTouched("description")} className={`${inp} resize-none`} placeholder="Describe the role and responsibilities…" />
                            {showError("description") && validationErrors.description && <p className="mt-1 text-xs text-red-600">{validationErrors.description}</p>}
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Requirements <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                            <textarea rows={4} value={form.requirements} onChange={set("requirements")} onBlur={markTouched("requirements")} className={`${inp} resize-none`} placeholder="List any specific requirements, qualifications…" />
                            {(showError("requirements") || form.requirements.trim().length > 0) && validationErrors.requirements && <p className="mt-1 text-xs text-red-600">{validationErrors.requirements}</p>}
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                            <Link to="/org/job-listings" className="border border-gray-300 text-gray-600 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</Link>
                            <button type="submit" disabled={formLoading} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-colors shadow-sm">
                                {formLoading ? "Saving…" : jobId ? "Update Post" : "Post Job"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}