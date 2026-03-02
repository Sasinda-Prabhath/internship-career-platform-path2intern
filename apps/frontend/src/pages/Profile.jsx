import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { getDashboardRoute } from "../utils/roleUtils";

const ROLE_LABELS = {
    STUDENT: "Student",
    STAFF: "Staff",
    UNIVERSITY_ADMIN: "University Admin",
    SYSTEM_ADMIN: "System Admin",
    ORGANIZATION: "Organisation",
};

const ROLE_BADGE = {
    STUDENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    STAFF: "bg-slate-700 text-slate-300 border-slate-600",
    UNIVERSITY_ADMIN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    SYSTEM_ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
    ORGANIZATION: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Profile() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) navigate("/login");
    }, [user, loading, navigate]);

    const handleLogout = async () => { await logout(); navigate("/login"); };
    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>;
    if (!user) return null;

    const dashRoute = getDashboardRoute(user.globalRole, user.moduleScopedRoles);
    const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    const badgeCls = ROLE_BADGE[user.globalRole] || "bg-slate-700 text-slate-300 border-slate-600";

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Profile card */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Cover */}
                    <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 h-28 relative">
                        <div className="absolute bottom-0 left-8 translate-y-1/2">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-slate-900 flex items-center justify-center text-2xl font-bold text-gray-900 shadow-xl">
                                {initials}
                            </div>
                        </div>
                    </div>
                    <div className="pt-14 px-8 pb-8">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                <p className="text-slate-400 text-sm">{user.email}</p>
                                {user.organizationName && <p className="text-slate-400 text-sm mt-0.5">🏢 {user.organizationName}</p>}
                                <span className={`mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-full border ${badgeCls}`}>
                                    {ROLE_LABELS[user.globalRole] || user.globalRole}
                                </span>
                            </div>
                            <button onClick={handleLogout} className="text-sm text-red-400 border border-red-500/30 rounded-xl px-4 py-2 hover:bg-red-500/10 transition-colors">
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Account Details</h3>
                        <dl className="space-y-3">
                            {[["Full Name", user.name], ["Email", user.email], ["Role", ROLE_LABELS[user.globalRole] || user.globalRole]].map(([label, val]) => (
                                <div key={label}>
                                    <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
                                    <dd className="text-sm font-medium text-white">{val}</dd>
                                </div>
                            ))}
                            {user.moduleScopedRoles?.length > 0 && (
                                <div>
                                    <dt className="text-xs text-slate-500 mb-1">Module Roles</dt>
                                    <dd className="flex flex-wrap gap-1.5">
                                        {user.moduleScopedRoles.map((r) => (
                                            <span key={`${r.module}-${r.role}`} className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                                {r.module} · {r.role === "MODULE_MANAGER" ? "Manager" : "Operator"}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <Link to={dashRoute} className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2.5 rounded-xl transition-colors group">
                                <span>📊</span> Go to Dashboard
                                <svg className="w-3 h-3 ml-auto text-slate-600 group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                            <Link to="/" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2.5 rounded-xl transition-colors group">
                                <span>🔍</span> Browse Internships
                                <svg className="w-3 h-3 ml-auto text-slate-600 group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                        <p className="text-xs text-slate-600 mt-4">Application tracking and activity will appear here soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
