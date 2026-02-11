import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const getDashboardPath = () => {
    if (user?.role === "SYSTEM_ADMIN") return "/dashboard/admin";
    if (user?.role === "STUDENT") return "/dashboard/student";
    if (user?.role === "ORGANIZATION") return "/dashboard/org";
    return "/dashboard";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800">
        <div className="p-4">
          <Link to="/" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
            Path2Intern
          </Link>
          <p className="text-sm text-slate-400 mt-1">{user?.role}</p>
        </div>

        <nav className="px-4 space-y-2">
          <Link
            to={getDashboardPath()}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive(getDashboardPath())
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/profile"
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive("/dashboard/profile")
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            Profile
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
