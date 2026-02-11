import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-white">
          Path2Intern
        </Link>

        {!user && (
          <nav className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-white"
            >
              Sign Up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
