import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

/* ── Stat card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${accent.bg}`}>
                {icon}
            </div>
            <span className={`text-2xl font-bold ${accent.text}`}>{value}</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
);

/* ── Job row in recent listings ────────────────────────────────────────── */
const JobRow = ({ job }) => {
    const age = Date.now() - new Date(job.createdAt).getTime();
    const canEdit = age < 10 * 60 * 1000;
    const WORK_COLORS = {
        Remote: "bg-green-100 text-green-700",
        Hybrid: "bg-blue-100 text-blue-700",
        "On-site": "bg-amber-100 text-amber-700",
    };
    return (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {job.company?.[0]?.toUpperCase() || "J"}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                <p className="text-xs text-gray-400">{job.location} · {job.type}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORK_COLORS[job.workMode] || "bg-gray-100 text-gray-600"}`}>
                    {job.workMode}
                </span>
                {canEdit && (
                    <Link to="/org/post-job" className="text-xs text-blue-600 hover:underline font-medium">Edit</Link>
                )}
            </div>
        </div>
    );
};

/* ── Action card ────────────────────────────────────────────────────────── */
const OrgActionCard = ({ to, icon, title, description, accent = "blue", disabled }) => {
    const colors = {
        green: { border: "hover:border-green-300", icon: "bg-green-50 text-green-600", badge: "bg-green-100 text-green-700" },
        blue: { border: "hover:border-blue-300", icon: "bg-blue-50 text-blue-600", badge: "bg-blue-100 text-blue-700" },
        amber: { border: "hover:border-amber-300", icon: "bg-amber-50 text-amber-600", badge: "bg-amber-100 text-amber-700" },
        purple: { border: "hover:border-purple-300", icon: "bg-purple-50 text-purple-600", badge: "bg-purple-100 text-purple-700" },
    };
    const c = colors[accent] || colors.blue;

    const commonClass = `bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 ${disabled ? "opacity-40 cursor-not-allowed" : `${c.border} hover:-translate-y-0.5 hover:shadow-md cursor-pointer`
        }`;

    const content = (
        <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${c.icon}`}>{icon}</div>
            <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                {disabled && <span className="inline-block mt-1 text-xs text-gray-400">Coming soon</span>}
            </div>
        </>
    );

    if (disabled) return <div className={commonClass}>{content}</div>;
    return <Link to={to} className={commonClass}>{content}</Link>;
};

/* ── Main dashboard ─────────────────────────────────────────────────────── */
export default function OrgDashboard() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await api.get("/api/jobs/mine");
            setJobs(res.data.jobs || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const activeJobs = jobs.filter(j => j.status === "active");

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Page header ────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                            Organisation
                        </span>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">
                            {user?.organizationName || user?.name || "Organisation"} Dashboard
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Post internships, manage your listings, and connect with SLIIT talent.
                        </p>
                    </div>
                    <Link to="/org/post-job"
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm flex-shrink-0 mt-1 flex items-center gap-2">
                        <span className="text-base">+</span> Post a Job
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* ── Stats ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Active Listings"
                        value={loading ? "—" : activeJobs.length}
                        icon="📋"
                        accent={{ bg: "bg-green-50", text: "text-green-600" }}
                        sub="Live on platform"
                    />
                    <StatCard
                        label="Total Posted"
                        value={loading ? "—" : jobs.length}
                        icon="📤"
                        accent={{ bg: "bg-blue-50", text: "text-blue-600" }}
                        sub="Since account created"
                    />
                    <StatCard
                        label="Applications"
                        value="—"
                        icon="📝"
                        accent={{ bg: "bg-amber-50", text: "text-amber-600" }}
                        sub="Coming soon"
                    />
                    <StatCard
                        label="Shortlisted"
                        value="—"
                        icon="⭐"
                        accent={{ bg: "bg-purple-50", text: "text-purple-600" }}
                        sub="Coming soon"
                    />
                </div>

                {/* ── Content grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick actions */}
                    <div className="lg:col-span-2 space-y-5">
                        <div>
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <OrgActionCard
                                    to="/org/post-job"
                                    icon="➕"
                                    title="Post an Internship"
                                    description="Create a new listing for SLIIT students to discover."
                                    accent="green"
                                />
                                <OrgActionCard
                                    to="/org/post-job"
                                    icon="📋"
                                    title="Manage Listings"
                                    description="View, edit (within 10 min), or delete your job posts."
                                    accent="blue"
                                />
                                <OrgActionCard
                                    to="#"
                                    icon="👥"
                                    title="Review Applications"
                                    description="See all student applications for your listings."
                                    accent="amber"
                                    disabled
                                />
                                <OrgActionCard
                                    to="#"
                                    icon="✅"
                                    title="Shortlist Candidates"
                                    description="Mark promising applicants and update their status."
                                    accent="purple"
                                    disabled
                                />
                            </div>
                        </div>

                        {/* Tips card */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-green-800 mb-2">📌 Tips for Better Visibility</h3>
                            <ul className="text-xs text-green-700 space-y-1.5 leading-relaxed">
                                <li>• Add detailed job descriptions to attract the right candidates</li>
                                <li>• Include required skills so students can self-filter</li>
                                <li>• Set a realistic salary range — it significantly increases applications</li>
                                <li>• You can edit a post within 10 minutes of publishing</li>
                            </ul>
                        </div>
                    </div>

                    {/* Recent listings panel */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Your Listings</h3>
                            <Link to="/org/post-job" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
                        </div>

                        {loading && (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse flex gap-3 py-3 border-b border-gray-100 last:border-0">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && jobs.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-sm text-gray-400 mb-3">No listings yet</p>
                                <Link to="/org/post-job"
                                    className="inline-flex text-xs font-medium bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
                                    Post First Job
                                </Link>
                            </div>
                        )}

                        {!loading && jobs.length > 0 && (
                            <div>
                                {jobs.slice(0, 5).map(job => <JobRow key={job._id} job={job} />)}
                                {jobs.length > 5 && (
                                    <Link to="/org/post-job" className="block text-center text-xs text-blue-600 hover:underline mt-3 font-medium">
                                        +{jobs.length - 5} more listings →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
