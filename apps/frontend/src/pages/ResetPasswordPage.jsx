import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";

/* ── Eye tracking blobs ──────────────────────────────────────────────────── */
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
  
  const rotation = x * 12;
  const tilt = y * 8;
  const bodyShift = { x: x * 8, y: y * 6 };
  
  return (
    <div className="relative w-full h-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden select-none">
      <div className="absolute w-64 h-64 rounded-full bg-blue-100/40 -top-16 -left-16" />
      <div className="absolute w-48 h-48 rounded-full bg-indigo-100/30 -bottom-8 -right-8" />

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">P2</span>
        </div>
        <span className="text-gray-800 font-bold text-lg">Path2Intern</span>
      </Link>

      <div className="relative w-72 h-72">
        <div
          className="absolute bottom-0 left-12 w-24 h-48 bg-[#6c47ff] rounded-2xl flex flex-col items-center justify-start pt-8 gap-2 shadow-xl transition-transform duration-75"
          style={{ 
            transform: `rotate(${rotation * 0.5}deg) translateY(${bodyShift.y}px)`,
            transformOrigin: "center bottom"
          }}
        >
          <div className="flex gap-2">
            <Eye x={x} y={y} />
            <Eye x={x} y={y} />
          </div>
        </div>

        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-36 bg-gray-900 rounded-2xl flex flex-col items-center justify-start pt-5 gap-2 shadow-xl transition-transform duration-75"
          style={{ 
            transform: `translateX(-50%) rotateZ(${rotation * 0.3}deg) translateY(${bodyShift.y}px)`,
            transformOrigin: "center bottom"
          }}
        >
          <div className="flex gap-2">
            <Eye x={x} y={y} />
            <Eye x={x} y={y} />
          </div>
          <div className="w-6 h-1 bg-gray-600 rounded-full mt-2" />
        </div>

        <div 
          className="absolute bottom-0 left-0 w-24 h-14 bg-[#f97316] rounded-t-full flex items-start justify-center pt-2 shadow-xl transition-transform duration-75"
          style={{ 
            transform: `rotate(${rotation * 0.4}deg) translateY(${bodyShift.y * 0.8}px)`,
            transformOrigin: "center bottom"
          }}
        >
          <div className="flex gap-3">
            <Eye x={x} y={y} />
            <Eye x={x} y={y} />
          </div>
        </div>

        <div 
          className="absolute bottom-0 right-0 w-20 h-28 bg-[#facc15] rounded-t-3xl flex flex-col items-center justify-start pt-4 gap-2 shadow-xl transition-transform duration-75"
          style={{ 
            transform: `rotate(${rotation * 0.4}deg) translateY(${bodyShift.y * 0.8}px)`,
            transformOrigin: "center bottom"
          }}
        >
          <div className="flex gap-2">
            <Eye x={x} y={y} />
            <Eye x={x} y={y} />
          </div>
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

/* ── Reset Password page ────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eyeDir, setEyeDir] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleMouseMove = useCallback((e) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setEyeDir({
      x: (e.clientX / vw - 0.5) * 2,
      y: (e.clientY / vh - 0.5) * 2,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !code || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      await api.post("/api/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" onMouseMove={handleMouseMove}>
      <div className="hidden lg:flex flex-1 relative">
        <AnimatedPanel eyeDir={eyeDir} />
      </div>

      <div className="flex-1 bg-[#0f172a] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P2</span>
            </div>
            <span className="text-white font-bold text-lg">Path2Intern</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-slate-400 text-sm mb-8">Enter the code and your new password</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Reset Code (from email)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-widest text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPw ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60 shadow-sm mt-6"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-8">
            <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
