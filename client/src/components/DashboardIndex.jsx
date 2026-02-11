import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardIndex() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "SYSTEM_ADMIN") {
    return <Navigate to="/dashboard/admin" replace />;
  } else if (user.role === "STUDENT") {
    return <Navigate to="/dashboard/student" replace />;
  } else if (user.role === "ORGANIZATION") {
    return <Navigate to="/dashboard/org" replace />;
  }

  return <Navigate to="/dashboard/student" replace />;
}