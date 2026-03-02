import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardRoute, getRoleLabel, getRoleBadgeColors } from "../utils/roleUtils";
import { useNavigate } from "react-router-dom";

/* ── Public marketing navbar (dark) ─────────────────────────────────────── */
function PublicNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileOpen(false);
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0f1e]/95 backdrop-blur-md shadow-lg border-b border-slate-800/50" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">P2</span>
                        </div>
                        <span className="text-white font-bold text-lg">Path2Intern</span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-6">
                        {[["features", "Features"], ["how-it-works", "How It Works"], ["contact", "Contact"]].map(([id, label]) => (
                            <button key={id} onClick={() => scrollTo(id)}
                                className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">Sign In</Link>
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/25">Get Started</Link>
                    </div>

                    {/* Mobile menu button */}
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-300 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden bg-slate-900 border-t border-slate-800 py-4 flex flex-col gap-3 px-4">
                        {[["features", "Features"], ["how-it-works", "How It Works"], ["contact", "Contact"]].map(([id, label]) => (
                            <button key={id} onClick={() => scrollTo(id)} className="text-slate-300 text-sm text-left py-2">{label}</button>
                        ))}
                        <Link to="/login" className="text-slate-300 text-sm py-2">Sign In</Link>
                        <Link to="/register" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">Get Started</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

/* ── App navbar for logged-in users (dark, transparent) ─────────────────── */
function AppNavbar({ user, logout }) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dashboardRoute = getDashboardRoute(user.globalRole, user.moduleScopedRoles);
    const roleLabel = getRoleLabel(user.globalRole, user.moduleScopedRoles);
    const badgeColors = getRoleBadgeColors(user.globalRole, user.moduleScopedRoles);
    const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    useEffect(() => {
        const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <nav className="bg-[#0a0f1e] border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P2</span>
                    </div>
                    <span className="text-white font-bold text-lg">Path2Intern</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to={dashboardRoute} className="hidden sm:flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-slate-800">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Dashboard
                    </Link>
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setDropdownOpen((p) => !p)} className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-slate-700">
                                {initials}
                            </div>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
                                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors.bg} ${badgeColors.text}`}>{roleLabel}</span>
                                </div>
                                <div className="py-1">
                                    <Link to={dashboardRoute} onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                        Dashboard
                                    </Link>
                                </div>
                                <div className="border-t border-slate-800">
                                    <button onClick={async () => { setDropdownOpen(false); await logout(); navigate("/login"); }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export { PublicNavbar, AppNavbar };
