import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <Link to="/" className="text-sm text-slate-300 hover:text-white">
          ← Back to Home
        </Link>
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
