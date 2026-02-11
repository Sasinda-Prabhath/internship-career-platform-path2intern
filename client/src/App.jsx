import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardIndex from "./components/DashboardIndex";

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import StudentDashboard from "./pages/dashboards/StudentDashboard";
import OrgDashboard from "./pages/dashboards/OrgDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Dashboards */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="student" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="org" element={<ProtectedRoute allowedRoles={["ORGANIZATION"]}><OrgDashboard /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute allowedRoles={["SYSTEM_ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route index element={<DashboardIndex />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
