import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import JobDetailPage from "./pages/JobDetailPage";

// Role dashboards
import SystemAdminDashboard from "./pages/dashboards/SystemAdminDashboard";
import UniversityAdminDashboard from "./pages/dashboards/UniversityAdminDashboard";
import RecruiterDashboard from "./pages/dashboards/RecruiterDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import ModuleManagerDashboard from "./pages/dashboards/ModuleManagerDashboard";
import ModuleOperatorDashboard from "./pages/dashboards/ModuleOperatorDashboard";

// Module feature pages
import AssignRolePage from "./pages/module/AssignRolePage";
import SubmitQuestionPage from "./pages/module/SubmitQuestionPage";
import ReviewQueuePage from "./pages/module/ReviewQueuePage";
import QuestionBankPage from "./pages/module/QuestionBankPage";

// Student pages
import QuizPage from "./pages/quiz/QuizPage";

// University Admin pages
import StaffManagementPage from "./pages/staff/StaffManagementPage";
import OrgApprovalsPage from "./pages/admin/OrgApprovalsPage";
import ContactsPage from "./pages/admin/ContactsPage";

// Organisation pages
import PostJobPage from "./pages/org/PostJobPage";
import ManageApplicantsPage from "./pages/org/ManageApplicantsPage";

/** Wraps a page with auth guard + left sidebar */
function DashboardRoute({ allowedRoles, children }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0f1e] font-sans text-gray-900 flex flex-col">

        <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/job/:jobId" element={<JobDetailPage />} />

          {/* Staff invite acceptance — public, no sidebar */}
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          {/* Job detail — public */}
          <Route path="/job/:jobId" element={<JobDetailPage />} />

          {/* Profile — auth only, no sidebar */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ── Role Dashboards ─────────────────────────────────── */}
          <Route path="/dashboard/system-admin" element={<DashboardRoute allowedRoles={["SYSTEM_ADMIN"]}><SystemAdminDashboard /></DashboardRoute>} />
          <Route path="/dashboard/university-admin" element={<DashboardRoute allowedRoles={["UNIVERSITY_ADMIN"]}><UniversityAdminDashboard /></DashboardRoute>} />
          <Route path="/dashboard/recruiter" element={<DashboardRoute allowedRoles={["ORGANIZATION", "RECRUITER"]}><RecruiterDashboard /></DashboardRoute>} />
          <Route path="/dashboard/student" element={<DashboardRoute allowedRoles={["STUDENT"]}><StudentDashboard /></DashboardRoute>} />
          <Route path="/dashboard/module-manager" element={<DashboardRoute allowedRoles={["MODULE_MANAGER"]}><ModuleManagerDashboard /></DashboardRoute>} />
          <Route path="/dashboard/module-operator" element={<DashboardRoute allowedRoles={["MODULE_OPERATOR"]}><ModuleOperatorDashboard /></DashboardRoute>} />

          {/* ── University Admin Pages ───────────────────────────── */}
          <Route
            path="/staff-management"
            element={
              <DashboardRoute allowedRoles={["UNIVERSITY_ADMIN", "SYSTEM_ADMIN"]}>
                <StaffManagementPage />
              </DashboardRoute>
            }
          />

          {/* ── Module Feature Pages ─────────────────────────────── */}
          <Route path="/module/assign-manager" element={<DashboardRoute allowedRoles={["UNIVERSITY_ADMIN", "SYSTEM_ADMIN"]}><AssignRolePage mode="manager" /></DashboardRoute>} />
          <Route path="/module/assign-operator" element={<DashboardRoute allowedRoles={["MODULE_MANAGER"]}><AssignRolePage mode="operator" /></DashboardRoute>} />
          <Route path="/module/submit-question" element={<DashboardRoute allowedRoles={["MODULE_MANAGER", "MODULE_OPERATOR"]}><SubmitQuestionPage /></DashboardRoute>} />
          <Route path="/module/review" element={<DashboardRoute allowedRoles={["MODULE_MANAGER"]}><ReviewQueuePage /></DashboardRoute>} />
          <Route path="/module/question-bank" element={<DashboardRoute allowedRoles={["MODULE_MANAGER", "MODULE_OPERATOR"]}><QuestionBankPage /></DashboardRoute>} />
          <Route path="/quiz" element={<DashboardRoute allowedRoles={["STUDENT"]}><QuizPage /></DashboardRoute>} />
          <Route path="/org/post-job" element={<DashboardRoute allowedRoles={["ORGANIZATION", "RECRUITER"]}><PostJobPage /></DashboardRoute>} />
          <Route path="/org/applicants/:jobId" element={<DashboardRoute allowedRoles={["ORGANIZATION", "RECRUITER"]}><ManageApplicantsPage /></DashboardRoute>} />
          <Route path="/admin/org-approvals" element={<DashboardRoute allowedRoles={["UNIVERSITY_ADMIN", "SYSTEM_ADMIN"]}><OrgApprovalsPage /></DashboardRoute>} />
          <Route path="/admin/contacts" element={<DashboardRoute allowedRoles={["SYSTEM_ADMIN"]}><ContactsPage /></DashboardRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;