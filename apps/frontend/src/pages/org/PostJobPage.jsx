import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";

const EDIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const JOB_TYPES = ["Internship", "Part-time", "Full-time"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const CURRENCIES = ["LKR", "USD", "EUR"];
const PERIODS = ["month", "year"];

// Sri Lanka provinces and their districts
const SL_PROVINCES = {
  "Western Province": ["Colombo", "Gampaha", "Kalutara"],
  "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern Province": ["Galle", "Matara", "Hambantota"],
  "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern Province": ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western Province": ["Kurunegala", "Puttalam"],
  "North Central Province": ["Anuradhapura", "Polonnaruwa"],
  "Uva Province": ["Badulla", "Monaragala"],
  "Sabaragamuwa Province": ["Ratnapura", "Kegalle"],
};

// Shared input style — white theme
const inp =
  "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm";
const selCls = `${inp} cursor-pointer`;

function TimeRemaining({ editExpiresAt }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!editExpiresAt) return;

    const update = () => {
      const ms = new Date(editExpiresAt).getTime() - Date.now();
      if (Number.isNaN(ms) || ms <= 0) {
        setRemaining("");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [editExpiresAt]);

  if (!remaining) return null;

  return (
    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
      ⏱ Edit: {remaining}
    </span>
  );
}

const buildEmptyForm = (orgName = "") => ({
  title: "",
  description: "",
  company: orgName,
  province: "",
  district: "",
  workMode: "Hybrid",
  type: "Internship",
  duration: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "LKR",
  salaryPeriod: "month",
  skills: "",
  requirements: "",
  deadline: "",
});

export default function PostJobPage() {
  const { user } = useAuth();
  const { jobId } = useParams();

  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const districts = form.province ? SL_PROVINCES[form.province] || [] : [];

  useEffect(() => {
    if (jobId) {
      const loadJob = async () => {
        try {
          const res = await api.get(`/api/jobs/${jobId}`);
          const job = res.data;

          setForm({
            title: job.title ?? "",
            description: job.description ?? "",
            company: job.company ?? user?.organizationName ?? "",
            province: job.province || "",
            district: job.district || "",
            workMode: job.workMode || "Hybrid",
            type: job.type || "Internship",
            duration: job.duration || "",
            salaryMin: job.salaryMin ?? "",
            salaryMax: job.salaryMax ?? "",
            salaryCurrency: job.salaryCurrency || "LKR",
            salaryPeriod: job.salaryPeriod || "month",
            skills: Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills ?? ""),
            requirements: job.requirements || "",
            deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
          });
        } catch (e) {
          setError("Failed to load job for editing");
        }
      };
      loadJob();
    } else {
      setForm(buildEmptyForm(user?.organizationName || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, user?.organizationName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const payload = {
        ...form,
        skills: String(form.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: form.deadline || null,
        salaryMin: form.salaryMin !== "" ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax !== "" ? Number(form.salaryMax) : null,
      };

      if (jobId) {
        await api.put(`/api/jobs/${jobId}`, payload);
        setSuccess("Job updated successfully.");
      } else {
        await api.post("/api/jobs", payload);
        setSuccess("Job posted! It's now live on the platform.");
        setForm(buildEmptyForm(user?.organizationName || ""));
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save job");
    } finally {
      setFormLoading(false);
    }
  };

  const cancelForm = () => {
    setForm(buildEmptyForm(user?.organizationName || ""));
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                Organisation
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {jobId ? "Edit Job Post" : "Post a Job"}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {jobId ? "Update your job listing details." : "Create a new job posting for your organization."}
              </p>
            </div>

            <Link
              to="/org/job-listings"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              📋 View My Listings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            {success}
          </div>
        )}

        {/* Post / Edit form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {jobId ? "Edit Job Post" : "New Job Post"}
              </h2>
              {/* Optional timer if you later add editExpiresAt */}
              {/* <TimeRemaining editExpiresAt={editExpiresAt} /> */}
            </div>

            <button
              type="button"
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              aria-label="Close"
              title="Reset form"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: title + company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Job Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={set("title")}
                  className={inp}
                  placeholder="e.g. Software Engineering Intern"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Company *
                </label>
                <input
                  required
                  value={form.company}
                  onChange={set("company")}
                  className={inp}
                  placeholder="Your company name"
                />
              </div>
            </div>

            {/* Row 2: Province + District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Province *
                </label>
                <select
                  required
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, district: "" }))}
                  className={selCls}
                >
                  <option value="">Select Province</option>
                  {Object.keys(SL_PROVINCES).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  District *
                </label>
                <select
                  required
                  value={form.district}
                  onChange={set("district")}
                  className={selCls}
                  disabled={!form.province}
                >
                  <option value="">
                    {form.province ? "Select District" : "Select Province first"}
                  </option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Work Mode + Job Type + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Work Mode
                </label>
                <select value={form.workMode} onChange={set("workMode")} className={selCls}>
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Job Type
                </label>
                <select value={form.type} onChange={set("type")} className={selCls}>
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Duration
                </label>
                <input
                  value={form.duration}
                  onChange={set("duration")}
                  className={inp}
                  placeholder="e.g. 3 months"
                />
              </div>
            </div>

            {/* Row 4: Salary range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Salary Range
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Min</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMin}
                    onChange={set("salaryMin")}
                    className={inp}
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMax}
                    onChange={set("salaryMax")}
                    className={inp}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Currency</label>
                  <select value={form.salaryCurrency} onChange={set("salaryCurrency")} className={selCls}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Per</label>
                  <select value={form.salaryPeriod} onChange={set("salaryPeriod")} className={selCls}>
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Application deadline + Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={set("deadline")}
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Skills (comma-separated)
                </label>
                <input
                  value={form.skills}
                  onChange={set("skills")}
                  className={inp}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Job Description *
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={set("description")}
                className={`${inp} resize-none`}
                placeholder="Describe the role and responsibilities…"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Requirements <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.requirements}
                onChange={set("requirements")}
                className={`${inp} resize-none`}
                placeholder="List any specific requirements, qualifications…"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={cancelForm}
                className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={formLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors shadow-sm"
              >
                {formLoading ? "Saving…" : jobId ? "Update Post" : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}