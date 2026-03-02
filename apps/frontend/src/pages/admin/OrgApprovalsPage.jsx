import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const STATUS_CHIP = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ACTIVE: "bg-green-500/10  text-green-400  border-green-500/20",
    SUSPENDED: "bg-red-500/10   text-red-400   border-red-500/20",
};

export default function OrgApprovalsPage() {
    const { user } = useAuth();
    const [orgs, setOrgs] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [declineModal, setDeclineModal] = useState(null);
    const [declineNote, setDeclineNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchOrgs = async () => {
        setLoading(true); setError("");
        try {
            const endpoint = filter === "pending" ? "/api/org/pending" : "/api/org/all";
            const res = await api.get(endpoint);
            setOrgs(res.data.organizations || []);
        } catch (e) { setError(e.response?.data?.message || "Failed to load organizations"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrgs(); }, [filter]);

    const approve = async (org) => {
        setActionLoading(true);
        try { await api.patch(`/api/org/${org._id}/approve`); fetchOrgs(); }
        catch (e) { alert(e.response?.data?.message || "Failed to approve"); }
        finally { setActionLoading(false); }
    };

    const decline = async () => {
        setActionLoading(true);
        try { await api.patch(`/api/org/${declineModal._id}/decline`, { note: declineNote }); setDeclineModal(null); setDeclineNote(""); fetchOrgs(); }
        catch (e) { alert(e.response?.data?.message || "Failed to decline"); }
        finally { setActionLoading(false); }
    };

    const docUrl = (url) => url ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${url}` : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-6xl mx-auto">
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">Administration</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Organisation Approvals</h1>
                    <p className="text-gray-500 mt-1 text-sm">Review and approve organisation registration requests.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter tabs */}
                <div className="flex gap-2 mb-6">
                    {["pending", "all"].map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? "bg-amber-500 text-white shadow-sm" : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
                            {f === "pending" ? "⏳ Pending Review" : "📋 All Organisations"}
                        </button>
                    ))}
                </div>

                {loading && <div className="text-center py-16 text-slate-500">Loading…</div>}
                {error && <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                {!loading && orgs.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-5xl mb-3">🎉</p>
                        <p className="text-sm text-slate-500">{filter === "pending" ? "No pending applications." : "No organisations registered yet."}</p>
                    </div>
                )}

                {!loading && orgs.length > 0 && (
                    <div className="space-y-4">
                        {orgs.map((org) => (
                            <div key={org._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                                <div className="flex items-start gap-4 flex-wrap">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 font-bold text-lg flex items-center justify-center flex-shrink-0 border border-green-500/20">
                                        {(org.organizationName || org.name)?.[0]?.toUpperCase() || "O"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-white">{org.organizationName || "—"}</h3>
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_CHIP[org.status] || "bg-slate-800 text-slate-400 border-slate-700"}`}>{org.status}</span>
                                        </div>
                                        <p className="text-sm text-slate-400">Contact: {org.name}</p>
                                        <p className="text-sm text-slate-400">Email: {org.email}</p>
                                        <p className="text-xs text-slate-600 mt-1">Applied: {new Date(org.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                        {org.approvalNote && <p className="text-xs text-red-400 mt-1">Note: {org.approvalNote}</p>}
                                        {org.documentUrl ? (
                                            <a href={docUrl(org.documentUrl)} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2">
                                                📄 View Business Document
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-600 mt-2 block">No document uploaded</span>
                                        )}
                                    </div>
                                    {org.status === "PENDING" && (
                                        <div className="flex gap-2 flex-shrink-0 mt-1">
                                            <button onClick={() => approve(org)} disabled={actionLoading}
                                                className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors shadow-lg shadow-green-600/20">
                                                ✓ Approve
                                            </button>
                                            <button onClick={() => { setDeclineModal(org); setDeclineNote(""); }}
                                                className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-colors">
                                                ✗ Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Decline modal */}
            {declineModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-white text-lg mb-1">Decline Application</h3>
                        <p className="text-sm text-slate-400 mb-4">Declining <strong className="text-white">{declineModal.organizationName}</strong>. Optionally add a reason.</p>
                        <textarea rows={3} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Reason for declining (optional)…"
                            className="w-full border border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4" />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeclineModal(null)} className="border border-slate-600 text-slate-400 px-4 py-2 rounded-xl text-sm">Cancel</button>
                            <button onClick={decline} disabled={actionLoading} className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                                {actionLoading ? "Declining…" : "Decline"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
