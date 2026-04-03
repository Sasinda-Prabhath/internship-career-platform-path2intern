import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../services/api";

const statusClasses = {
    submitted:   "bg-amber-50 text-amber-700 border-amber-200",
    shortlisted: "bg-green-50 text-green-700 border-green-200",
    rejected:    "bg-red-50 text-red-700 border-red-200",
};

const statusLabels = {
    submitted:   "Pending Review",
    shortlisted: "Shortlisted",
    rejected:    "Rejected",
};

const actionButtonClasses = {
    shortlisted: "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    rejected: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    submitted: "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
};

const FilterStatCard = ({ label, value, sub, active, onClick }) => (
    <button
        onClick={onClick}
        className={`bg-white border rounded-2xl p-5 text-left w-full transition-all ${
            active ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
        }`}
    >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </button>
);

export default function ReviewApplicationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState("");
    const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "all");

    useEffect(() => {
        const loadApplications = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/api/jobs/applications/received");
                setApplications(response.data.applications || []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load applications.");
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    useEffect(() => {
        const nextFilter = searchParams.get("filter") || "all";
        setActiveFilter(nextFilter);
    }, [searchParams]);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        if (filter === "all") setSearchParams({});
        else setSearchParams({ filter });
    };

    const updateStatus = async (applicationId, status) => {
        setSavingId(applicationId);
        setError("");
        try {
            const response = await api.patch(`/api/jobs/applications/${applicationId}/status`, { status });
            const updatedApplication = response.data.application;
            setApplications((current) => current.map((application) => (
                application._id === applicationId ? updatedApplication : application
            )));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update application status.");
        } finally {
            setSavingId("");
        }
    };

    const submitted   = applications.filter((a) => a.status === "submitted");
    const shortlisted = applications.filter((a) => a.status === "shortlisted");
    const rejected    = applications.filter((a) => a.status === "rejected");

    const filtered =
        activeFilter === "shortlisted" ? shortlisted :
        activeFilter === "submitted"   ? submitted :
        activeFilter === "rejected"    ? rejected :
        applications;

    const isShortlistMode = activeFilter === "shortlisted";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                        Organisation
                    </span>
                    {isShortlistMode ? (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2">Shortlisted Candidates</h1>
                            <p className="text-gray-500 mt-1 text-sm">Candidates you have shortlisted across all your internship listings.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900 mt-2">Review Applications</h1>
                            <p className="text-gray-500 mt-1 text-sm">Download student CVs and review everyone who applied to your internship listings.</p>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FilterStatCard label="All Applications" value={loading ? "—" : applications.length} sub="Across all listings" active={activeFilter === "all"} onClick={() => handleFilterChange("all")} />
                    <FilterStatCard label="Awaiting Review" value={loading ? "—" : submitted.length} sub="New submissions" active={activeFilter === "submitted"} onClick={() => handleFilterChange("submitted")} />
                    <FilterStatCard label="Shortlisted" value={loading ? "—" : shortlisted.length} sub="Ready for follow-up" active={activeFilter === "shortlisted"} onClick={() => handleFilterChange("shortlisted")} />
                    <FilterStatCard label="Rejected" value={loading ? "—" : rejected.length} sub="Not progressed" active={activeFilter === "rejected"} onClick={() => handleFilterChange("rejected")} />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">{error}</div>}

                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {activeFilter === "all"         ? "All Student Applications" :
                                 activeFilter === "submitted"   ? "Awaiting Review" :
                                 activeFilter === "shortlisted" ? "Shortlisted Candidates" :
                                                                  "Not Progressed"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "application" : "applications"}`}
                                {!loading && activeFilter !== "all" && " · click a stat card above to change filter"}
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="animate-pulse border border-gray-100 rounded-2xl p-5">
                                    <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                                    <div className="h-3 bg-gray-100 rounded w-2/5 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-3/5" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="py-20 text-center px-6">
                            <p className="text-5xl mb-3">{activeFilter === "shortlisted" ? "⭐" : "📭"}</p>
                            <p className="text-base font-semibold text-gray-900">
                                {activeFilter === "shortlisted" ? "No shortlisted candidates yet" : "No applications here"}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {activeFilter === "shortlisted"
                                    ? "Open the \"All applications\" view and shortlist promising candidates."
                                    : activeFilter === "all"
                                        ? "When students apply from the home page, their CVs will appear here for review."
                                        : "No applications match this filter."}
                            </p>
                            {activeFilter !== "all" && (
                                <button onClick={() => handleFilterChange("all")} className="mt-4 text-sm text-blue-600 hover:underline font-medium">
                                    View all applications →
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="p-6 space-y-4">
                            {filtered.map((application) => (
                                <div key={application._id} className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                                                {application.student?.name?.[0]?.toUpperCase() || "S"}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900">{application.student?.name || "Student"}</h3>
                                                <p className="text-sm text-gray-500">{application.student?.email || "No email available"}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusClasses[application.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                            {statusLabels[application.status] || application.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Applied For</p>
                                            <p className="font-semibold text-gray-900">{application.job?.title || "Job deleted"}</p>
                                            <p className="text-gray-500 mt-1">{application.job?.company || "Organisation listing"}</p>
                                            <p className="text-gray-500 mt-1">{application.job?.location || "Location not set"}</p>
                                        </div>

                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Submission</p>
                                            <p className="text-gray-700">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
                                            <p className="text-gray-700 mt-1">CV: {application.cvOriginalName}</p>
                                            {application.job?.deadline && (
                                                <p className="text-gray-500 mt-1">Job deadline: {new Date(application.job.deadline).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={savingId === application._id || application.status === "shortlisted"}
                                                onClick={() => updateStatus(application._id, "shortlisted")}
                                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${actionButtonClasses.shortlisted}`}
                                            >
                                                {savingId === application._id ? "Saving..." : "Shortlist"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isShortlistMode || savingId === application._id || application.status === "rejected"}
                                                onClick={() => updateStatus(application._id, "rejected")}
                                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${actionButtonClasses.rejected}`}
                                            >
                                                {savingId === application._id ? "Saving..." : "Reject"}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isShortlistMode || savingId === application._id || application.status === "submitted"}
                                                onClick={() => updateStatus(application._id, "submitted")}
                                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${actionButtonClasses.submitted}`}
                                            >
                                                {savingId === application._id ? "Saving..." : "Mark Pending"}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => window.open(`${api.defaults.baseURL}${application.cvUrl}`, "_blank")}
                                                className="inline-flex items-center gap-2 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                                            >
                                                View CV
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => window.open(`${api.defaults.baseURL}${application.cvDownloadUrl}`, "_blank")}
                                                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-blue-200 transition-all duration-150"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:translate-y-0.5">
                                                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                                                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                                                </svg>
                                                Download CV
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}