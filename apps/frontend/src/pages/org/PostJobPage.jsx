import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
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
const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm";
const selCls = `${inp} cursor-pointer`;

function TimeRemaining({ editExpiresAt }) {
    const [remaining, setRemaining] = useState("");
    useEffect(() => {
        const update = () => {
            const ms = new Date(editExpiresAt).getTime() - Date.now();
            if (ms <= 0) { setRemaining(""); return; }
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            setRemaining(`${m}m ${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [editExpiresAt]);
    if (!remaining) return null;
    return <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">⏱ Edit: {remaining}</span>;
}

const emptyForm = {
    title: "", description: "", company: "",
    province: "", district: "",
    workMode: "Hybrid", type: "Internship", duration: "",
    salaryMin: "", salaryMax: "", salaryCurrency: "LKR", salaryPeriod: "month",
    skills: "", requirements: "", deadline: "",
};

const WORK_MODE_COLOR = {
    Remote: "bg-green-50 text-green-700 border-green-200",
    Hybrid: "bg-blue-50 text-blue-700 border-blue-200",
    "On-site": "bg-amber-50 text-amber-700 border-amber-200",
};
const TYPE_COLOR = {
    Internship: "bg-purple-50 text-purple-700 border-purple-200",
    "Part-time": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Full-time": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

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
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
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

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/jobs/mine");
            setJobs(res.data.jobs || []);
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to load jobs");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

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

            if (salaryMinNumber < 0) {
                throw new Error("Minimum salary must be 0 or greater.");
            }
            if (salaryMaxNumber < 0) {
                throw new Error("Maximum salary must be 0 or greater.");
            }
            if (salaryMaxNumber <= salaryMinNumber) {
                throw new Error("Maximum salary must be greater than minimum salary.");
            }

            if (form.deadline) {
                const selectedDate = new Date(form.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    throw new Error("Application deadline cannot be in the past.");
                }
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
            if (editingId) {
                await api.put(`/api/jobs/${editingId}`, payload);
                toast.success("Job updated successfully.");
            } else {
                await api.post("/api/jobs", payload);
                toast.success("Job posted! It will appear on the home page. You can edit within 2 minutes.");
            }
            setForm(emptyForm); setEditingId(null); setShowForm(false); setTouched({}); setSubmitAttempted(false); fetchJobs();
        } catch (e) { toast.error(e.response?.data?.message || e.message || "Failed to save job"); }
        finally { setFormLoading(false); }
    };

    const startEdit = (job) => {
        setForm({
            title: job.title, description: job.description || "", company: job.company,
            province: job.province || "", district: job.district || "",
            workMode: job.workMode, type: "Internship",
            duration: job.duration || "",
            salaryMin: job.salaryMin ?? "", salaryMax: job.salaryMax ?? "",
            salaryCurrency: job.salaryCurrency || "LKR", salaryPeriod: job.salaryPeriod || "month",
            skills: (job.skills || []).join(", "),
            requirements: job.requirements || "",
            deadline: job.deadline ? job.deadline.slice(0, 10) : "",
        });
        setEditingId(job._id); setShowForm(true); setTouched({}); setSubmitAttempted(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); setTouched({}); setSubmitAttempted(false); };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/jobs/${deleteId}`);
            setJobs((js) => js.filter((j) => j._id !== deleteId)); setDeleteId(null);
            toast.success("Job deleted successfully.");
        } catch (e) { toast.error(e.response?.data?.message || "Failed to delete"); }
        finally { setDeleting(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">Organisation</span>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">Job Postings</h1>
                        <p className="text-gray-500 mt-1 text-sm">Post internships to reach SLIIT students. Edit within 2 minutes of posting.</p>
                    </div>
                    {!showForm && (
                        <button onClick={() => { setShowForm(true); setForm(emptyForm); setEditingId(null); setTouched({}); setSubmitAttempted(false); }}
                            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm mt-1">
                            + Post a Job
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Post / Edit form */}
                {showForm && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Job Post" : "New Job Post"}</h2>
                            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: title + company */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duration</label>
                                    <input
                                        value={form.duration}
                                        onChange={set("duration")}
                                        onBlur={markTouched("duration")}
                                        className={`${inp} ${(showError("duration") && validationErrors.duration) ? "border-red-300 focus:ring-red-500" : ""}`}
                                        placeholder="e.g. 6 months"
                                    />
                                    {showError("duration") && validationErrors.duration && <p className="mt-1 text-xs text-red-600">{validationErrors.duration}</p>}
                                </div>
                            </div>

                            {/* Row 4: Salary range */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Salary Range</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Application Deadline</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().slice(0, 10)}
                                        value={form.deadline}
                                        onChange={set("deadline")}
                                        className={inp}
                                    />
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
                                <textarea required rows={4} value={form.description} onChange={set("description")} onBlur={markTouched("description")}
                                    className={`${inp} resize-none`} placeholder="Describe the role and responsibilities…" />
                                {showError("description") && validationErrors.description && <p className="mt-1 text-xs text-red-600">{validationErrors.description}</p>}
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Requirements <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                                <textarea rows={3} value={form.requirements} onChange={set("requirements")} onBlur={markTouched("requirements")}
                                    className={`${inp} resize-none`} placeholder="List any specific requirements, qualifications…" />
                                {(showError("requirements") || form.requirements.trim().length > 0) && validationErrors.requirements && <p className="mt-1 text-xs text-red-600">{validationErrors.requirements}</p>}
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                                <button type="button" onClick={cancelForm}
                                    className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={formLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm">
                                    {formLoading ? "Saving…" : editingId ? "Update Post" : "Post Job"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Job listings */}
                <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Your Postings ({jobs.length})</h2>
                    {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}
                    {!loading && jobs.length === 0 && (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <p className="text-4xl mb-3">📋</p>
                            <p className="text-sm text-gray-500">No jobs posted yet. Click "Post a Job" to get started.</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div key={job._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                                <div className="flex items-start gap-4 flex-wrap">
                                    <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 font-bold text-base flex items-center justify-center flex-shrink-0 border border-green-200">
                                        {job.company?.[0]?.toUpperCase() || "J"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLOR[job.type] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{job.type}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${WORK_MODE_COLOR[job.workMode] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{job.workMode}</span>
                                            {job.canEdit && <TimeRemaining editExpiresAt={job.editExpiresAt} />}
                                        </div>
                                        <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
                                        {job.salaryDisplay && <p className="text-xs text-emerald-700 font-medium mt-0.5">💰 {job.salaryDisplay}</p>}
                                        {job.deadline && <p className="text-xs text-gray-400 mt-0.5">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>}
                                        {job.skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {job.skills.map((s) => <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{s}</span>)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {job.canEdit ? (
                                            <button onClick={() => startEdit(job)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">Edit</button>
                                        ) : (
                                            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 rounded-xl bg-gray-100 cursor-not-allowed">Edit expired</span>
                                        )}
                                        <button onClick={() => setDeleteId(job._id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Delete confirm modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <div className="text-4xl mb-3">🗑️</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job Post?</h3>
                        <p className="text-sm text-gray-500 mb-6">This will remove the listing from the platform permanently.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                            <button disabled={deleting} onClick={handleDelete} className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
