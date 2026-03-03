import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const EDIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const TYPE_COLOR = {
    Internship: "bg-purple-100 text-purple-700 border-purple-200",
    "Part-time": "bg-cyan-100 text-cyan-700 border-cyan-200",
    "Full-time": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const WORK_MODE_COLOR = {
    Remote: "bg-green-100 text-green-700 border-green-200",
    Hybrid: "bg-blue-100 text-blue-700 border-blue-200",
    "On-site": "bg-amber-100 text-amber-700 border-amber-200",
};

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

export default function JobListingsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await api.get("/api/jobs/my-jobs");
            setJobs(res.data);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            await api.delete(`/api/jobs/${deleteId}`);
            setJobs(jobs.filter(j => j._id !== deleteId));
            setDeleteId(null);
        } catch (e) {
            alert(e.response?.data?.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">Organisation</span>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2">My Job Listings</h1>
                            <p className="text-gray-500 mt-1 text-sm">Manage your posted job listings.</p>
                        </div>
                        <Link
                            to="/org/post-job"
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
                        >
                            + Post New Job
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Alerts */}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

                {/* Job listings */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">Your Job Postings</h2>
                    </div>
                    {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}
                    {!loading && jobs.length === 0 && (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                            <p className="text-4xl mb-3">📋</p>
                            <p className="text-sm text-gray-500">No jobs posted yet. <Link to="/org/post-job" className="text-blue-600 hover:underline">Post your first job</Link>.</p>
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
                                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                                        <Link
                                            to={`/org/applicants/${job._id}`}
                                            className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
                                        >
                                            👥 Applicants
                                        </Link>
                                        {job.canEdit ? (
                                            <Link to={`/org/edit-job/${job._id}`} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">Edit</Link>
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