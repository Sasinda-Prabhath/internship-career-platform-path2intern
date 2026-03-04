import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

const STATUS_STYLES = {
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Accepted: "bg-green-50 text-green-700 border border-green-200",
    Rejected: "bg-red-50 text-red-600 border border-red-200",
};

const WORK_MODE_COLORS = {
    Remote: "bg-green-100 text-green-700 border-green-200",
    Hybrid: "bg-blue-100 text-blue-700 border-blue-200",
    "On-site": "bg-amber-100 text-amber-700 border-amber-200",
};

const TYPE_COLORS = {
    Internship: "bg-purple-100 text-purple-700 border-purple-200",
    "Part-time": "bg-cyan-100 text-cyan-700 border-cyan-200",
    "Full-time": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function JobDetailPage() {
    const { jobId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [application, setApplication] = useState(null);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [form, setForm] = useState({ coverLetter: "", cv: null });
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await api.get(`/api/jobs/${jobId}`);
                setJob(res.data);
            } catch (e) {
                setError("Job not found");
            } finally {
                setLoading(false);
            }
        };

        const fetchMyApplication = async () => {
            if (user?.globalRole === "STUDENT") {
                try {
                    const res = await api.get("/api/applications/mine");
                    const myApp = res.data.applications.find(app => app.jobId._id === jobId);
                    setApplication(myApp);
                } catch (e) {
                    // Ignore errors
                }
            }
        };

        fetchJob();
        if (user) fetchMyApplication();
    }, [jobId, user]);

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("coverLetter", form.coverLetter);
            if (form.cv) formData.append("cv", form.cv);

            await api.post(`/api/jobs/${jobId}/apply`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Refresh application status
            const res = await api.get("/api/applications/mine");
            const myApp = res.data.applications.find(app => app.jobId._id === jobId);
            setApplication(myApp);
            setShowApplyForm(false);
            setForm({ coverLetter: "", cv: null });
        } catch (e) {
            setError(e.response?.data?.message || "Failed to apply");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-4xl mb-4">📭</p>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
                    <p className="text-gray-500 mb-6">This job posting may have been removed or doesn't exist.</p>
                    <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                        Browse Other Jobs
                    </Link>
                </div>
            </div>
        );
    }

    const isStudent = user?.globalRole === "STUDENT";
    const hasApplied = !!application;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-4xl mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
                        ← Back to Browse
                    </Link>
                    <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${job.company ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {job.company?.[0]?.toUpperCase() || "J"}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
                            <p className="text-lg text-gray-600 mb-2">{job.company}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-sm px-3 py-1 rounded-full font-medium border ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                    {job.type}
                                </span>
                                <span className={`text-sm px-3 py-1 rounded-full font-medium border ${WORK_MODE_COLORS[job.workMode] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                    {job.workMode}
                                </span>
                                <span className="text-sm text-gray-500">📍 {job.location}</span>
                                {job.salaryDisplay && <span className="text-sm text-emerald-700 font-semibold">💰 {job.salaryDisplay}</span>}
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            {isStudent && !hasApplied && (
                                <button
                                    onClick={() => setShowApplyForm(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                                >
                                    Apply Now
                                </button>
                            )}
                            {hasApplied && (
                                <div className="text-center">
                                    <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${STATUS_STYLES[application.status]}`}>
                                        {application.status}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job description */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Job Description</h2>
                            <div className="prose prose-sm max-w-none text-gray-700">
                                {job.description.split('\n').map((line, i) => (
                                    <p key={i} className="mb-3">{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        {job.requirements && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
                                <div className="prose prose-sm max-w-none text-gray-700">
                                    {job.requirements.split('\n').map((line, i) => (
                                        <p key={i} className="mb-3">{line}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {job.skills?.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map(skill => (
                                        <span key={skill} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Job details */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Job Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-medium">{job.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Work Mode</span>
                                    <span className="font-medium">{job.workMode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-medium">{job.location}</span>
                                </div>
                                {job.duration && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Duration</span>
                                        <span className="font-medium">{job.duration}</span>
                                    </div>
                                )}
                                {job.salaryDisplay && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Salary</span>
                                        <span className="font-medium text-emerald-700">{job.salaryDisplay}</span>
                                    </div>
                                )}
                                {job.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Deadline</span>
                                        <span className="font-medium">{new Date(job.deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Posted</span>
                                    <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Company info */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">About {job.company}</h3>
                            <p className="text-sm text-gray-600">
                                This position is posted by {job.postedBy?.name || "the organization"}.
                                {job.postedBy?.organizationName && ` Part of ${job.postedBy.organizationName}.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply modal */}
            {showApplyForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Apply for {job.title}</h3>
                            <button onClick={() => setShowApplyForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Letter (Optional)</label>
                                <textarea
                                    value={form.coverLetter}
                                    onChange={(e) => setForm(f => ({ ...f, coverLetter: e.target.value }))}
                                    rows={4}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tell us why you're interested in this position..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">CV / Resume</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setForm(f => ({ ...f, cv: e.target.files[0] }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (max 5MB)</p>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowApplyForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={applying} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                                    {applying ? "Applying..." : "Submit Application"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}