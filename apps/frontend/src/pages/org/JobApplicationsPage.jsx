import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../services/api";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Shortlisted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function JobApplicationsPage() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppsAndJob = async () => {
      try {
        const [appRes, jobRes] = await Promise.all([
          api.get(`/api/applications/job/${id}`),
          api.get(`/api/jobs/${id}`) // This works because GET /api/jobs/:id is public
        ]);
        setApplications(appRes.data.applications || []);
        setJob(jobRes.data.job);
      } catch (err) {
        console.error("Failed to load applicants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppsAndJob();
  }, [id]);

  const updateStatus = async (appId, newStatus) => {
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      setApplications(apps => apps.map(a => a._id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Loading applicants...</div>;

  if (!job) return <div className="p-8 text-gray-500">Job not found or access denied.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
        <Link to="/dashboard/recruiter" className="hover:text-blue-600 transition-colors">← Back to Dashboard</Link>
        <span>/</span>
        <span>Applicants for {job.title}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">{job.title} - Applicants</h2>
           <p className="text-gray-500 mt-1">{applications.length} total application(s)</p>
        </div>
        <Link to={`/jobs/${job._id}`} target="_blank" className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors font-medium text-center">
            View Job Posting ↗
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-4">📭</p>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No applicants yet</h3>
          <p className="text-gray-500">When students apply, they will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="px-6 py-4">Applicant Detail</th>
                  <th className="px-6 py-4">Suitability & CV</th>
                  <th className="px-6 py-4 hidden md:table-cell">Applied On</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Update Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {app.applicant ? (
                        <>
                           <p className="font-bold text-gray-900">{app.applicant.name}</p>
                           <p className="text-gray-500">{app.applicant.email}</p>
                        </>
                      ) : (
                        <p className="text-gray-400 italic">User account removed</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm font-bold text-gray-800">{app.matchPercentage}% Match</span>
                            {app.missingSkills?.length > 0 ? (
                                <span className="text-[10px] text-red-500 font-medium max-w-[150px] truncate" title={app.missingSkills.join(", ")}>Missing: {app.missingSkills.join(", ")}</span>
                            ) : (
                                <span className="text-[10px] text-green-600 font-medium">Perfect Match!</span>
                            )}
                            {app.resumeUrl && (
                                <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/resumes/${app.resumeUrl}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                                    📄 View CV
                                </a>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <select 
                          value={app.status}
                          onChange={(e) => updateStatus(app._id, e.target.value)}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm cursor-pointer hover:border-blue-300 transition-colors"
                       >
                           <option value="Pending">Pending</option>
                           <option value="Shortlisted">Shortlisted</option>
                           <option value="Rejected">Rejected</option>
                       </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
