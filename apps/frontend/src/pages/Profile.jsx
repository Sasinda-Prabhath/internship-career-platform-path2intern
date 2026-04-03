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
        <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile card */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 card-lift">
                    {/* Cover with gradient */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-56 relative overflow-visible">
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%,rgba(68,68,68,.2))] bg-[length:40px_40px] animate-shimmer" />
                        <div className="absolute bottom-0 left-8 translate-y-1/2 animate-fadeInUp">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-4 border-white flex items-center justify-center text-4xl font-bold text-white shadow-xl hover:shadow-2xl transition-shadow">
                                {initials}
                            </div>
                        </div>
                    </div>

                    {/* Profile info section */}
                    <div className="pt-20 px-8 pb-8">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1 animate-fadeInUp">{user.name}</h1>
                                <p className="text-blue-600 font-medium text-sm mb-2 animate-fadeInUp" style={{ animationDelay: '100ms' }}>{user.email}</p>
                                {user.organizationName && <p className="text-gray-600 text-sm mb-3 animate-fadeInUp" style={{ animationDelay: '150ms' }}>🏢 {user.organizationName}</p>}
                                <div className="flex flex-wrap gap-2 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                                    <span className={`text-xs font-semibold px-4 py-1.5 rounded-full border shadow-sm transition-all ${badgeCls}`}>
                                        {ROLE_LABELS[user.globalRole] || user.globalRole}
                                    </span>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl px-6 py-2.5 shadow-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info cards grid */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Details */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 card-lift animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">📋</div>
                            <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
                        </div>
                        <dl className="space-y-4">
                            {[["Full Name", user.name], ["Email", user.email], ["Role", ROLE_LABELS[user.globalRole] || user.globalRole]].map(([label, val], i) => (
                                <div key={label} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0 animate-fadeInUp" style={{ animationDelay: `${350 + i * 50}ms` }}>
                                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{label}</dt>
                                    <dd className="text-sm font-medium text-gray-900">{val}</dd>
                                </div>
                            ))}
                            {user.moduleScopedRoles?.length > 0 && (
                                <div className="animate-fadeInUp" style={{ animationDelay: '450ms' }}>
                                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Module Roles</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {user.moduleScopedRoles.map((r) => (
                                            <span key={`${r.module}-${r.role}`} className="text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:shadow-sm transition-all">
                                                {r.module} • {r.role === "MODULE_MANAGER" ? "Manager" : "Operator"}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 card-lift animate-fadeInUp" style={{ animationDelay: '350ms' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center text-lg">⚡</div>
                            <h3 className="text-lg font-bold text-gray-900">Quick Links</h3>
                        </div>
                        <div className="space-y-2">
                            <Link to={dashRoute} className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-100/50 px-4 py-3 rounded-xl transition-all group">
                                <span className="text-lg group-hover:scale-110 transition-transform">📊</span>
                                <span>Go to Dashboard</span>
                                <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                            <Link to="/" className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-100/50 px-4 py-3 rounded-xl transition-all group">
                                <span className="text-lg group-hover:scale-110 transition-transform">🔍</span>
                                <span>Browse Internships</span>
                                <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-600">✨ <span className="font-medium">Pro tip:</span> Activity and tracking features coming soon!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
