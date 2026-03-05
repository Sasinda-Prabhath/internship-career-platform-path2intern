import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getPendingQuestions } from "../../services/moduleApi";

const MODULE_COLORS = {
    DS: { bg: "bg-violet-600", badge: "bg-violet-500/20 text-violet-400 border-violet-500/30", label: "Data Science" },
    SE: { bg: "bg-blue-600", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Software Engineering" },
    QA: { bg: "bg-green-600", badge: "bg-green-500/20 text-green-400 border-green-500/30", label: "Quality Assurance" },
    BA: { bg: "bg-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Business Analysis" },
    PM: { bg: "bg-pink-600", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30", label: "Project Management" },
};

const DarkActionCard = ({ to, icon, title, description, disabled, badge }) => (
    <Link
        to={disabled ? "#" : to}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-purple-500/30 hover:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
    >
        <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white">{title}</p>
                {badge > 0 && <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
    </Link>
);

const StatCard = ({ label, value, icon, accent }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
            <span className="text-lg">{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
);

export default function ModuleManagerDashboard() {
    const { user } = useAuth();
    const moduleScopedRoles = (user?.moduleScopedRoles || []).filter((r) => r.role === "MODULE_MANAGER");
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const results = await Promise.all(
                    moduleScopedRoles.map((r) => getPendingQuestions(r.module).then((res) => res.data.pending || 0))
                );
                setPendingCount(results.reduce((a, b) => a + b, 0));
            } catch { setPendingCount(0); }
        };
        if (moduleScopedRoles.length > 0) fetchAll();
    }, []); // eslint-disable-line

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-wider">
                        Module Manager
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Module Manager Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Manage operators, review MCQ submissions, and oversee content for your modules.
                    </p>
                    {/* Module pills */}
                    {moduleScopedRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {moduleScopedRoles.map((r) => {
                                const c = MODULE_COLORS[r.module] || {};
                                return (
                                    <span key={r.module} className={`text-xs font-semibold px-3 py-1 rounded-full border ${c.badge || "bg-slate-700 text-slate-300 border-slate-600"}`}>
                                        {c.label || r.module}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Questions" value="—" icon="❓" accent="text-purple-400" />
                    <StatCard label="Pending" value={pendingCount} icon="⏳" accent={pendingCount > 0 ? "text-amber-400" : "text-violet-400"} />
                    <StatCard label="Resources" value="—" icon="📚" accent="text-fuchsia-400" />
                    <StatCard label="Learners" value="—" icon="🎓" accent="text-pink-400" />
                </div>

                {/* Your modules */}
                {moduleScopedRoles.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Your Modules</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {moduleScopedRoles.map((r) => {
                                const c = MODULE_COLORS[r.module] || { bg: "bg-slate-700", badge: "bg-slate-700 text-slate-300 border-slate-600", label: r.module };
                                return (
                                    <div key={r.module} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
                                        <div className={`w-12 h-12 rounded-xl ${c.bg} text-white flex items-center justify-center font-bold text-base flex-shrink-0`}>
                                            {r.module}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{c.label}</p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>Module Manager</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DarkActionCard to="/module/review" icon="✅" title="Review Queue" description="Approve or decline pending MCQs submitted by operators." badge={pendingCount} />
                    <DarkActionCard to="/module/submit-question" icon="➕" title="Submit a Question" description="Add your own MCQ — published immediately without review." />
                    <DarkActionCard to="/module/assign-operator" icon="👥" title="Manage Operators" description="Assign or remove Module Operators for your modules." />
                    <DarkActionCard to="/module/question-bank" icon="🗄️" title="Question Bank" description="Browse all approved questions in the module bank." />
                    <DarkActionCard to="#" icon="📊" title="Module Analytics" description="View learner progress, quiz scores, and engagement." disabled />
                    <DarkActionCard to="#" icon="🏆" title="Leaderboard" description="See top-performing students ranked by scores." disabled />
                    <DarkActionCard to="/simulation" icon="🎯" title="Interview Simulation" description="Practice with AI-generated interview questions for your modules." />
                </div>
            </div>
        </div>
    );
}
