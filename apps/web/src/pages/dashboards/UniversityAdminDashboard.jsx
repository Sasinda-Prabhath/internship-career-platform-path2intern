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
                : "hover:border-amber-500/30 hover:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
    >
        <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
    </Link>
);

export default function UniversityAdminDashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
                        University Admin
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">University Control Panel</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Manage staff, departments, organisations, and student verification.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Universities" value="—" icon="🏛️" accent="text-amber-400" />
                    <StatCard label="Departments" value="—" icon="📚" accent="text-orange-400" />
                    <StatCard label="Pending Orgs" value="—" icon="⏳" accent="text-yellow-400" />
                    <StatCard label="Verified Students" value="—" icon="✅" accent="text-lime-400" />
                </div>

                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DarkActionCard to="#" icon="🏫" title="Manage Universities" description="Add, edit, or remove university records on the platform." disabled />
                    <DarkActionCard to="#" icon="📑" title="Manage Departments" description="Configure faculties and departments within your university." disabled />
                    <DarkActionCard to="/admin/org-approvals" icon="✅" title="Approve / Block Orgs" description="Review and approve organisations affiliated with your university." />
                    <DarkActionCard to="#" icon="📋" title="Student Verification Rules" description="Set email domain rules and eligibility criteria." disabled />
                    <DarkActionCard to="/module/assign-manager" icon="👨‍💼" title="Assign Module Managers" description="Assign MODULE_MANAGER roles for DS, SE, QA, BA, or PM modules." />
                    <DarkActionCard to="#" icon="📊" title="University Analytics" description="View stats: applications, placements, and success rates." disabled />
                </div>
            </div>
        </div>
    );
}
