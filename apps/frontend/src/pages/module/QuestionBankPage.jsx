import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const MODULES = [
    { code: "DS", label: "Data Science" },
    { code: "SE", label: "Software Engineering" },
    { code: "QA", label: "Quality Assurance" },
    { code: "BA", label: "Business Analysis" },
    { code: "PM", label: "Project Management" },
];

const MODULE_COLORS = {
    DS: { bg: "bg-violet-600", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-400 border-violet-500/20" },
    SE: { bg: "bg-blue-600", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
    QA: { bg: "bg-green-600", text: "text-green-400", badge: "bg-green-500/20 text-green-400 border-green-500/20" },
    BA: { bg: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
    PM: { bg: "bg-pink-600", text: "text-pink-400", badge: "bg-pink-500/20 text-pink-400 border-pink-500/20" },
};

const STATUS_CHIP = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-green-500/10  text-green-400  border-green-500/20",
    declined: "bg-red-500/10   text-red-400   border-red-500/20",
};

const inp = "w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none";

function EditModal({ question, onClose, onSave }) {
    const [form, setForm] = useState({ questionText: question.questionText, explanation: question.explanation || "", correctOption: question.correctOption, options: question.options.map((o) => ({ label: o.label, text: o.text })) });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const setOption = (label, text) => setForm((f) => ({ ...f, options: f.options.map((o) => (o.label === label ? { label, text } : o)) }));

    const save = async () => {
        setSaving(true); setErr("");
        try { await api.patch(`/api/module/questions/${question._id}`, form); onSave(); }
        catch (e) { setErr(e.response?.data?.message || "Failed to save"); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Edit Question</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {err && <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-sm rounded-xl px-3 py-2">{err}</div>}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Question</label>
                        <textarea rows={3} value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} className={inp} />
                    </div>
                    {form.options.map((opt) => (
                        <div key={opt.label}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Option {opt.label} {opt.label === form.correctOption && <span className="ml-2 text-green-400">✓ Correct</span>}
                            </label>
                            <div className="flex gap-2">
                                <input value={opt.text} onChange={(e) => setOption(opt.label, e.target.value)} className="flex-1 border border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <button onClick={() => setForm((f) => ({ ...f, correctOption: opt.label }))}
                                    className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${form.correctOption === opt.label ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-slate-700 text-slate-500 hover:bg-slate-800"}`}>
                                    Correct
                                </button>
                            </div>
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Explanation (optional)</label>
                        <textarea rows={2} value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} className={inp} />
                    </div>
                </div>
                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button onClick={onClose} className="border border-slate-600 text-slate-400 px-4 py-2 rounded-xl text-sm hover:bg-slate-800 transition-colors">Cancel</button>
                    <button disabled={saving} onClick={save} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function QuestionBankPage() {
    const { user } = useAuth();
    const isManager = user?.moduleScopedRoles?.some((r) => r.role === "MODULE_MANAGER");
    const myModules = user?.moduleScopedRoles?.map((r) => r.module) || [];
    const [activeModule, setActiveModule] = useState(myModules[0] || "DS");
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");

    const fetchQuestions = async (module) => {
        setLoading(true); setError("");
        try {
            if (isManager) { const res = await api.get(`/api/module/questions/${module}`); setQuestions(res.data.questions || []); }
            else { const res = await api.get("/api/module/questions/my-submissions"); setQuestions((res.data.questions || []).filter((q) => q.module === module)); }
        } catch (e) { setError(e.response?.data?.message || "Failed to load questions"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchQuestions(activeModule); }, [activeModule]);

    const handleDelete = async () => {
        setDeleting(true);
        try { await api.delete(`/api/module/questions/${deleteId}`); setQuestions((qs) => qs.filter((q) => q._id !== deleteId)); setDeleteId(null); }
        catch (e) { alert(e.response?.data?.message || "Failed to delete"); }
        finally { setDeleting(false); }
    };

    const c = MODULE_COLORS[activeModule] || MODULE_COLORS.DS;
    const filtered = filterStatus === "all" ? questions : questions.filter((q) => q.status === filterStatus);
    const allModCodes = isManager ? myModules : [...new Set([...myModules, ...questions.map((q) => q.module)])];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-6xl mx-auto">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-wider">{isManager ? "Module Manager" : "Module Operator"}</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Question Bank</h1>
                    <p className="text-gray-500 mt-1 text-sm">{isManager ? "Manage all questions for your modules — edit, delete and review." : "View and manage your question submissions."}</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Module tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {allModCodes.map((code) => {
                        const mc = MODULE_COLORS[code] || MODULE_COLORS.DS;
                        return (
                            <button key={code} onClick={() => setActiveModule(code)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeModule === code ? `${mc.bg} text-white shadow-sm` : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
                                {code} — {MODULES.find((m) => m.code === code)?.label}
                            </button>
                        );
                    })}
                </div>

                {/* Status filter */}
                <div className="flex gap-2 mb-6">
                    {["all", "pending", "approved", "declined"].map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize border ${filterStatus === s ? "bg-slate-700 text-white border-slate-600" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
                            {s === "all" ? `All (${questions.length})` : `${s} (${questions.filter((q) => q.status === s).length})`}
                        </button>
                    ))}
                </div>

                {loading && <div className="text-center py-16 text-slate-500">Loading…</div>}
                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-sm text-slate-500">No questions found{filterStatus !== "all" ? ` with status "${filterStatus}"` : " for this module"}.</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="space-y-3">
                        {filtered.map((q, idx) => (
                            <div key={q._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center mt-0.5 border border-slate-700">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${STATUS_CHIP[q.status]}`}>{q.status}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>{q.module}</span>
                                            {q.submittedBy?.name && <span className="text-xs text-slate-500">by {q.submittedBy.name}</span>}
                                        </div>
                                        <p className="text-sm font-medium text-white mb-3">{q.questionText}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options?.map((opt) => (
                                                <div key={opt.label} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${opt.label === q.correctOption ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                                    <span className="font-bold">{opt.label}.</span> {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && <p className="text-xs text-slate-500 mt-2 italic">💡 {q.explanation}</p>}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => setEditTarget(q)} className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors">Edit</button>
                                        <button onClick={() => setDeleteId(q._id)} className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editTarget && <EditModal question={editTarget} onClose={() => setEditTarget(null)} onSave={() => { setEditTarget(null); fetchQuestions(activeModule); }} />}

            {deleteId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <div className="text-4xl mb-3">🗑️</div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Question?</h3>
                        <p className="text-sm text-slate-400 mb-6">This cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="border border-slate-600 text-slate-400 px-5 py-2 rounded-xl text-sm">Cancel</button>
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
