import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const EDIT_WINDOW_MS = 10 * 60 * 1000;

const JOB_TYPES = ["Internship", "Part-time", "Full-time"];
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

export default function PostJobPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const districts = form.province ? SL_PROVINCES[form.province] || [] : [];

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/jobs/mine");
            setJobs(res.data.jobs || []);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load jobs");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(""); setSuccess(""); setFormLoading(true);
        try {
            const payload = {
                ...form,
                skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
                deadline: form.deadline || null,
                salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
                salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
            };
            if (editingId) {
                await api.put(`/api/jobs/${editingId}`, payload);
                setSuccess("Job updated successfully.");
            } else {
                await api.post("/api/jobs", payload);
                setSuccess("Job posted! It will appear on the home page. You can edit within 10 minutes.");
            }
            setForm(emptyForm); setEditingId(null); setShowForm(false); fetchJobs();
        } catch (e) { setError(e.response?.data?.message || "Failed to save job"); }
        finally { setFormLoading(false); }
    };

    const startEdit = (job) => {
        setForm({
            title: job.title, description: job.description || "", company: job.company,
            province: job.province || "", district: job.district || "",
            workMode: job.workMode, type: job.type,
            duration: job.duration || "",
            salaryMin: job.salaryMin ?? "", salaryMax: job.salaryMax ?? "",
            salaryCurrency: job.salaryCurrency || "LKR", salaryPeriod: job.salaryPeriod || "month",
            skills: (job.skills || []).join(", "),
            requirements: job.requirements || "",
            deadline: job.deadline ? job.deadline.slice(0, 10) : "",
        });
        setEditingId(job._id); setError(""); setSuccess(""); setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); setError(""); };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/jobs/${deleteId}`);
            setJobs((js) => js.filter((j) => j._id !== deleteId)); setDeleteId(null);
        } catch (e) { alert(e.response?.data?.message || "Failed to delete"); }
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
                        <p className="text-gray-500 mt-1 text-sm">Post internships to reach SLIIT students. Edit within 10 minutes of posting.</p>
                    </div>
                    {!showForm && (
                        <button onClick={() => { setShowForm(true); setForm(emptyForm); setEditingId(null); }}
                            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm mt-1">
                            + Post a Job
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Alerts */}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">{success}</div>}

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
                                    <input required value={form.title} onChange={set("title")} className={inp} placeholder="e.g. Software Engineering Intern" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Company *</label>
                                    <input required value={form.company} onChange={set("company")} className={inp} placeholder="Your company name" />
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
                                    <input value={form.duration} onChange={set("duration")} className={inp} placeholder="e.g. 3 months" />
                                </div>
                            </div>

                            {/* Row 4: Salary range */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Salary Range</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Min</label>
                                        <input type="number" min="0" value={form.salaryMin} onChange={set("salaryMin")} className={inp} placeholder="25000" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Max</label>
                                        <input type="number" min="0" value={form.salaryMax} onChange={set("salaryMax")} className={inp} placeholder="50000" />
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
                                    <input type="date" value={form.deadline} onChange={set("deadline")} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Skills (comma-separated)</label>
                                    <input value={form.skills} onChange={set("skills")} className={inp} placeholder="React, Node.js, MongoDB" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Job Description *</label>
                                <textarea required rows={4} value={form.description} onChange={set("description")}
                                    className={`${inp} resize-none`} placeholder="Describe the role and responsibilities…" />
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Requirements <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                                <textarea rows={3} value={form.requirements} onChange={set("requirements")}
                                    className={`${inp} resize-none`} placeholder="List any specific requirements, qualifications…" />
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
