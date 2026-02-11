import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === "ORGANIZATION" && user.status !== "ACTIVE") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-slate-400">Your organization account is pending admin approval. Please check back later.</p>
        </div>
      </div>
    );
  }

  return children;
}