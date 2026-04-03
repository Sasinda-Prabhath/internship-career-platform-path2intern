import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../services/api";

const STATUS_STYLES = {
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Accepted: "bg-green-50 text-green-700 border border-green-200",
    Rejected: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_OPTIONS = ["Pending", "Accepted", "Rejected"];

function ApplicantRow({ app, onStatusChange }) {
    const [updating, setUpdating] = useState(false);

    const handleChange = async (e) => {
        const newStatus = e.target.value;
        setUpdating(true);
        try {
            await onStatusChange(app._id, newStatus);
        } finally {
            setUpdating(false);
        }
    };

    const student = app.studentId || {};
    const appliedDate = new Date(app.appliedAt || app.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="flex items-start gap-4 flex-wrap">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center flex-shrink-0 border border-blue-200 uppercase">
                    {student.name?.[0] || "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{student.name || "Unknown Student"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{student.email || "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Applied {appliedDate}</p>
                    {app.coverLetter && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 leading-relaxed line-clamp-2">
                            {app.coverLetter}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* CV Download */}
                    {app.cvUrl ? (
                        <a
                            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${app.cvUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                            📄 Download CV
                        </a>
                    ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">No CV</span>
                    )}

                    {/* Status badge + select */}
                    <div className="relative">
                        <span className={`absolute inset-0 rounded-xl pointer-events-none text-xs font-semibold flex items-center px-3 ${STATUS_STYLES[app.status]}`}>
                            {app.status}
                        </span>
                        <select
                            value={app.status}
                            onChange={handleChange}
                            disabled={updating}
                            className="relative opacity-0 text-xs font-semibold pl-3 pr-7 py-1.5 rounded-xl border-0 cursor-pointer disabled:cursor-wait w-28 h-8"
                            aria-label="Update application status"
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {updating && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⏳</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ManageApplicantsPage() {
    const { jobId } = useParams();
    const [data, setData] = useState(null);   // { job, applications }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const fetchApplicants = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get(`/api/jobs/${jobId}/applicants`);
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load applicants");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

    const handleStatusChange = async (appId, newStatus) => {
        await api.patch(`/api/jobs/${jobId}/applicants/${appId}`, { status: newStatus });
        setData(prev => ({
            ...prev,
            applications: prev.applications.map(a =>
                a._id === appId ? { ...a, status: newStatus } : a
            ),
        }));
    };

    const displayed = data?.applications?.filter(a =>
        filterStatus === "All" ? true : a.status === filterStatus
    ) ?? [];

    const counts = data?.applications?.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {}) ?? {};

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <Link
                        to="/org/post-job"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-4 transition-colors"
                    >
                        ← Back to My Postings
                    </Link>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                        Organisation
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">
                        {loading ? "Loading…" : data?.job?.title || "Manage Applicants"}
                    </h1>
                    {data?.job && (
                        <p className="text-gray-500 mt-1 text-sm">{data.job.company} · {data.total} applicant{data.total !== 1 ? "s" : ""}</p>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
                )}

                {/* Status summary cards */}
                {!loading && data && (
                    <div className="grid grid-cols-3 gap-4">
                        {["Pending", "Accepted", "Rejected"].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(prev => prev === s ? "All" : s)}
                                className={`rounded-2xl p-4 border text-left transition-all hover:shadow-sm ${filterStatus === s
                                        ? s === "Pending" ? "border-amber-300 bg-amber-50"
                                            : s === "Accepted" ? "border-green-300 bg-green-50"
                                                : "border-red-300 bg-red-50"
                                        : "border-gray-200 bg-white"
                                    }`}
                            >
                                <p className="text-2xl font-bold text-gray-900">{counts[s] || 0}</p>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{s}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Filter label */}
                {filterStatus !== "All" && (
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[filterStatus]}`}>Showing: {filterStatus}</span>
                        <button onClick={() => setFilterStatus("All")} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Clear filter ✕</button>
                    </div>
                )}

                {/* Applicant list */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                                <div className="flex gap-4 items-start">
                                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                        <div className="h-2 bg-gray-100 rounded w-1/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && displayed.length === 0 && (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-sm text-gray-400">
                            {filterStatus === "All" ? "No applications yet for this posting." : `No ${filterStatus} applications.`}
                        </p>
                    </div>
                )}

                {!loading && displayed.length > 0 && (
                    <div className="space-y-3">
                        {displayed.map(app => (
                            <ApplicantRow
                                key={app._id}
                                app={app}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
