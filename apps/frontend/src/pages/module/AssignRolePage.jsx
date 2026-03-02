import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { assignManager, assignOperator, removeRole, listRoles } from "../../services/moduleApi";

const MODULE_OPTIONS = [
    { code: "DS", label: "Data Science" },
    { code: "SE", label: "Software Engineering" },
    { code: "QA", label: "Quality Assurance" },
    { code: "BA", label: "Business Analysis" },
    { code: "PM", label: "Project Management" },
];

const ROLE_COLORS = {
    MODULE_MANAGER: { badge: "bg-purple-500/20 text-purple-400 border-purple-500/20", label: "Manager" },
    MODULE_OPERATOR: { badge: "bg-violet-500/20 text-violet-400 border-violet-500/20", label: "Operator" },
};

const inp = "w-full border border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

export default function AssignRolePage({ mode = "manager" }) {
    const { user } = useAuth();
    const isManagerMode = mode === "manager";
    const heading = isManagerMode ? "Assign Module Managers" : "Assign Module Operators";
    const roleLabel = isManagerMode ? "Module Manager" : "Module Operator";
    const accentBadge = isManagerMode ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30";

    const ownModules = isManagerMode
        ? MODULE_OPTIONS
        : MODULE_OPTIONS.filter((m) => user?.moduleScopedRoles?.some((r) => r.module === m.code && r.role === "MODULE_MANAGER"));

    const [selectedModule, setSelectedModule] = useState(ownModules[0]?.code || "");
    const [email, setEmail] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignMessage, setAssignMessage] = useState(null);
    const [roleList, setRoleList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const fetchRoles = useCallback(async () => {
        if (!selectedModule) return;
        setListLoading(true);
        try { const res = await listRoles(selectedModule); setRoleList(res.data.roles || []); }
        catch { setRoleList([]); }
        finally { setListLoading(false); }
    }, [selectedModule]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const handleAssign = async (e) => {
        e.preventDefault(); setAssignMessage(null); setAssigning(true);
        try {
            const fn = isManagerMode ? assignManager : assignOperator;
            const res = await fn(email, selectedModule);
            setAssignMessage({ type: "success", text: res.data.message }); setEmail(""); fetchRoles();
        } catch (err) { setAssignMessage({ type: "error", text: err.response?.data?.message || "Assignment failed." }); }
        finally { setAssigning(false); }
    };

    const handleRemove = async (targetEmail, targetModule) => {
        const key = `${targetEmail}-${targetModule}`;
        setRemovingId(key);
        try { await removeRole(targetEmail, targetModule); fetchRoles(); }
        catch (err) { alert(err.response?.data?.message || "Could not remove role."); }
        finally { setRemovingId(null); }
    };

    const filteredRoles = isManagerMode
        ? roleList.filter((r) => r.role === "MODULE_MANAGER")
        : roleList.filter((r) => r.role === "MODULE_OPERATOR");

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${accentBadge}`}>{isManagerMode ? "University Admin" : "Module Manager"}</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">{heading}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{isManagerMode ? "Assign Module Managers to oversee content and operators for each module." : "Add Module Operators who can submit MCQs for your module's question bank."}</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment form */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-white mb-5">Assign a {roleLabel}</h2>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Module</label>
                            <select className={inp} value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} required>
                                {ownModules.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">User Email</label>
                            <input type="email" className={inp} placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        {assignMessage && (
                            <div className={`rounded-xl px-3 py-2.5 text-sm font-medium border ${assignMessage.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                {assignMessage.text}
                            </div>
                        )}
                        <button type="submit" disabled={assigning || ownModules.length === 0}
                            className="w-full py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
                            {assigning && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {assigning ? "Assigning..." : `Assign as ${roleLabel}`}
                        </button>
                    </form>
                </div>

                {/* Current role holders */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-white">Current {roleLabel}s</h2>
                        <span className="text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full">{filteredRoles.length} assigned</span>
                    </div>

                    {listLoading ? (
                        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : filteredRoles.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">No {roleLabel.toLowerCase()}s assigned to this module yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRoles.map((r) => {
                                const rc = ROLE_COLORS[r.role] || {};
                                const key = `${r.user?.email}-${r.module}`;
                                return (
                                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {r.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{r.user?.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{r.user?.email}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 border ${rc.badge}`}>{rc.label}</span>
                                        <button onClick={() => handleRemove(r.user?.email, r.module)} disabled={removingId === key} title="Remove role"
                                            className="ml-1 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                                            {removingId === key ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin block" />
                                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
