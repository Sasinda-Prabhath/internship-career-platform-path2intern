import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getMySubmissions } from "../../services/moduleApi";

const MODULE_COLORS = {
    DS: { bg: "bg-violet-600", badge: "bg-violet-500/20 text-violet-400 border-violet-500/30", label: "Data Science" },
    SE: { bg: "bg-blue-600", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Software Engineering" },
    QA: { bg: "bg-green-600", badge: "bg-green-500/20 text-green-400 border-green-500/30", label: "Quality Assurance" },
    BA: { bg: "bg-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Business Analysis" },
    PM: { bg: "bg-pink-600", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30", label: "Project Management" },
};

const STATUS = {
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    declined: "bg-red-500/10   text-red-400   border-red-500/20",
};
const STATUS_LABELS = { approved: "Approved", pending: "Pending", declined: "Declined" };

export default function ModuleOperatorDashboard() {
    const { user } = useAuth();
    const operatorModules = (user?.moduleScopedRoles || []).filter((r) => r.role === "MODULE_OPERATOR");
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);

    useEffect(() => {
        getMySubmissions()
            .then((res) => setSubmissions(res.data.questions || []))
            .catch(() => setSubmissions([]))
            .finally(() => setLoadingSubmissions(false));
    }, []);

    const stats = {
        total: submissions.length,
        approved: submissions.filter((q) => q.status === "approved").length,
        pending: submissions.filter((q) => q.status === "pending").length,
        declined: submissions.filter((q) => q.status === "declined").length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                        Module Operator
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">
                        Welcome back, {user?.name?.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Submit MCQs and track your contributions to the module question banks.
                    </p>
                    {operatorModules.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {operatorModules.map((r) => {
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
                    {[
                        { label: "Submitted", value: loadingSubmissions ? "—" : stats.total, icon: "📝", accent: "text-indigo-400" },
                        { label: "Approved", value: loadingSubmissions ? "—" : stats.approved, icon: "✅", accent: "text-green-400" },
                        { label: "Pending", value: loadingSubmissions ? "—" : stats.pending, icon: "⏳", accent: "text-amber-400" },
                        { label: "Declined", value: loadingSubmissions ? "—" : stats.declined, icon: "❌", accent: "text-red-400" },
                    ].map(({ label, value, icon, accent }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
                                <span className="text-lg">{icon}</span>
                            </div>
                            <p className={`text-3xl font-bold ${accent}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <Link to="/module/submit-question"
                        className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-500/30 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                        <div className="text-2xl mt-0.5">➕</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">Submit a Question</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Add a new MCQ to your module's question bank. Reviewed by a Module Manager before going live.
                            </p>
                        </div>
                    </Link>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-700 transition-colors">
                        <div className="text-2xl mt-0.5">🗂️</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">My Module Assignments</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                You are a Module Operator for: {operatorModules.length > 0
                                    ? operatorModules.map((r) => MODULE_COLORS[r.module]?.label || r.module).join(", ")
                                    : "No modules assigned yet."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submissions table */}
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">My Submissions</h2>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {loadingSubmissions ? (
                        <div className="flex justify-center py-14">
                            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="text-slate-500 text-sm mb-2">No questions submitted yet.</p>
                            <Link to="/module/submit-question" className="inline-block mt-1 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">
                                Submit your first question →
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {submissions.map((q) => {
                                const sc = STATUS[q.status] || STATUS.pending;
                                const mc = MODULE_COLORS[q.module] || {};
                                return (
                                    <div key={q._id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-800/40 transition-colors">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0 mt-0.5 ${mc.bg || "bg-slate-700"}`}>
                                            {q.module}
                                        </span>
                                        <p className="text-sm text-slate-200 flex-1 leading-relaxed line-clamp-2">{q.questionText}</p>
                                        <div className="flex-shrink-0 text-right space-y-1 min-w-[90px]">
                                            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sc}`}>
                                                {STATUS_LABELS[q.status] || q.status}
                                            </span>
                                            {q.declineReason && (
                                                <p className="text-xs text-red-400 max-w-[160px]" title={q.declineReason}>
                                                    ↳ {q.declineReason.length > 40 ? q.declineReason.slice(0, 40) + "…" : q.declineReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
