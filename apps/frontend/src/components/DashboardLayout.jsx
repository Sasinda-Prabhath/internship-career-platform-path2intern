import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardRoute } from "../utils/roleUtils";

// ─── Nav item definitions per role ───────────────────────────────────────────

const NAV = {
    SYSTEM_ADMIN: {
        accent: "text-red-400",
        activeBg: "bg-red-500/10 text-red-300 border-red-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-red-500",
        items: [
            { label: "Overview", to: "/dashboard/system-admin", icon: "grid" },
            { label: "Staff Management", to: "/staff-management", icon: "users" },
            { label: "Org Approvals", to: "/admin/org-approvals", icon: "check" },
            { label: "Contact Messages", to: "/admin/contacts", icon: "mail" },
        ],
    },
    UNIVERSITY_ADMIN: {
        accent: "text-amber-400",
        activeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-amber-500",
        items: [
            { label: "Overview", to: "/dashboard/university-admin", icon: "grid" },
            { label: "Staff Management", to: "/staff-management", icon: "users" },
            { label: "Org Approvals", to: "/admin/org-approvals", icon: "check" },
        ],
    },
    ORGANIZATION: {
        accent: "text-green-400",
        activeBg: "bg-green-500/10 text-green-300 border-green-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-green-500",
        items: [
            { label: "Overview", to: "/dashboard/recruiter", icon: "grid" },
            { label: "Job Listings", to: "/org/job-listings", icon: "list" },
            { label: "Post a Job", to: "/org/post-job", icon: "plus" },
            { label: "Interview Simulation", to: "/simulation", icon: "target" },
        ],
    },
    // RECRUITER is the legacy name for ORGANIZATION — same nav config
    RECRUITER: {
        accent: "text-green-400",
        activeBg: "bg-green-500/10 text-green-300 border-green-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-green-500",
        items: [
            { label: "Overview", to: "/dashboard/recruiter", icon: "grid" },
            { label: "Job Listings", to: "/org/job-listings", icon: "list" },
            { label: "Post a Job", to: "/org/post-job", icon: "plus" },
            { label: "Interview Simulation", to: "/simulation", icon: "target" },
        ],
    },
    STUDENT: {
        accent: "text-blue-400",
        activeBg: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-blue-500",
        items: [
            { label: "Overview", to: "/dashboard/student", icon: "grid" },
            { label: "Browse Internships", to: "/", icon: "search" },
            { label: "Take a Quiz", to: "/quiz", icon: "quiz" },
            { label: "Interview Simulation", to: "/simulation", icon: "target" },
        ],
    },
    MODULE_MANAGER: {
        accent: "text-purple-400",
        activeBg: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-purple-500",
        items: [
            { label: "Overview", to: "/dashboard/module-manager", icon: "grid" },
            { label: "Review Queue", to: "/module/review", icon: "check" },
            { label: "Submit Question", to: "/module/submit-question", icon: "plus" },
            { label: "Question Bank", to: "/module/question-bank", icon: "book" },
            { label: "Manage Operators", to: "/module/assign-operator", icon: "users" },
            { label: "Interview Simulation", to: "/simulation", icon: "target" },
        ],
    },
    MODULE_OPERATOR: {
        accent: "text-indigo-400",
        activeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        hover: "hover:bg-slate-800 hover:text-white",
        dot: "bg-indigo-500",
        items: [
            { label: "Overview", to: "/dashboard/module-operator", icon: "grid" },
            { label: "Submit Question", to: "/module/submit-question", icon: "plus" },
            { label: "Question Bank", to: "/module/question-bank", icon: "book" },
            { label: "Interview Simulation", to: "/simulation", icon: "target" },
        ],
    },
};

// ─── Icon SVG registry ────────────────────────────────────────────────────────

function Icon({ name, className = "w-5 h-5" }) {
    const icons = {
        grid: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
        document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        office: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
        cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
        mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
        academic: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
        collection: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
        check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
        search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
        book: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
        quiz: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
        star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
        plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />,
        logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
        target: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    };
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[name] || icons.grid}
        </svg>
    );
}

// ─── Resolve which nav config to use ─────────────────────────────────────────

function resolveRole(user) {
    if (!user) return null;
    const scoped = user.moduleScopedRoles || [];
    if (scoped.some((r) => r.role === "MODULE_MANAGER")) return "MODULE_MANAGER";
    if (scoped.some((r) => r.role === "MODULE_OPERATOR")) return "MODULE_OPERATOR";
    const role = user.globalRole || null;
    // RECRUITER is the legacy role name — map it to ORGANIZATION nav
    if (role === "RECRUITER") return "ORGANIZATION";
    return role;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, setCollapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const role = resolveRole(user);
    const config = NAV[role] || null;
    const { accent = "text-blue-400", activeBg = "bg-blue-500/10 text-blue-300 border-blue-500/20", hover = "hover:bg-slate-800 hover:text-white", dot = "bg-blue-500", items = [] } = config || {};

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const getInitials = (name = "") =>
        name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <aside
            className={`
                flex flex-col bg-[#0d1424] border-r border-slate-800
                transition-all duration-300 ease-in-out flex-shrink-0
                ${collapsed ? "w-16" : "w-64"}
            `}
            style={{ minHeight: "100vh" }}
        >
            {/* Logo + collapse toggle */}
            <div className={`flex items-center border-b border-slate-800 px-3 py-4 ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">P2</span>
                        </div>
                        <span className="text-white font-bold text-sm">Path2Intern</span>
                    </Link>
                )}
                {collapsed && (
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">P2</span>
                        </div>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 ${collapsed ? "mt-2" : ""}`}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {collapsed
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        }
                    </svg>
                </button>
            </div>

            {/* Role label */}
            {!collapsed && (
                <div className="px-4 pt-4 pb-1">
                    <p className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
                        {role?.replace(/_/g, " ") || "Dashboard"}
                    </p>
                </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {items.map((item) => {
                    const isPlaceholder = item.to === "#";
                    const isActive = !isPlaceholder && (
                        item.to === location.pathname ||
                        (item.to !== "/" && location.pathname.startsWith(item.to))
                    );

                    const itemClass = [
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                        "transition-all duration-150 group border",
                        isActive
                            ? `${activeBg} border-transparent`
                            : `text-slate-400 border-transparent ${hover}`,
                        collapsed ? "justify-center" : "",
                        isPlaceholder ? "opacity-30 cursor-not-allowed" : "",
                    ].join(" ");

                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            title={collapsed ? item.label : undefined}
                            onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
                            className={itemClass}
                        >
                            <Icon
                                name={item.icon}
                                className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "" : "text-slate-500 group-hover:text-white"}`}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {!collapsed && isPlaceholder && (
                                <span className="ml-auto text-xs text-slate-600 font-normal">soon</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className={`border-t border-slate-800 p-3 space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
                {!collapsed && user && (
                    <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${dot}`}>
                            {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                {/* Profile link */}
                <Link
                    to="/profile"
                    title="My Profile"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? "justify-center w-full" : "w-full"}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {!collapsed && <span>My Profile</span>}
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title="Sign out"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? "justify-center w-full" : "w-full"}`}
                >
                    <Icon name="logout" className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>
        </aside>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {children}
            </main>
        </div>
    );
}
