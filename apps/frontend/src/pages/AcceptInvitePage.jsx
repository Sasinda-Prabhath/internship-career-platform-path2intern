import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { acceptInvite } from "../services/staffApi";

export default function AcceptInvitePage() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1 = enter code, 2 = set password
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [staffName, setStaffName] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (step === 1) {
            if (code.trim().length < 6) {
                setError("Please enter a valid invite code.");
                return;
            }
            setStep(2);
            return;
        }

        // Step 2: validate passwords and submit
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (!/[A-Z]/.test(password)) return setError("Password must contain an uppercase letter.");
        if (!/[a-z]/.test(password)) return setError("Password must contain a lowercase letter.");
        if (!/[0-9]/.test(password)) return setError("Password must contain a number.");
        if (password !== confirmPassword) return setError("Passwords do not match.");

        setLoading(true);
        try {
            const res = await acceptInvite(code.trim().toUpperCase(), password);
            setStaffName(res.data.user?.name || "");
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Account Activated!
                    </h1>
                    <p className="text-gray-500 mb-6">
                        Welcome{staffName ? `, ${staffName.split(" ")[0]}` : ""}! Your account is now active. You can log in with your email and the password you just set.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-7">
                    <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Accept Your Invite</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {step === 1
                            ? "Enter the invite code provided by your University Admin."
                            : "Choose a password to secure your account."}
                    </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${step >= s ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"
                                }`}>{s}</div>
                            <span className={`text-xs font-medium ${step >= s ? "text-violet-700" : "text-gray-400"}`}>
                                {s === 1 ? "Invite Code" : "Set Password"}
                            </span>
                            {s < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                Invite Code
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="E.g. AB12CD34"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                maxLength={10}
                                autoFocus
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1.5 text-center">Enter the code exactly as given to you.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-2.5 text-sm text-violet-700 font-medium">
                                Code: <span className="font-mono tracking-widest">{code}</span>
                                <button type="button" onClick={() => setStep(1)} className="ml-2 text-xs text-violet-400 hover:text-violet-600 underline">
                                    Change
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="Repeat your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <ul className="text-xs text-gray-400 space-y-0.5 pl-1">
                                <li className={password.length >= 8 ? "text-green-600" : ""}>✓ At least 8 characters</li>
                                <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>✓ One uppercase letter</li>
                                <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>✓ One lowercase letter</li>
                                <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>✓ One number</li>
                            </ul>
                        </>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {step === 1 ? "Continue →" : loading ? "Activating..." : "Activate Account"}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-5">
                    Already have an account?{" "}
                    <Link to="/login" className="text-violet-600 hover:underline font-medium">Log in</Link>
                </p>
            </div>
        </div>
    );
}
