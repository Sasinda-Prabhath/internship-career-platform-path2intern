import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardRoute } from "../utils/roleUtils";
import { api } from "../services/api";
import { PublicNavbar, AppNavbar } from "../components/DarkNavbar";

/* ── Colour helpers ──────────────────────────────────────────────────────── */
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
const LOGO_COLORS = ["bg-blue-600", "bg-violet-600", "bg-pink-600", "bg-green-600", "bg-amber-500", "bg-cyan-600", "bg-rose-600", "bg-indigo-600"];
const logoColor = (name) => LOGO_COLORS[(name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
const hasDeadlinePassed = (deadline) => deadline && new Date(deadline).getTime() < Date.now();

/* ── Job card ────────────────────────────────────────────────────────────── */

function JobCard({
  job,
  onViewApply,
  applyLabel = "View & Apply",
  applyDisabled = false,
  suitabilityScore = null,
  cvData = null,
}) {
  const initials = (job.company || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  let calculatedSuitability = suitabilityScore;
  if (cvData?.text) {
    const text = cvData.text.toLowerCase();
    if (job.skills?.length > 0) {
      const missing = job.skills.filter((s) => {
        const skill = s.trim();
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\W)${escapedSkill}(\\W|$)`, "i");
        return !regex.test(text);
      });
      const matched = job.skills.length - missing.length;
      calculatedSuitability = Math.round((matched / job.skills.length) * 100);
    } else {
      calculatedSuitability = 100;
    }
  }

  let suitabilityBadgeClass = "bg-green-100 text-green-700";
  if (typeof calculatedSuitability === "number") {
    if (calculatedSuitability < 50) suitabilityBadgeClass = "bg-red-100 text-red-700";
    else if (calculatedSuitability < 80) suitabilityBadgeClass = "bg-orange-100 text-orange-700";
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 card-lift flex flex-col gap-3 animate-fadeInUp`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${logoColor(job.company)} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md transition-transform duration-300`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">{job.title}</h3>
          <p className="text-sm text-gray-500">{job.company}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-gray-500">📍 {job.location}</span>
        {job.duration && <span className="text-gray-400">· {job.duration}</span>}
        {job.workMode && (
          <span className={`px-2 py-0.5 rounded-full font-medium border transition-all ${WORK_MODE_COLORS[job.workMode] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.workMode}</span>
        )}
        {job.type && (
          <span className={`px-2 py-0.5 rounded-full font-medium border transition-all ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.type}</span>
        )}
      </div>
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s, i) => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full transition-all hover:bg-blue-100 hover:border-blue-300 cursor-default" style={{ transitionDelay: `${i * 30}ms` }}>{s}</span>
          ))}
          {job.skills.length > 4 && <span className="text-xs text-gray-400">+{job.skills.length - 4}</span>}
        </div>
      )}
      {job.salaryDisplay && <p className="text-xs text-emerald-700 font-semibold animate-pulse">💰 {job.salaryDisplay}</p>}
      {typeof calculatedSuitability === "number" && (
        <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold text-gray-500">CV Suitability:</span>
          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${suitabilityBadgeClass}`}>
            {calculatedSuitability}% Match
          </span>
        </div>
      )}
      {job.deadline && <p className="text-xs text-gray-400">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>}
      <button
        type="button"
        onClick={() => onViewApply?.(job)}
        disabled={applyDisabled}
        className={`mt-auto w-full text-center text-sm font-medium rounded-xl py-2 transition-colors border ${applyDisabled
          ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
          : "text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 bg-blue-50"
          }`}
      >
        {applyLabel}
      </button>
    </div>
  );
}

function ApplyJobModal({ job, cvData, onClose, onApplied, onUploadCv }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSubmitting(false);
    setError("");
  }, [job]);

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvData?.filename) {
      setError("Please upload your CV first.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/jobs/${job._id}/apply`);
      onApplied(job._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Apply Now</p>
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{job.company} · {job.location}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              {job.workMode && <span className={`px-2 py-1 rounded-full border ${WORK_MODE_COLORS[job.workMode] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.workMode}</span>}
              {job.type && <span className={`px-2 py-1 rounded-full border ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.type}</span>}
              {job.duration && <span className="px-2 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200">{job.duration}</span>}
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Job Description</h3>
                <p className="leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
              {job.requirements && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Requirements</h3>
                  <p className="leading-relaxed whitespace-pre-line">{job.requirements}</p>
                </div>
              )}
              {job.skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Easy Apply</h3>
              <p className="text-sm text-gray-500 mt-1">Apply instantly using your already uploaded CV.</p>
            </div>

            {job.salaryDisplay && <p className="text-sm text-emerald-700 font-semibold">Salary: {job.salaryDisplay}</p>}
            {job.deadline && <p className="text-sm text-gray-500">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>}

            {cvData?.filename ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Using CV</p>
                <p className="text-sm text-green-800 mt-1 break-all">{cvData.filename}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">No CV found. Upload your CV to use Easy Apply.</p>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              {cvData?.filename ? (
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60">
                  {submitting ? "Applying..." : "Easy Apply"}
                </button>
              ) : (
                <button type="button" onClick={onUploadCv} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  Upload CV
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Link to={`/job/${job._id}`} className="mt-auto w-full text-center text-sm font-medium text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors bg-blue-50">View Job</Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse flex flex-col gap-3">
      <div className="flex gap-3"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div>
      <div className="h-3 bg-gray-100 rounded w-full animate-shimmer" />
      <div className="h-3 bg-gray-100 rounded w-2/3 animate-shimmer" />
      <div className="flex gap-2 pt-2">
        <div className="h-5 bg-gray-100 rounded-full w-16 animate-shimmer" />
        <div className="h-5 bg-gray-100 rounded-full w-20 animate-shimmer" />
      </div>
    </div>
  );
}

/* ── Features data ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "🎓", title: "Student-First Platform", desc: "Built for SLIIT students to discover internships that match their skills and courses — no clutter, no noise." },
  { icon: "🏢", title: "Verified Organisations", desc: "All companies go through a manual approval process by the University Admin. Only legitimate businesses post here." },
  { icon: "📝", title: "Module-Based Quizzes", desc: "Test your knowledge across DS, SE, QA, BA & PM modules to improve your readiness for technical interviews." },
  { icon: "⚡", title: "Real-Time Listings", desc: "Job postings appear instantly for all students the moment an organisation publishes them." },
  { icon: "🔒", title: "Role-Based Access", desc: "Separate role paths for students, organisations, module lecturers, and admins — everyone gets the right tools." },
  { icon: "📧", title: "Direct Contact", desc: "Reach out to our team through the built-in contact form. System admins respond directly to your inbox." },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Create Your Account", desc: "Students sign up with their SLIIT email. Organisations register with a business document for verification." },
  { n: "02", title: "Get Approved", desc: "Student emails are verified instantly via OTP. Organisation accounts are manually reviewed by a University Admin." },
  { n: "03", title: "Browse & Apply", desc: "Explore live internship listings, filter by work mode and type, and apply directly to the roles that interest you." },
];

/* ── Contact form ────────────────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.post("/api/contact", form);
      setSent(true); setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) { setError(err.response?.data?.message || "Failed to send. Please try again."); }
    finally { setLoading(false); }
  };

  const inp = "w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 input-focus hover:border-slate-600";

  if (sent) return (
    <div className="text-center py-12 animate-fadeInUp">
      <div className="text-5xl mb-4 animate-bounceIn">✅</div>
      <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
      <p className="text-slate-400 text-sm">We'll get back to you at your email within 24 hours.</p>
      <button onClick={() => setSent(false)} className="mt-6 text-blue-400 text-sm hover:text-blue-300 transition-colors">Send another message</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 animate-fadeInDown">🚨 {error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}><label className="block text-xs font-semibold text-gray-400 mb-1.5">Name</label><input required value={form.name} onChange={set("name")} className={inp} placeholder="Your name" /></div>
        <div className="animate-fadeInUp" style={{ animationDelay: '150ms' }}><label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label><input type="email" required value={form.email} onChange={set("email")} className={inp} placeholder="you@example.com" /></div>
      </div>
      <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}><label className="block text-xs font-semibold text-gray-400 mb-1.5">Subject</label><input required value={form.subject} onChange={set("subject")} className={inp} placeholder="How can we help?" /></div>
      <div className="animate-fadeInUp" style={{ animationDelay: '250ms' }}><label className="block text-xs font-semibold text-gray-400 mb-1.5">Message</label><textarea required rows={5} value={form.message} onChange={set("message")} className={`${inp} resize-none`} placeholder="Tell us more…" /></div>
      <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Home() {
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [type, setType] = useState("");
  
  const [showCvModal, setShowCvModal] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState("");

  useEffect(() => {
    if (user && user.cvText) {
        setCvData({ filename: user.cvFilename, text: user.cvText });
    } else if (user?.globalRole === "STUDENT" && !sessionStorage.getItem("skipped_cv")) {
        const t = setTimeout(() => setShowCvModal(true), 1500);
        return () => clearTimeout(t);
    } else {
        setCvData(null);
    }
  }, [user]);

  const handleSkipCv = () => {
      sessionStorage.setItem("skipped_cv", "true");
      setShowCvModal(false);
  };

  const handleUploadCv = async (e) => {
      e.preventDefault();
      if (!cvFile) { setCvError("Please select a PDF file."); return; }
      setCvLoading(true); setCvError("");
      
      const formData = new FormData();
      formData.append("resume", cvFile);

      try {
          const res = await api.post("/api/applications/parse-cv", formData, {
              headers: { "Content-Type": "multipart/form-data" }
          });
          const newData = { filename: res.data.filename, text: res.data.cvText };
          if (user) {
              updateUser({ cvFilename: newData.filename, cvText: newData.text });
          }
          setCvData(newData);
          setShowCvModal(false);
      } catch (err) {
          setCvError(err.response?.data?.message || "Failed to process CV.");
      } finally {
          setCvLoading(false);
      }
  };
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [matchByJobId, setMatchByJobId] = useState({});

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (workMode) params.set("workMode", workMode);
        if (type) params.set("type", type);
        const res = await api.get(`/api/jobs?${params.toString()}`);
        setJobs(res.data.jobs || []);
      } catch { setJobs([]); }
      finally { setJobsLoading(false); }
    };
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [search, workMode, type]);

  useEffect(() => {
    const fetchMyApplications = async () => {
      if (!user || user.globalRole !== "STUDENT") {
        setMatchByJobId({});
        return;
      }
      try {
        const res = await api.get("/api/applications/mine");
        const apps = res.data.applications || [];
        const nextMatch = {};
        const nextApplied = [];
        apps.forEach((app) => {
          const jobId = app.job?._id || app.jobId?._id || app.job?._id || app.jobId;
          if (!jobId) return;
          if (typeof app.matchPercentage === "number") nextMatch[String(jobId)] = app.matchPercentage;
          nextApplied.push(String(jobId));
        });
        setMatchByJobId(nextMatch);
        setAppliedJobIds(nextApplied);
      } catch {
        setMatchByJobId({});
      }
    };
    fetchMyApplications();
  }, [user]);

  /* ── Logged-in view ─────────────────────────────────────────────── */
  if (!authLoading && user) {
    const dashboardRoute = getDashboardRoute(user.globalRole, user.moduleScopedRoles);
    const isStudent = user.globalRole === "STUDENT";
    const openApplyModal = (job) => {
      setSelectedJob(job);
      if (typeof setShowApplyModal === "function") {
        setShowApplyModal(true);
      }
    };

    const markApplied = (jobId) => {
      setAppliedJobIds((current) => (current.includes(jobId) ? current : [...current, jobId]));
      setSelectedJob(null);
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <AppNavbar user={user} logout={logout} />
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-blue-600/30 card-lift animate-fadeInDown">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 animate-fadeInUp">Welcome back, {user.name.split(" ")[0]}! 👋</h1>
              <p className="text-blue-100 text-sm animate-fadeInUp" style={{ animationDelay: '100ms' }}>Browse the latest internship opportunities below.</p>
            </div>
            <Link to={dashboardRoute} className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              Go to Dashboard →
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search internships, skills, companies…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-300 input-focus" />
            </div>
            {[
              { value: workMode, onChange: (v) => setWorkMode(v), opts: ["Remote", "Hybrid", "On-site"], label: "All work modes" },
              { value: type, onChange: (v) => setType(v), opts: ["Internship", "Part-time", "Full-time"], label: "All types" },
            ].map(({ value, onChange, opts, label }, i) => (
              <select key={i} value={value} onChange={(e) => onChange(e.target.value)}
                className="text-sm bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-300 hover:border-gray-300">
                <option value="">{label}</option>
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Latest Internships {!jobsLoading && <span className="text-sm font-normal text-gray-500 ml-2">({jobs.length} open)</span>}
            </h2>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 animate-fadeInUp">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">{search || workMode || type ? "No results match your filters." : "No internships posted yet. Check back soon!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job, index) => (
                <JobCard 
                  key={job._id} 
                  job={job} 
                  suitabilityScore={matchByJobId[String(job._id)]}
                  cvData={cvData}
                  applyDisabled={isStudent && (appliedJobIds.includes(String(job._id)) || hasDeadlinePassed(job.deadline))}
                  applyLabel={isStudent && appliedJobIds.includes(String(job._id)) ? "Already Applied" : "View & Apply"}
                  onViewApply={openApplyModal}
                />
              ))}
            </div>
          )}
        </main>
        {showApplyModal && selectedJob && (
          <ApplyJobModal
            job={selectedJob}
            cvData={cvData}
            onClose={() => {
              setShowApplyModal(false);
              setSelectedJob(null);
            }}
            onApplied={markApplied}
            onUploadCv={() => {
              setShowApplyModal(false);
              setShowCvModal(true);
            }}
          />
        )}
        {/* CV Upload Modal */}
        {showCvModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
                        <h2 className="text-2xl font-bold mb-2">Upload Your CV 📄</h2>
                        <p className="text-blue-100 text-sm">See exactly how well you match with internships instantly!</p>
                        <button onClick={handleSkipCv} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">✕</button>
                    </div>
                    <form onSubmit={handleUploadCv} className="p-8 space-y-6">
                        {cvError && <div className="text-red-500 text-sm bg-red-100 p-3 rounded-xl border border-red-200">{cvError}</div>}
                        <div className="relative group">
                            <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${cvFile ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50 group-hover:border-blue-500 group-hover:bg-blue-50"}`}>
                                {cvFile ? (
                                    <>
                                        <p className="text-2xl mb-2">✅</p>
                                        <p className="text-green-700 font-semibold">{cvFile.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-3xl mb-2 text-blue-500">📤</p>
                                        <p className="text-blue-600 font-medium">Click to select PDF</p>
                                        <p className="text-gray-400 text-xs mt-1">Maximum size: 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={handleSkipCv} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Skip</button>
                            <button type="submit" disabled={!cvFile || cvLoading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20">
                                {cvLoading ? "Analyzing..." : "Analyze Match"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <footer className="border-t border-gray-200 py-6 text-center bg-white">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Path2Intern. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  if (authLoading) return <div className="min-h-screen bg-gray-50" />;

  /* ── Public dark landing page ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Animated gradient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" style={{ animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold px-4 py-2.5 rounded-full mb-8 backdrop-blur-sm animate-slideInDown">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulseGlow" />
            Now accepting internship applications
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight mb-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            Your Internship.<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-fadeInUp" style={{ animationDelay: '300ms' }}>Starts Here.</span>
          </h1>
          
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp" style={{ animationDelay: '400ms' }}>
            Path2Intern connects SLIIT students with verified companies — so your career can begin before graduation.
            Simple, fast, and fully integrated with your university.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '500ms' }}>
            <Link to="/register" className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 hover:-translate-y-1 group">
              <span className="flex items-center gap-2">
                Get Started Free 
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center border-2 border-slate-600 text-slate-300 hover:text-white hover:border-blue-500/60 hover:bg-blue-500/5 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-300 backdrop-blur-sm group">
              <span className="flex items-center gap-2">
                See How It Works 
                <span className="transition-transform group-hover:translate-y-1">↓</span>
              </span>
            </button>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative z-10 mt-20 max-w-5xl mx-auto w-full px-4 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
          <div className="glass rounded-2xl shadow-2xl shadow-blue-900/30 overflow-hidden border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 card-lift">
            <div className="bg-slate-800/80 px-5 py-4 flex items-center gap-2 border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500/70 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70 animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-3 h-3 rounded-full bg-green-500/70 animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="ml-4 text-xs text-slate-400">Path2Intern Dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[["Active Listings", "24", "📋"], ["Students", "1.2k", "🎓"], ["Organisations", "38", "🏢"], ["Placements", "156", "✅"]].map(([label, val, icon], i) => (
                <div key={label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-blue-500/30 transition-all hover:bg-slate-800/60 group animate-fadeInUp" style={{ animationDelay: `${700 + i * 50}ms` }}>
                  <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{val}</p>
                  <p className="text-xs text-slate-400 mt-1">{icon} {label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4 animate-fadeInUp">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight animate-fadeInUp" style={{ animationDelay: '100ms' }}>Everything you need to land your internship</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} className="card-lift bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/60 hover:bg-slate-800/60 transition-all group glass-dark animate-fadeInUp" style={{ animationDelay: `${200 + i * 100}ms` }}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{icon}</div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:to-blue-600/5 rounded-2xl transition-all duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4 animate-fadeInUp">Process</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white animate-fadeInUp" style={{ animationDelay: '100ms' }}>How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Animated connector line */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
              <div key={n} className="relative flex flex-col items-center text-center p-6 animate-fadeInUp group" style={{ animationDelay: `${200 + i * 150}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-400 mb-5 shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 group-hover:bg-blue-600/30 transition-all duration-300 relative z-10">
                  {n}
                  <div className="absolute inset-0 rounded-2xl bg-blue-600/10 group-hover:animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 border-t border-slate-800/50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4 animate-fadeInUp">Get In Touch</p>
            <h2 className="text-4xl font-bold text-white mb-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>Contact Us</h2>
            <p className="text-slate-400 text-sm animate-fadeInUp" style={{ animationDelay: '150ms' }}>Have a question or feedback? We reply directly to your inbox.</p>
          </div>
          <div className="glass-dark rounded-2xl p-8 border border-slate-700/50 shadow-xl shadow-slate-900/50 hover:border-blue-500/30 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10 px-4 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 group animate-fadeInUp">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/40 group-hover:shadow-blue-600/60 transition-all">
              <span className="text-white text-xs font-bold">P2</span>
            </div>
            <span className="text-white font-bold">Path2Intern</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Path2Intern. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login" className="text-slate-400 hover:text-blue-400 text-sm transition-colors duration-300">Sign In</Link>
            <Link to="/register" className="text-slate-400 hover:text-blue-400 text-sm transition-colors duration-300">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
