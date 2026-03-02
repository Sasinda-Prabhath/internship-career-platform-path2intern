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

const ProgressBar = ({ label, value, color }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>{label}</span>
            <span className="font-semibold text-white">{value}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

const DarkActionCard = ({ to, icon, title, description, disabled }) => (
    <Link
        to={disabled ? "#" : to}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-blue-300 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-lg"
            }`}
    >
        <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
    </Link>
);

export default function StudentDashboard() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider">
                        Student
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">
                        Welcome, {user?.name?.split(" ")[0] || "Student"}! 🎓
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Track your applications, learn new skills, and land your dream internship.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Applications Sent" value="0" icon="📨" accent="text-blue-400" />
                    <StatCard label="Shortlisted" value="0" icon="⭐" accent="text-indigo-400" />
                    <StatCard label="Quizzes Done" value="0" icon="🧠" accent="text-violet-400" />
                    <StatCard label="Modules Progress" value="0%" icon="📈" accent="text-purple-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action cards */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <DarkActionCard to="/" icon="🔍" title="Browse Internships" description="Explore the latest internship opportunities from verified companies." />
                                <DarkActionCard to="/quiz" icon="🧠" title="Take a Quiz" description="Test your knowledge across your module areas." />
                                <DarkActionCard to="#" icon="📝" title="My Applications" description="Track all internship applications you've submitted." disabled />
                                <DarkActionCard to="#" icon="👤" title="Update Profile" description="Keep your profile and resume up to date for recruiters." disabled />
                            </div>
                        </div>
                    </div>

                    {/* Module progress */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Module Progress</h2>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5">
                            <ProgressBar label="Software Engineering (SE)" value={45} color="bg-blue-500" />
                            <ProgressBar label="Data Science (DS)" value={30} color="bg-violet-500" />
                            <ProgressBar label="Quality Assurance (QA)" value={20} color="bg-indigo-500" />
                            <ProgressBar label="Business Analysis (BA)" value={10} color="bg-purple-500" />
                            <ProgressBar label="Project Management (PM)" value={0} color="bg-pink-500" />
                            <Link to="/quiz"
                                className="block text-center text-xs text-blue-400 hover:text-blue-300 mt-4 transition-colors">
                                Start a Quiz to improve →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
