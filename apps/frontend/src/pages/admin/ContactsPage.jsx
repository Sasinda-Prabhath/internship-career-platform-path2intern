import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const STATUS_CHIP = {
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    REPLIED: "bg-green-500/20 text-green-400 border-green-500/30",
    UNREPLIED: "bg-slate-700 text-slate-400 border-slate-600",
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [replyModal, setReplyModal] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchContacts = async () => {
        setLoading(true); setError("");
        try {
            const res = await api.get("/api/contact");
            setContacts(res.data.contacts || []);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load messages");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchContacts(); }, []);

    const sendReply = async () => {
        if (!replyText.trim()) return;
        setReplyLoading(true);
        try {
            await api.post(`/api/contact/${replyModal._id}/reply`, { replyText });
            setReplyModal(null); setReplyText("");
            fetchContacts();
        } catch (e) { alert(e.response?.data?.message || "Failed to send reply"); }
        finally { setReplyLoading(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/contact/${deleteId}`);
            setContacts((cs) => cs.filter((c) => c._id !== deleteId));
            setDeleteId(null);
        } catch (e) { alert(e.response?.data?.message || "Failed to delete"); }
        finally { setDeleting(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-8 py-8">
                <div className="max-w-5xl mx-auto">
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-500/30">System Admin</span>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">Contact Messages</h1>
                    <p className="text-gray-500 mt-1 text-sm">View and reply to messages from the contact form. Replies are sent via email.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading && <div className="text-center py-16 text-slate-500">Loading…</div>}
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                {!loading && contacts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-5xl mb-3">📭</p>
                        <p className="text-slate-500 text-sm">No contact messages yet.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {contacts.map((c) => (
                        <div key={c._id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-semibold text-white">{c.name}</h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${c.replied ? STATUS_CHIP.REPLIED : STATUS_CHIP.UNREPLIED}`}>
                                            {c.replied ? "✓ Replied" : "Unreplied"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">{c.email}</p>
                                    <p className="text-sm font-medium text-blue-400 mt-2">{c.subject}</p>
                                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{c.message}</p>
                                    {c.replied && c.replyText && (
                                        <div className="mt-3 pl-3 border-l-2 border-green-500/40">
                                            <p className="text-xs text-slate-400 mb-1">Your reply:</p>
                                            <p className="text-sm text-slate-300">{c.replyText}</p>
                                            <p className="text-xs text-slate-500 mt-1">{c.repliedAt ? new Date(c.repliedAt).toLocaleString() : ""}</p>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 mt-2">{new Date(c.createdAt).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                    {!c.replied && (
                                        <button onClick={() => { setReplyModal(c); setReplyText(""); }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                                            Reply
                                        </button>
                                    )}
                                    <button onClick={() => setDeleteId(c._id)}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/20 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reply modal */}
            {replyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="font-bold text-white text-lg mb-1">Reply to {replyModal.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">Subject: {replyModal.subject}</p>
                        <textarea rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply here…"
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4 placeholder-slate-500" />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setReplyModal(null)} className="border border-slate-600 text-slate-400 px-4 py-2 rounded-xl text-sm hover:bg-slate-800">Cancel</button>
                            <button onClick={sendReply} disabled={replyLoading || !replyText.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors">
                                {replyLoading ? "Sending…" : "Send Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <div className="text-4xl mb-3">🗑️</div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Message?</h3>
                        <p className="text-sm text-slate-400 mb-6">This will permanently remove the contact message.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteId(null)} className="border border-slate-600 text-slate-400 px-5 py-2 rounded-xl text-sm">Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60">
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
