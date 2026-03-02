import { useState, useEffect } from "react";
import {
    inviteStaff, listStaff, regenerateCode,
    updateStaff, updateStatus, deleteStaff,
} from "../../services/staffApi";

const MODULE_OPTIONS = [
    { code: "DS", label: "Data Science" },
    { code: "SE", label: "Software Engineering" },
    { code: "QA", label: "Quality Assurance" },
    { code: "BA", label: "Business Analysis" },
    { code: "PM", label: "Project Management" },
];

const ROLE_OPTIONS = [
    { value: "MODULE_MANAGER", label: "Module Manager" },
    { value: "MODULE_OPERATOR", label: "Module Operator" },
];

const STATUS_STYLES = {
    ACTIVE: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", label: "Active" },
    INVITED: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Invited" },
    SUSPENDED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Suspended" },
};

const inp = "w-full border border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition";

function ModuleChip({ code }) { return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 mr-1">{code}</span>; }

function CopyCodeBox({ code, expiresAt, onClose }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-amber-400">✅ Invite Created — share this code</p>
                <button onClick={onClose} className="text-amber-500 hover:text-amber-400 text-lg leading-none">×</button>
            </div>
            <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-mono tracking-widest font-bold text-amber-300 bg-slate-800 border border-amber-500/30 rounded-xl px-4 py-3 text-center">{code}</code>
                <button onClick={copy} className="px-4 py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors">{copied ? "Copied!" : "Copy"}</button>
            </div>
            <p className="text-xs text-amber-500/70 mt-2">Expires: {new Date(expiresAt).toLocaleString()}. Give this code to the staff member — they'll use it at <strong>/accept-invite</strong>.</p>
        </div>
    );
}

export default function StaffManagementPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [freshCode, setFreshCode] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [form, setForm] = useState({ name: "", email: "", staffRole: "MODULE_MANAGER", moduleScopes: [] });
    const [inviting, setInviting] = useState(false);
    const [formError, setFormError] = useState("");
    const [editing, setEditing] = useState(null);

    const fetchStaff = async () => { try { const res = await listStaff(); setStaff(res.data.staff || []); } catch { setStaff([]); } finally { setLoading(false); } };
    useEffect(() => { fetchStaff(); }, []);

    const toggleModule = (code) => setForm((f) => ({ ...f, moduleScopes: f.moduleScopes.includes(code) ? f.moduleScopes.filter((m) => m !== code) : [...f.moduleScopes, code] }));

    const handleInvite = async (e) => {
        e.preventDefault(); setFormError("");
        if (form.moduleScopes.length === 0) return setFormError("Select at least one module.");
        setInviting(true);
        try {
            const res = await inviteStaff(form);
            setFreshCode({ code: res.data.inviteCode, expiresAt: res.data.expiresAt });
            setForm({ name: "", email: "", staffRole: "MODULE_MANAGER", moduleScopes: [] }); fetchStaff();
        } catch (err) { setFormError(err.response?.data?.message || "Invite failed."); }
        finally { setInviting(false); }
    };

    const handleRegenerate = async (id) => {
        setActionLoading((p) => ({ ...p, [id]: "regen" }));
        try { const res = await regenerateCode(id); setFreshCode({ code: res.data.inviteCode, expiresAt: res.data.expiresAt }); }
        catch (err) { alert(err.response?.data?.message || "Failed."); }
        finally { setActionLoading((p) => ({ ...p, [id]: null })); }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        setActionLoading((p) => ({ ...p, [id]: "status" }));
        try { await updateStatus(id, newStatus); fetchStaff(); }
        catch (err) { alert(err.response?.data?.message || "Failed."); }
        finally { setActionLoading((p) => ({ ...p, [id]: null })); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
        setActionLoading((p) => ({ ...p, [id]: "delete" }));
        try { await deleteStaff(id); fetchStaff(); }
        catch (err) { alert(err.response?.data?.message || "Failed."); }
        finally { setActionLoading((p) => ({ ...p, [id]: null })); }
    };

    const handleSaveEdit = async () => {
        if (!editing || editing.moduleScopes.length === 0) return;
        setActionLoading((p) => ({ ...p, [editing.id]: "edit" }));
        try { await updateStaff(editing.id, { staffRole: editing.staffRole, moduleScopes: editing.moduleScopes }); setEditing(null); fetchStaff(); }
        catch (err) { alert(err.response?.data?.message || "Failed."); }
        finally { setActionLoading((p) => ({ ...p, [editing.id]: null })); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">Administration</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Staff Management</h1>
                    <p className="text-gray-500 mt-1 text-sm">Invite staff, assign module roles, and manage access.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {freshCode && <CopyCodeBox code={freshCode.code} expiresAt={freshCode.expiresAt} onClose={() => setFreshCode(null)} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Invite form */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:col-span-1">
                        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                            <span className="w-7 h-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold border border-amber-500/30">+</span>
                            Invite Staff
                        </h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
                                <input type="text" className={inp} placeholder="Jane Smith" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
                                <input type="email" className={inp} placeholder="jane@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                                <p className="text-xs text-slate-600 mt-1">Any email (gmail, outlook, etc.)</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Staff Role</label>
                                <select className={inp} value={form.staffRole} onChange={(e) => setForm((f) => ({ ...f, staffRole: e.target.value }))}>
                                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Module Scopes</label>
                                <div className="flex flex-wrap gap-2">
                                    {MODULE_OPTIONS.map((m) => (
                                        <button key={m.code} type="button" onClick={() => toggleModule(m.code)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${form.moduleScopes.includes(m.code) ? "bg-amber-500 border-amber-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500"}`}>
                                            {m.code}
                                        </button>
                                    ))}
                                </div>
                                {form.moduleScopes.length > 0 && (
                                    <p className="text-xs text-amber-400 mt-1.5">Selected: {form.moduleScopes.map(c => MODULE_OPTIONS.find(m => m.code === c)?.label).join(", ")}</p>
                                )}
                            </div>
                            {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{formError}</p>}
                            <button type="submit" disabled={inviting}
                                className="w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {inviting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {inviting ? "Creating invite..." : "Generate Invite Code"}
                            </button>
                        </form>
                    </div>

                    {/* ── Staff table */}
                    <div className="bg-white border border-gray-200 rounded-2xl lg:col-span-2 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">All Staff</h2>
                            <span className="text-xs bg-slate-800 text-slate-400 font-medium px-2.5 py-1 rounded-full border border-slate-700">{staff.length}</span>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
                        ) : staff.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">No staff yet. Use the form to invite your first staff member.</div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {staff.map((s) => {
                                    const sc = STATUS_STYLES[s.status] || {};
                                    const busy = !!actionLoading[s._id];
                                    return (
                                        <div key={s._id} className="px-5 py-4 hover:bg-slate-800/40 transition-colors">
                                            {editing?.id === s._id ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-semibold text-sm text-white">{s.name}</p>
                                                        <p className="text-xs text-slate-400">{s.email}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <select className="border border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-slate-800 text-white focus:ring-1 focus:ring-purple-400 focus:outline-none" value={editing.staffRole} onChange={(e) => setEditing((ed) => ({ ...ed, staffRole: e.target.value }))}>
                                                            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                        </select>
                                                        {MODULE_OPTIONS.map((m) => (
                                                            <button key={m.code} type="button" onClick={() => setEditing((ed) => ({ ...ed, moduleScopes: ed.moduleScopes.includes(m.code) ? ed.moduleScopes.filter((x) => x !== m.code) : [...ed.moduleScopes, m.code] }))}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${editing.moduleScopes.includes(m.code) ? "bg-purple-600 border-purple-600 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                                                                {m.code}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleSaveEdit} disabled={busy} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50">{actionLoading[s._id] === "edit" ? "Saving..." : "Save"}</button>
                                                        <button onClick={() => setEditing(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 text-xs font-semibold rounded-lg hover:bg-slate-600">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{s.name?.charAt(0)?.toUpperCase()}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>{sc.label}</span>
                                                            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/20 font-medium px-2 py-0.5 rounded-full">{s.staffRole === "MODULE_MANAGER" ? "Manager" : "Operator"}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{s.email}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1.5">{(s.moduleScopes || []).map((m) => <ModuleChip key={m} code={m} />)}</div>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <button onClick={() => setEditing({ id: s._id, staffRole: s.staffRole, moduleScopes: [...(s.moduleScopes || [])] })} disabled={busy} title="Edit" className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-40">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        {s.status === "INVITED" && (
                                                            <button onClick={() => handleRegenerate(s._id)} disabled={busy} title="Regenerate code" className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40">
                                                                {actionLoading[s._id] === "regen" ? <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin block" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                                                            </button>
                                                        )}
                                                        {s.status !== "INVITED" && (
                                                            <button onClick={() => handleStatusToggle(s._id, s.status)} disabled={busy} title={s.status === "SUSPENDED" ? "Reactivate" : "Suspend"} className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${s.status === "SUSPENDED" ? "text-slate-500 hover:text-green-400 hover:bg-green-500/10" : "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"}`}>
                                                                {actionLoading[s._id] === "status" ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin block" /> : s.status === "SUSPENDED" ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(s._id, s.name)} disabled={busy} title="Remove" className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                                                            {actionLoading[s._id] === "delete" ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
