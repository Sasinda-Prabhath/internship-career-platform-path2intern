import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const MODULES = [
    { code: "DS", label: "Data Science", emoji: "📊" },
    { code: "SE", label: "Software Engineering", emoji: "💻" },
    { code: "QA", label: "Quality Assurance", emoji: "🧪" },
    { code: "BA", label: "Business Analysis", emoji: "📈" },
    { code: "PM", label: "Project Management", emoji: "🗂️" },
];

// Per-module colour palette — all designed for a WHITE background
const MC = {
    DS: { pill: "bg-violet-100 text-violet-700", iconBg: "bg-violet-600", border: "border-violet-200", ring: "ring-violet-400", btn: "bg-violet-600 hover:bg-violet-700", accent: "text-violet-600", bar: "bg-violet-500", chosenBg: "bg-violet-50 border-violet-400 text-violet-800" },
    SE: { pill: "bg-blue-100   text-blue-700", iconBg: "bg-blue-600", border: "border-blue-200", ring: "ring-blue-400", btn: "bg-blue-600 hover:bg-blue-700", accent: "text-blue-600", bar: "bg-blue-500", chosenBg: "bg-blue-50 border-blue-400 text-blue-800" },
    QA: { pill: "bg-emerald-100 text-emerald-700", iconBg: "bg-emerald-600", border: "border-emerald-200", ring: "ring-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700", accent: "text-emerald-600", bar: "bg-emerald-500", chosenBg: "bg-emerald-50 border-emerald-400 text-emerald-800" },
    BA: { pill: "bg-amber-100  text-amber-700", iconBg: "bg-amber-500", border: "border-amber-200", ring: "ring-amber-400", btn: "bg-amber-500 hover:bg-amber-600", accent: "text-amber-600", bar: "bg-amber-400", chosenBg: "bg-amber-50 border-amber-400 text-amber-800" },
    PM: { pill: "bg-rose-100   text-rose-700", iconBg: "bg-rose-600", border: "border-rose-200", ring: "ring-rose-400", btn: "bg-rose-600 hover:bg-rose-700", accent: "text-rose-600", bar: "bg-rose-500", chosenBg: "bg-rose-50 border-rose-400 text-rose-800" },
};

export default function QuizPage() {
    const { user } = useAuth();
    const [selectedModule, setSelectedModule] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [chosen, setChosen] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState([]);

    const fetchQuestions = async (code) => {
        setLoading(true); setError("");
        try {
            const res = await api.get(`/api/module/questions/${code}/approved`);
            setQuestions((res.data.questions || []).sort(() => Math.random() - 0.5));
        } catch { setError("Could not load questions. Please try again."); }
        finally { setLoading(false); }
    };

    const startQuiz = (code) => {
        setSelectedModule(code); setQuizStarted(false); setFinished(false);
        setScore(0); setAnswers([]); setCurrentIndex(0); setChosen(null); setRevealed(false);
        fetchQuestions(code);
    };

    const beginQuiz = () => {
        if (questions.length === 0) return;
        setQuizStarted(true); setCurrentIndex(0); setChosen(null); setRevealed(false); setScore(0); setAnswers([]); setFinished(false);
    };

    const checkAnswer = () => { if (!chosen) return; setRevealed(true); };

    const next = () => {
        const q = questions[currentIndex];
        const isCorrect = chosen === q.correctOption;
        const newAnswers = [...answers, { chosen, correct: q.correctOption, isCorrect }];
        setAnswers(newAnswers);
        if (isCorrect) setScore((s) => s + 1);
        if (currentIndex + 1 >= questions.length) { setFinished(true); }
        else { setCurrentIndex((i) => i + 1); setChosen(null); setRevealed(false); }
    };

    const restart = () => {
        setQuizStarted(false); setFinished(false); setChosen(null); setRevealed(false);
        setScore(0); setAnswers([]); setCurrentIndex(0);
        setQuestions((qs) => [...qs].sort(() => Math.random() - 0.5));
    };

    const c = selectedModule ? MC[selectedModule] : null;
    const q = quizStarted && !finished ? questions[currentIndex] : null;
    const pct = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

    const emoji = (sc, total) => {
        if (sc === total) return "🏆";
        if (sc >= total * 0.7) return "🎉";
        if (sc >= total * 0.5) return "👍";
        return "📚";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wider">Quiz Mode</span>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">Take a Quiz</h1>
                        <p className="text-gray-500 mt-1 text-sm">Test your knowledge. Each quiz uses the live question bank.</p>
                    </div>
                    {selectedModule && (
                        <button onClick={() => { setSelectedModule(null); setQuizStarted(false); setFinished(false); }}
                            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                            ← All Modules
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Module selector ───────────────────────────────────── */}
                {!selectedModule && (
                    <>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">Choose a Module</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MODULES.map((m) => {
                                const mc = MC[m.code];
                                return (
                                    <button key={m.code} onClick={() => startQuiz(m.code)}
                                        className={`bg-white border-2 ${mc.border} rounded-2xl p-6 text-left group hover:-translate-y-1 hover:shadow-md transition-all duration-200`}>
                                        <div className={`w-12 h-12 rounded-xl ${mc.iconBg} flex items-center justify-center text-white font-bold text-sm mb-4 group-hover:scale-105 transition-transform shadow-sm`}>
                                            {m.emoji}
                                        </div>
                                        <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{m.label}</h3>
                                        <p className={`text-xs font-medium ${mc.accent}`}>{m.code} · Start quiz →</p>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Loading ───────────────────────────────────────────── */}
                {selectedModule && loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${c.iconBg} animate-pulse flex items-center justify-center text-white font-bold`}>{selectedModule}</div>
                        <p className="text-sm text-gray-400">Loading questions…</p>
                    </div>
                )}

                {/* ── Error ─────────────────────────────────────────────── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex gap-2 items-center">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* ── No questions ──────────────────────────────────────── */}
                {selectedModule && !loading && !error && questions.length === 0 && (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
                        <p className="text-4xl mb-3">🗄️</p>
                        <p className="text-gray-500 text-sm mb-4">No approved questions yet for this module.</p>
                        <button onClick={() => setSelectedModule(null)}
                            className="text-blue-600 text-sm font-medium hover:underline">← Choose another module</button>
                    </div>
                )}

                {/* ── Ready to start ────────────────────────────────────── */}
                {selectedModule && !loading && !error && questions.length > 0 && !quizStarted && !finished && (
                    <div className={`bg-white border-2 ${c.border} rounded-2xl p-8 text-center max-w-sm mx-auto shadow-sm`}>
                        <div className={`w-16 h-16 ${c.iconBg} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-md`}>
                            {MODULES.find(m => m.code === selectedModule)?.emoji}
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.pill} mb-3 inline-block`}>{selectedModule}</span>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{MODULES.find(m => m.code === selectedModule)?.label}</h2>
                        <p className={`text-2xl font-bold ${c.accent} my-2`}>{questions.length}</p>
                        <p className="text-xs text-gray-500 mb-6">questions · randomised order</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={beginQuiz}
                                className={`${c.btn} text-white px-7 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors`}>
                                Start Quiz
                            </button>
                            <button onClick={() => setSelectedModule(null)}
                                className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Quiz in progress ──────────────────────────────────── */}
                {quizStarted && !finished && q && (
                    <div className="space-y-5">
                        {/* Progress bar */}
                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 font-medium">Question {currentIndex + 1} of {questions.length}</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.pill}`}>Score: {score}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className={`${c.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                        </div>

                        {/* Question card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <p className="text-gray-900 font-semibold text-base leading-relaxed mb-6">{q.questionText}</p>
                            <div className="space-y-3">
                                {q.options.map((opt) => {
                                    let cls = "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50";
                                    let labelCls = "bg-gray-100 text-gray-600";

                                    if (revealed) {
                                        if (opt.label === q.correctOption) {
                                            cls = "border-emerald-300 bg-emerald-50 text-emerald-800";
                                            labelCls = "bg-emerald-500 text-white";
                                        } else if (opt.label === chosen && chosen !== q.correctOption) {
                                            cls = "border-red-300 bg-red-50 text-red-800";
                                            labelCls = "bg-red-500 text-white";
                                        } else {
                                            cls = "border-gray-100 bg-gray-50 text-gray-400";
                                            labelCls = "bg-gray-100 text-gray-400";
                                        }
                                    } else if (chosen === opt.label) {
                                        cls = `border-2 ${c.border} ${c.chosenBg}`;
                                        labelCls = `${c.iconBg} text-white`;
                                    }

                                    return (
                                        <button key={opt.label} disabled={revealed} onClick={() => setChosen(opt.label)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 border ${cls} ${revealed ? "cursor-default" : "cursor-pointer"}`}>
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${labelCls}`}>
                                                {opt.label}
                                            </span>
                                            {opt.text}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {revealed && q.explanation && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                                    <span className="font-semibold">💡 Explanation: </span>{q.explanation}
                                </div>
                            )}
                        </div>

                        {/* Action bar */}
                        <div className="flex justify-end gap-3">
                            {!revealed ? (
                                <button disabled={!chosen} onClick={checkAnswer}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${chosen
                                            ? `${c.btn} text-white shadow-sm`
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}>
                                    Check Answer
                                </button>
                            ) : (
                                <button onClick={next}
                                    className={`${c.btn} text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors`}>
                                    {currentIndex + 1 < questions.length ? "Next Question →" : "Finish Quiz"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Finished ──────────────────────────────────────────── */}
                {finished && (
                    <div className="max-w-sm mx-auto text-center">
                        <div className={`bg-white border-2 ${c.border} rounded-2xl p-8 shadow-sm`}>
                            <div className="text-5xl mb-4">{emoji(score, questions.length)}</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h2>
                            <p className={`text-4xl font-bold ${c.accent} my-3`}>{score} <span className="text-xl text-gray-400">/ {questions.length}</span></p>
                            <p className="text-sm text-gray-500 mb-6">
                                {score === questions.length ? "Perfect score! 🎯" : score >= questions.length * 0.7 ? "Great job! Keep it up." : score >= questions.length * 0.5 ? "Good effort — keep practising!" : "Review this module and try again."}
                            </p>

                            {/* Score bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                                <div className={`${c.bar} h-2 rounded-full transition-all`} style={{ width: `${(score / questions.length) * 100}%` }} />
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button onClick={restart}
                                    className={`${c.btn} text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm`}>
                                    Retake Quiz
                                </button>
                                <button onClick={() => setSelectedModule(null)}
                                    className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                    Other Module
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
