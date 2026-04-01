import { useEffect, useState } from "react";
import { api } from "../../services/api";

const statusConfig = {
    submitted: {
        label: "Pending Review",
        badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        dot: "bg-yellow-400",
    },
    shortlisted: {
        label: "Shortlisted ⭐",
        badge: "bg-green-100 text-green-700 border border-green-200",
        dot: "bg-green-500",
    },
    rejected: {
        label: "Not Selected",
        badge: "bg-red-100 text-red-600 border border-red-200",
        dot: "bg-red-400",
    },
};

const typeLabel = (type) =>
    type === "internship" ? "Internship" : type === "part-time" ? "Part-time" : type === "full-time" ? "Full-time" : type || "–";

const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        api.get("/api/jobs/applications/mine")
            .then(({ data }) => setApplications(data.applications))
            .catch((err) => setError(err.response?.data?.message || "Failed to load applications"))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

    const counts = {
        all: applications.length,
        submitted: applications.filter((a) => a.status === "submitted").length,
        shortlisted: applications.filter((a) => a.status === "shortlisted").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <span className="bg-blue-500/20 text-blue-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider">
                        Student
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">My Applications</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Track the status of every internship you've applied for.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { key: "all",        label: "Total",       accent: "text-gray-800" },
                        { key: "submitted",  label: "Pending",     accent: "text-yellow-600" },
                        { key: "shortlisted",label: "Shortlisted", accent: "text-green-600" },
                        { key: "rejected",   label: "Not Selected",accent: "text-red-500" },
                    ].map(({ key, label, accent }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`bg-white border rounded-2xl p-4 text-left transition-all ${
                                filter === key ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                            <p className={`text-3xl font-bold ${accent}`}>{counts[key]}</p>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-gray-700 font-semibold text-lg">No applications yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filter === "all"
                                ? "Browse internships and click 'View & Apply' to get started."
                                : `No applications with status "${filter}".`}
                        </p>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="space-y-4">
                        {filtered.map((app) => {
                            const cfg = statusConfig[app.status] || statusConfig.submitted;
                            const org = app.organization;
                            const job = app.job;
                            return (
                                <div
                                    key={app._id}
                                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        {/* Left: job info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                                {job?.type && (
                                                    <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                                        {typeLabel(job.type)}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 truncate">
                                                {job?.title || "Job no longer available"}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {job?.company || org?.organizationName || org?.name || "—"}
                                                {job?.location ? ` · ${job.location}` : ""}
                                                {job?.workMode ? ` · ${job.workMode}` : ""}
                                            </p>
                                        </div>

                                        {/* Right: dates */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-gray-400">Applied</p>
                                            <p className="text-sm font-semibold text-gray-700">{fmtDate(app.createdAt)}</p>
                                            {app.updatedAt !== app.createdAt && app.status !== "submitted" && (
                                                <>
                                                    <p className="text-xs text-gray-400 mt-1">Status updated</p>
                                                    <p className="text-xs text-gray-500">{fmtDate(app.updatedAt)}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status message */}
                                    {app.status === "shortlisted" && (
                                        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                                            🎉 You've been shortlisted! The recruiter may contact you soon.
                                        </div>
                                    )}
                                    {app.status === "rejected" && (
                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                                            This application was not successful. Keep applying — the right opportunity is out there!
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
