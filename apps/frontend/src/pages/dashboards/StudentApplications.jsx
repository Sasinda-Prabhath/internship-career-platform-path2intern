import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

const STATUS_COLORS = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Shortlisted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get("/api/applications/mine");
        setApplications(res.data.applications || []);
      } catch (err) {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Loading your applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-4">📄</p>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-6">You haven't applied to any internships. Start browsing and apply today!</p>
          <Link to="/" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-2.5 transition-colors">
            Browse Internships
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="px-6 py-4">Role & Company</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Type</th>
                  <th className="px-6 py-4 hidden md:table-cell">Applied Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Suitability</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {app.job ? (
                        <>
                           <p className="font-semibold text-gray-900">{app.job.title}</p>
                           <p className="text-gray-500">{app.job.company}</p>
                        </>
                      ) : (
                        <p className="text-gray-400 italic">Job no longer available</p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {app.job ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-600">{app.job.type}</span>
                          <span className="text-xs text-gray-400">{app.job.workMode}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-800">{app.matchPercentage}% Match</span>
                            {app.missingSkills?.length > 0 ? (
                                <span className="text-[10px] text-red-500 font-medium">Missing: {app.missingSkills.join(", ")}</span>
                            ) : (
                                <span className="text-[10px] text-green-600 font-medium">Perfect Match!</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.job && (
                        <Link to={`/jobs/${app.job._id}`} className="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                          View Job
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
