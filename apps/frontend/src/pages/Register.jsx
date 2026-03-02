import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const TABS = ["student", "organization"];

/* ── Reusable animated eye ───────────────────────────────────────────────── */
function Eye({ x = 0, y = 0 }) {
  return (
    <div className="relative w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner">
      <div
        className="w-2.5 h-2.5 bg-gray-900 rounded-full transition-transform duration-75"
        style={{ transform: `translate(${x * 4}px, ${y * 4}px)` }}
      />
    </div>
  );
}

function AnimatedPanel({ eyeDir }) {
  const { x, y } = eyeDir;
  return (
    <div className="relative w-full h-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden select-none">
      <div className="absolute w-64 h-64 rounded-full bg-blue-100/40 -top-16 -left-16" />
      <div className="absolute w-48 h-48 rounded-full bg-indigo-100/30 -bottom-8 -right-8" />
      {/* Logo — links to home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">P2</span>
        </div>
        <span className="text-gray-800 font-bold text-lg">Path2Intern</span>
      </Link>
      <div className="relative w-72 h-72">
        <div className="absolute bottom-0 left-12 w-24 h-48 bg-[#6c47ff] rounded-2xl flex flex-col items-center justify-start pt-8 gap-2 shadow-xl" style={{ transform: "rotate(-6deg)" }}>
          <div className="flex gap-2"><Eye x={x} y={y} /><Eye x={x} y={y} /></div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-36 bg-gray-900 rounded-2xl flex flex-col items-center justify-start pt-5 gap-2 shadow-xl">
          <div className="flex gap-2"><Eye x={x} y={y} /><Eye x={x} y={y} /></div>
          <div className="w-6 h-1 bg-gray-600 rounded-full mt-2" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-14 bg-[#f97316] rounded-t-full flex items-start justify-center pt-2 shadow-xl">
          <div className="flex gap-3"><div className="w-2 h-2 bg-gray-800 rounded-full" /><div className="w-2 h-2 bg-gray-800 rounded-full" /></div>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-28 bg-[#facc15] rounded-t-3xl flex flex-col items-center justify-start pt-4 gap-2 shadow-xl">
          <div className="flex gap-2"><div className="w-2 h-2 bg-gray-800 rounded-full" /><div className="w-2 h-2 bg-gray-800 rounded-full" /></div>
          <div className="w-5 h-0.5 bg-gray-800 rounded mt-2" />
        </div>
      </div>
      <div className="absolute bottom-6 left-6 flex gap-4">
        {["Privacy Policy", "Terms of Service", "Contact"].map((t) => (
          <a key={t} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t}</a>
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

export default function Register() {
  const [tab, setTab] = useState("student");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", organizationName: "" });
  const [pdfFile, setPdfFile] = useState(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [eyeDir, setEyeDir] = useState({ x: 0, y: 0 });
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleMouseMove = useCallback((e) => {
    setEyeDir({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const set = (field) => (e) => setFormData((f) => ({ ...f, [field]: e.target.value }));

  const validatePassword = (pw) => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Must contain an uppercase letter";
    if (!/[a-z]/.test(pw)) return "Must contain a lowercase letter";
    if (!/[0-9]/.test(pw)) return "Must contain a number";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    const pwErr = validatePassword(formData.password);
    if (pwErr) return setError(pwErr);
    if (tab === "student" && !formData.email.endsWith("@my.sliit.lk")) return setError("Please use your student email (@my.sliit.lk)");
    if (tab === "organization" && !pdfFile) return setError("Please upload a PDF document to verify business validity");
    setLoading(true);
    try {
      if (tab === "student") {
        await api.post("/api/auth/register", { name: formData.name, email: formData.email, password: formData.password });
      } else {
        const fd = new FormData();
        fd.append("name", formData.name); fd.append("email", formData.email);
        fd.append("password", formData.password); fd.append("organizationName", formData.organizationName);
        fd.append("document", pdfFile);
        await api.post("/api/auth/register-org", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setSuccess("Check your email for the 6-digit OTP code."); setStep(2);
    } catch (err) { setError(err.response?.data?.message || "Registration failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.post("/api/auth/verify", { email: formData.email, code: otp });
      if (tab === "organization") { setStep(3); }
      else { setSuccess("Email verified! Redirecting to login…"); setTimeout(() => navigate("/login"), 2000); }
    } catch (err) { setError(err.response?.data?.message || "Verification failed."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setLoading(true);
    try { await api.post("/api/auth/resend", { email: formData.email }); setSuccess("New code sent!"); }
    catch (err) { setError(err.response?.data?.message || "Failed to resend."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" onMouseMove={handleMouseMove}>
      {/* Left — blobs */}
      <div className="hidden lg:flex flex-1 relative"><AnimatedPanel eyeDir={eyeDir} /></div>

      {/* Right — dark form */}
      <div className="flex-1 bg-[#0f172a] flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><span className="text-white text-xs font-bold">P2</span></div>
            <span className="text-white font-bold text-lg">Path2Intern</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-6">Start your internship journey today</p>

          {/* Tab toggle */}
          {step === 1 && (
            <div className="grid grid-cols-2 bg-slate-800 rounded-xl p-1 mb-6 border border-slate-700">
              {TABS.map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); setPdfFile(null); }}
                  className={`py-2 text-sm font-semibold capitalize rounded-lg transition-all ${tab === t ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                  {t === "student" ? "🎓 Student" : "🏢 Organisation"}
                </button>
              ))}
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>}

          {/* Step 1: Form */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{tab === "organization" ? "Contact Person Name" : "Full Name"}</label>
                <input type="text" required value={formData.name} onChange={set("name")} className={inputCls} placeholder="Your full name" />
              </div>
              {tab === "organization" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
                  <input type="text" required value={formData.organizationName} onChange={set("organizationName")} className={inputCls} placeholder="e.g. Acme Corp Ltd" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{tab === "student" ? "Student Email" : "Work Email"}</label>
                <input type="email" required value={formData.email} onChange={set("email")} className={inputCls} placeholder={tab === "student" ? "it21xxxxxx@my.sliit.lk" : "you@company.com"} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input type="password" required value={formData.password} onChange={set("password")} className={inputCls} placeholder="Min 8 chars, upper + lower + number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <input type="password" required value={formData.confirmPassword} onChange={set("confirmPassword")} className={inputCls} placeholder="Repeat password" />
              </div>
              {tab === "organization" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Document (PDF) <span className="text-red-400">*</span></label>
                  <div onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${pdfFile ? "border-green-500/50 bg-green-500/5" : "border-slate-600 hover:border-blue-500/50 hover:bg-blue-500/5"}`}>
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <span>📄</span><span className="text-sm font-medium truncate max-w-xs">{pdfFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Click to upload PDF (max 5 MB)</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files[0] || null)} />
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60 mt-2">
                {loading ? "Creating account…" : "Create Account"}
              </button>
              <p className="text-center text-slate-400 text-sm">
                Already have an account? <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300">Sign in</Link>
              </p>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-3">📬</div>
                <h3 className="font-bold text-white text-lg">Check your email</h3>
                <p className="text-sm text-slate-400 mt-1">We sent a 6-digit code to <strong className="text-slate-200">{formData.email}</strong></p>
              </div>
              <input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-center text-2xl font-mono tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000" />
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl py-3 text-sm disabled:opacity-60 transition-colors">
                {loading ? "Verifying…" : "Verify Email"}
              </button>
              <button type="button" onClick={handleResend} disabled={loading}
                className="w-full text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50">
                Didn't receive the code? Resend
              </button>
            </form>
          )}

          {/* Step 3: Org pending */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">⏳</div>
              <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Your email is verified. A University Admin will review your document and activate your account.</p>
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl px-4 py-3">
                <strong>Status:</strong> Pending approval
              </div>
              <Link to="/login" className="block w-full py-3 border border-slate-600 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
