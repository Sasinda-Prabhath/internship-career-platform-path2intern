/**
 * Returns the correct dashboard route for a user.
 * Priority: MODULE_MANAGER > MODULE_OPERATOR > global role
 */
export const getDashboardRoute = (globalRole, moduleScopedRoles = []) => {
    if (moduleScopedRoles && moduleScopedRoles.length > 0) {
        const hasManager = moduleScopedRoles.some((r) => r.role === "MODULE_MANAGER");
        const hasOperator = moduleScopedRoles.some((r) => r.role === "MODULE_OPERATOR");
        if (hasManager) return "/dashboard/module-manager";
        if (hasOperator) return "/dashboard/module-operator";
    }
    switch (globalRole) {
        case "SYSTEM_ADMIN": return "/dashboard/system-admin";
        case "UNIVERSITY_ADMIN": return "/dashboard/university-admin";
        case "RECRUITER":
        case "ORGANIZATION": return "/dashboard/recruiter";
        case "STUDENT": return "/dashboard/student";
        default: return "/";
    }
};

/** Human-readable role label for the navbar badge */
export const getRoleLabel = (globalRole, moduleScopedRoles = []) => {
    if (moduleScopedRoles && moduleScopedRoles.length > 0) {
        const hasManager = moduleScopedRoles.some((r) => r.role === "MODULE_MANAGER");
        const hasOperator = moduleScopedRoles.some((r) => r.role === "MODULE_OPERATOR");
        const modules = moduleScopedRoles.map((r) => r.module).join(", ");
        if (hasManager) return `Module Manager (${modules})`;
        if (hasOperator) return `Module Operator (${modules})`;
    }
    switch (globalRole) {
        case "SYSTEM_ADMIN": return "System Admin";
        case "UNIVERSITY_ADMIN": return "University Admin";
        case "RECRUITER": return "Recruiter";
        case "ORGANIZATION": return "Organisation";
        case "STUDENT": return "Student";
        default: return "User";
    }
};

/** Tailwind bg + text class pair for the role badge chip */
export const getRoleBadgeColors = (globalRole, moduleScopedRoles = []) => {
    if (moduleScopedRoles && moduleScopedRoles.length > 0) {
        const hasManager = moduleScopedRoles.some((r) => r.role === "MODULE_MANAGER");
        if (hasManager) return { bg: "bg-purple-100", text: "text-purple-700" };
        return { bg: "bg-violet-100", text: "text-violet-700" }; // operator
    }
    switch (globalRole) {
        case "SYSTEM_ADMIN": return { bg: "bg-red-100", text: "text-red-700" };
        case "UNIVERSITY_ADMIN": return { bg: "bg-amber-100", text: "text-amber-700" };
        case "RECRUITER":
        case "ORGANIZATION": return { bg: "bg-green-100", text: "text-green-700" };
        case "STUDENT": return { bg: "bg-blue-100", text: "text-blue-700" };
        default: return { bg: "bg-gray-100", text: "text-gray-700" };
    }
};
