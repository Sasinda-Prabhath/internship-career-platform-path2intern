import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Wraps a route with authentication + optional role guards.
 *
 * allowedRoles can include:
 *  - Global roles:  "SYSTEM_ADMIN" | "UNIVERSITY_ADMIN" | "RECRUITER" | "STUDENT"
 *  - Scoped roles:  "MODULE_MANAGER" | "MODULE_OPERATOR"
 */
export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const hasGlobalAccess = allowedRoles.includes(user.globalRole);

        // MODULE_MANAGER: user has at least one scoped role with role === "MODULE_MANAGER"
        const hasManagerAccess =
            allowedRoles.includes("MODULE_MANAGER") &&
            user.moduleScopedRoles?.some((r) => r.role === "MODULE_MANAGER");

        // MODULE_OPERATOR: user has at least one scoped role with role === "MODULE_OPERATOR"
        const hasOperatorAccess =
            allowedRoles.includes("MODULE_OPERATOR") &&
            user.moduleScopedRoles?.some((r) => r.role === "MODULE_OPERATOR");

        if (!hasGlobalAccess && !hasManagerAccess && !hasOperatorAccess) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                        <p className="text-gray-500 mb-6">
                            You don&apos;t have permission to view this page. Your role is{" "}
                            <span className="font-semibold text-gray-700">{user.globalRole}</span>.
                        </p>
                        <a
                            href="/"
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Home
                        </a>
                    </div>
                </div>
            );
        }
    }

    return children;
}
