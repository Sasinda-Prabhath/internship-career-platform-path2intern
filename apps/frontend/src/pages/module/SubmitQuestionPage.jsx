import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { submitQuestion } from "../../services/moduleApi";

const MODULE_OPTIONS = [
    { code: "DS", label: "Data Science" },
    { code: "SE", label: "Software Engineering" },
    { code: "QA", label: "Quality Assurance" },
    { code: "BA", label: "Business Analysis" },
    { code: "PM", label: "Project Management" },
];

const OPTION_LABELS = ["A", "B", "C", "D"];
const defaultOptions = () => OPTION_LABELS.map((label) => ({ label, text: "" }));

const inp = "w-full border border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

export default function SubmitQuestionPage() {
    const { user } = useAuth();
    const myModules = user?.moduleScopedRoles?.map((r) => r.module) || [];
    const allowedModules = MODULE_OPTIONS.filter((m) => myModules.includes(m.code));

    const [form, setForm] = useState({ module: allowedModules[0]?.code || "", questionText: "", options: defaultOptions(), correctOption: "A", explanation: "" });
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const setOption = (index, value) => {
        const opts = [...form.options];
        opts[index] = { ...opts[index], text: value };
        setForm((f) => ({ ...f, options: opts }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setResult(null);
        if (form.options.some((o) => !o.text.trim())) { setResult({ type: "error", message: "All four answer options must be filled in." }); return; }
        if (!form.questionText.trim()) { setResult({ type: "error", message: "Question text cannot be empty." }); return; }
        setSubmitting(true);
        try {
            const res = await submitQuestion({ module: form.module, questionText: form.questionText, options: form.options, correctOption: form.correctOption, explanation: form.explanation || undefined });
            setResult({ type: "success", message: res.data.message, status: res.data.question?.status });
            setForm((f) => ({ ...f, questionText: "", options: defaultOptions(), correctOption: "A", explanation: "" }));
        } catch (err) { setResult({ type: "error", message: err.response?.data?.message || "Submission failed." }); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-wider">MCQ Submission</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Submit a Question</h1>
                    <p className="text-gray-500 mt-1 text-sm">Add a new multiple-choice question to your module's question bank.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {user?.moduleScopedRoles?.some((r) => r.role === "MODULE_OPERATOR") && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3 items-start">
                        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-amber-300 text-sm">As a <strong>Module Operator</strong>, your question will be sent for manager review before becoming visible to students.</p>
                    </div>
                )}

                {result && (
                    <div className={`rounded-xl p-4 mb-6 flex gap-3 items-start border ${result.type === "success" ? result.status === "approved" ? "bg-green-500/10 border-green-500/20" : "bg-purple-500/10 border-purple-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${result.type === "success" ? result.status === "approved" ? "text-green-400" : "text-purple-400" : "text-red-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {result.type === "success" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        </svg>
                        <p className={`text-sm font-medium ${result.type === "success" ? result.status === "approved" ? "text-green-300" : "text-purple-300" : "text-red-300"}`}>{result.message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Module</label>
                        <select className={inp} value={form.module} onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))} required>
                            {allowedModules.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Question</label>
                        <textarea className={`${inp} resize-none`} rows={4} placeholder="Enter your question here..." value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Answer Options</label>
                        <div className="space-y-3">
                            {OPTION_LABELS.map((label, i) => (
                                <div key={label} className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                                        <input type="radio" name="correctOption" value={label} checked={form.correctOption === label} onChange={(e) => setForm((f) => ({ ...f, correctOption: e.target.value }))} className="accent-purple-500 w-4 h-4" />
                                    </label>
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${form.correctOption === label ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400"}`}>{label}</span>
                                    <input type="text" className={inp} placeholder={`Option ${label}`} value={form.options[i].text} onChange={(e) => setOption(i, e.target.value)} required />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Select the radio button next to the correct answer.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Explanation <span className="font-normal text-slate-600 normal-case">(optional)</span></label>
                        <textarea className={`${inp} resize-none`} rows={3} placeholder="Explain why the correct answer is right..." value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={submitting || allowedModules.length === 0}
                            className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20">
                            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {submitting ? "Submitting..." : "Submit Question"}
                        </button>
                    </div>
                </form>

                {allowedModules.length === 0 && (
                    <p className="text-center text-slate-500 text-sm mt-4">You have no module assignments. Contact your Module Manager or University Admin.</p>
                )}
            </div>
        </div>
    );
}
