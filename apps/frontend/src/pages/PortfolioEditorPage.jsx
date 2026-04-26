import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Portfolio from "../features/portfolio/Portfolio";
import EditorForm from "../features/portfolio/EditorForm";
import { useTypingReveal } from "../features/portfolio/hooks/useTypingReveal";

const emptyForm = () => ({
  username: "",
  name: "",
  headline: "",
  bio: "",
  skills: [],
  projects: [],
  education: "",
  socialLinks: { github: "", linkedin: "", twitter: "", website: "" },
  theme: "light",
  isPublished: false,
});

function mapServerPortfolio(p) {
  if (!p) return emptyForm();
  return {
    username: p.username || "",
    name: p.name ?? "",
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    skills: p.skills || [],
    projects: p.projects?.length ? p.projects : [],
    education: p.education ?? "",
    socialLinks: {
      github: p.socialLinks?.github || "",
      linkedin: p.socialLinks?.linkedin || "",
      twitter: p.socialLinks?.twitter || "",
      website: p.socialLinks?.website || "",
    },
    theme: p.theme === "dark" ? "dark" : "light",
    isPublished: Boolean(p.isPublished),
  };
}

export default function PortfolioEditorPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [projectLoadingIndex, setProjectLoadingIndex] = useState(null);
  const [stream, setStream] = useState({ text: "", active: false });
  const shownBio = useTypingReveal(stream.text, stream.active);
  const skipAutoSave = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/portfolio/me");
      const p = res.data.portfolio;
      if (p) setForm(mapServerPortfolio(p));
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load portfolio");
    } finally {
      setLoading(false);
      setTimeout(() => {
        skipAutoSave.current = false;
      }, 400);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!stream.active || !stream.text) return;
    if (shownBio === stream.text) {
      setForm((f) => ({ ...f, bio: stream.text }));
      setStream({ text: "", active: false });
    }
  }, [shownBio, stream.active, stream.text]);

  const payload = () => ({
    username: form.username,
    name: form.name,
    headline: form.headline,
    bio: form.bio,
    skills: form.skills,
    projects: form.projects,
    education: form.education,
    socialLinks: form.socialLinks,
    theme: form.theme,
    isPublished: form.isPublished,
  });

  const save = async (silent) => {
    setSaving(true);
    try {
      const res = await api.post("/api/portfolio", payload());
      if (res.data?.portfolio) setForm(mapServerPortfolio(res.data.portfolio));
      if (!silent) toast.success("Saved");
    } catch (e) {
      const msg = e.response?.data?.message || "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (loading || skipAutoSave.current) return;
    const t = setTimeout(() => {
      api.post("/api/portfolio", payload()).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [form, loading]);

  const handlePublish = async () => {
    setSaving(true);
    try {
      const res = await api.post("/api/portfolio", { ...payload(), isPublished: true });
      if (res.data?.portfolio) setForm(mapServerPortfolio(res.data.portfolio));
      toast.success("Published! Open your public page from “View live site”.");
    } catch (e) {
      const msg = e.response?.data?.message || "Publish failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openPublicSite = () => {
    if (!form.username || form.username.length < 3) {
      toast.error("Set a valid username (3+ characters) first.");
      return;
    }
    window.open(`${window.location.origin}/u/${encodeURIComponent(form.username)}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/u/${encodeURIComponent(form.username || "username")}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied")).catch(() => toast.error("Copy failed"));
  };

  const handleGenerateBio = async () => {
    setBioLoading(true);
    try {
      const res = await api.post("/api/ai/generate-bio", {
        headline: form.headline,
        skills: form.skills,
      });
      const text = res.data.text || "";
      setStream({ text, active: true });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not generate bio");
    } finally {
      setBioLoading(false);
    }
  };

  const handleSuggestSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await api.post("/api/ai/suggest-skills", {
        headline: form.headline,
        bio: form.bio,
      });
      const skills = res.data.skills || [];
      if (skills.length) {
        setForm((f) => ({ ...f, skills: [...new Set([...(f.skills || []), ...skills])].slice(0, 20) }));
        toast.success(res.data.note || "Skills suggested");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not suggest skills");
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleImproveProject = async (index) => {
    const p = form.projects?.[index];
    if (!p) return;
    setProjectLoadingIndex(index);
    try {
      const res = await api.post("/api/ai/improve-project", {
        title: p.title,
        description: p.description,
      });
      const text = res.data.text || "";
      setForm((f) => {
        const projects = [...(f.projects || [])];
        projects[index] = { ...projects[index], description: text };
        return { ...f, projects };
      });
      toast.success("Project description updated");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not improve project");
    } finally {
      setProjectLoadingIndex(null);
    }
  };

  const previewData = {
    name: form.name || user?.name || "Your name",
    headline: form.headline,
    bio: form.bio,
    skills: form.skills,
    projects: form.projects,
    education: form.education,
    socialLinks: form.socialLinks,
    username: form.username,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-xl bg-gray-200" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 rounded-2xl bg-gray-200" />
            <div className="h-96 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Portfolio builder</h1>
            <p className="text-xs text-gray-500">Live preview updates as you type · auto-saves after you pause</p>
            {form.username?.length >= 3 && (
              <p className="mt-1 text-xs text-indigo-600">
                Public URL (after you click Publish):{" "}
                <span className="font-mono">{window.location.origin}/u/{form.username}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={openPublicSite}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              View live site
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <EditorForm
            form={form}
            setForm={setForm}
            onGenerateBio={handleGenerateBio}
            onSuggestSkills={handleSuggestSkills}
            onImproveProject={handleImproveProject}
            bioLoading={bioLoading}
            skillsLoading={skillsLoading}
            projectLoadingIndex={projectLoadingIndex}
            bioDisplayValue={stream.active ? shownBio : undefined}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Preview</p>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-gray-200 shadow-lg">
            <Portfolio data={previewData} theme={form.theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
