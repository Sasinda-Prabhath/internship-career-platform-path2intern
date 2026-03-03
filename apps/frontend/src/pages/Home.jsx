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

/* ── Job card ────────────────────────────────────────────────────────────── */
function JobCard({ job }) {
  const initials = (job.company || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${logoColor(job.company)} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500">{job.company}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-gray-500">📍 {job.location}</span>
        {job.duration && <span className="text-gray-400">· {job.duration}</span>}
        {job.workMode && (
          <span className={`px-2 py-0.5 rounded-full font-medium border ${WORK_MODE_COLORS[job.workMode] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.workMode}</span>
        )}
        {job.type && (
          <span className={`px-2 py-0.5 rounded-full font-medium border ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.type}</span>
        )}
      </div>
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map(s => (
            <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {job.skills.length > 4 && <span className="text-xs text-gray-400">+{job.skills.length - 4}</span>}
        </div>
      )}
      {job.salaryDisplay && <p className="text-xs text-emerald-700 font-semibold">💰 {job.salaryDisplay}</p>}
      {job.deadline && <p className="text-xs text-gray-400">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>}
      <Link to={`/job/${job._id}`} className="mt-auto w-full text-center text-sm font-medium text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors bg-blue-50">View & Apply</Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse flex flex-col gap-3">
      <div className="flex gap-3"><div className="w-11 h-11 rounded-xl bg-gray-200 flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
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

  const inp = "w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  if (sent) return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
      <p className="text-slate-400 text-sm">We'll get back to you at your email within 24 hours.</p>
      <button onClick={() => setSent(false)} className="mt-6 text-blue-400 text-sm hover:underline">Send another message</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label><input required value={form.name} onChange={set("name")} className={inp} placeholder="Your name" /></div>
        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label><input type="email" required value={form.email} onChange={set("email")} className={inp} placeholder="you@example.com" /></div>
      </div>
      <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label><input required value={form.subject} onChange={set("subject")} className={inp} placeholder="How can we help?" /></div>
      <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label><textarea required rows={5} value={form.message} onChange={set("message")} className={`${inp} resize-none`} placeholder="Tell us more…" /></div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60">
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [type, setType] = useState("");

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

  /* ── Logged-in view ─────────────────────────────────────────────── */
  if (!authLoading && user) {
    const dashboardRoute = getDashboardRoute(user.globalRole, user.moduleScopedRoles);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppNavbar user={user} logout={logout} />
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-blue-600/20">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Welcome back, {user.name.split(" ")[0]}! 👋</h1>
              <p className="text-blue-100 text-sm">Browse the latest internship opportunities below.</p>
            </div>
            <Link to={dashboardRoute} className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              Go to Dashboard →
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search internships, skills, companies…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            </div>
            {[
              { value: workMode, onChange: (v) => setWorkMode(v), opts: ["Remote", "Hybrid", "On-site"], label: "All work modes" },
              { value: type, onChange: (v) => setType(v), opts: ["Internship", "Part-time", "Full-time"], label: "All types" },
            ].map(({ value, onChange, opts, label }, i) => (
              <select key={i} value={value} onChange={(e) => onChange(e.target.value)}
                className="text-sm bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
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
            <div className="text-center py-20">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">{search || workMode || type ? "No results match your filters." : "No internships posted yet. Check back soon!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}
        </main>
        <footer className="border-t border-gray-200 py-6 text-center bg-white">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Path2Intern. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  if (authLoading) return <div className="min-h-screen bg-gray-50" />;

  /* ── Public dark landing page ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 text-white">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Gradient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-600/8 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Now accepting internship applications
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Your Internship.<br />
            <span className="text-blue-500">Starts Here.</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Path2Intern connects SLIIT students with verified companies — so your career can begin before graduation.
            Simple, fast, and fully integrated with your university.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5">
              Get Started Free →
            </Link>
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold px-8 py-4 rounded-2xl text-base transition-all">
              See How It Works ↓
            </button>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative z-10 mt-20 max-w-5xl mx-auto w-full px-4">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden">
            <div className="bg-slate-800/60 px-5 py-3 flex items-center gap-2 border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-xs text-slate-500">Path2Intern Dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[["Active Listings", "24", "📋"], ["Students", "1.2k", "🎓"], ["Organisations", "38", "🏢"], ["Placements", "156", "✅"]].map(([label, val, icon]) => (
                <div key={label} className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-400">{val}</p>
                  <p className="text-xs text-slate-400 mt-1">{icon} {label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Everything you need to land your internship</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 hover:bg-slate-900 transition-all group">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div key={n} className="relative flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl font-bold text-blue-400 mb-5 shadow-lg shadow-blue-600/10">{n}</div>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
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
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Get In Touch</p>
            <h2 className="text-4xl font-bold text-white mb-3">Contact Us</h2>
            <p className="text-slate-400 text-sm">Have a question or feedback? We reply directly to your inbox.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">P2</span>
            </div>
            <span className="text-white font-bold">Path2Intern</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Path2Intern. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="text-slate-400 hover:text-white text-sm transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
