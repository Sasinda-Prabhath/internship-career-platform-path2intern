import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPendingOrgs();
  }, []);

  const fetchPendingOrgs = async () => {
    try {
      const response = await fetch("/api/auth/pending-orgs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingOrgs(data.organizations);
      } else {
        setMessage("Failed to fetch pending organizations");
      }
    } catch (error) {
      console.error("Fetch pending orgs error:", error);
      setMessage("Error fetching pending organizations");
    } finally {
      setLoading(false);
    }
  };

  const approveOrg = async (orgId) => {
    try {
      const response = await fetch(`/api/auth/approve-org/${orgId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setMessage("Organization approved successfully");
        setPendingOrgs(pendingOrgs.filter(org => org._id !== orgId));
      } else {
        const error = await response.json();
        setMessage(error.message);
      }
    } catch (error) {
      console.error("Approve org error:", error);
      setMessage("Error approving organization");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p className="text-slate-300">Manage users, verify organizations, monitor system.</p>
      </div>

      {message && (
        <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200">
          {message}
        </div>
      )}

      <div className="bg-slate-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Pending Organization Approvals</h3>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : pendingOrgs.length === 0 ? (
          <p className="text-slate-400">No pending organizations</p>
        ) : (
          <div className="space-y-3">
            {pendingOrgs.map((org) => (
              <div key={org._id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div>
                  <h4 className="font-medium">{org.name}</h4>
                  <p className="text-sm text-slate-400">{org.email}</p>
                </div>
                <button
                  onClick={() => approveOrg(org._id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
