import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const StatCard = ({ label, value, icon, accent }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
            <span className="text-lg">{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
);

const DarkActionCard = ({ to, icon, title, description, disabled }) => (
    <Link
        to={disabled ? "#" : to}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-blue-300 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10"
            }`}
    >
        <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
    </Link>
);

export default function SystemAdminDashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-500/30 uppercase tracking-wider">
                            System Admin
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Admin Control Center</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Full platform oversight — users, orgs, roles, and settings.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Total Users" value="—" icon="👥" accent="text-red-400" />
                    <StatCard label="Universities" value="—" icon="🏛️" accent="text-rose-400" />
                    <StatCard label="Organizations" value="—" icon="🏢" accent="text-pink-400" />
                    <StatCard label="Active Sessions" value="—" icon="⚡" accent="text-fuchsia-400" />
                </div>

                {/* Action cards */}
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DarkActionCard to="#" icon="👤" title="Manage Users" description="View, edit, activate or deactivate all platform users." disabled />
                    <DarkActionCard to="#" icon="🛡️" title="Assign Roles" description="Assign University Admins, Recruiters, and Module Managers." disabled />
                    <DarkActionCard to="#" icon="📋" title="System Audit Logs" description="Review all security events, login history, and changes." disabled />
                    <DarkActionCard to="#" icon="⚙️" title="Platform Settings" description="Configure global settings, email templates, API keys." disabled />
                    <DarkActionCard to="/admin/org-approvals" icon="✅" title="Org Approvals" description="Review and approve organisation registration applications." />
                    <DarkActionCard to="/admin/contacts" icon="📬" title="Contact Messages" description="View and reply to messages submitted through the contact form." />
                </div>
            </div>
        </div>
    );
}
