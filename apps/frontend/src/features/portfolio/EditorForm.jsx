import ThemeSwitcher from "./ThemeSwitcher";

const inp =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export default function EditorForm({
  form,
  setForm,
  onGenerateBio,
  onSuggestSkills,
  onImproveProject,
  bioLoading,
  skillsLoading,
  projectLoadingIndex,
  bioDisplayValue,
}) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setSocial = (k) => (e) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [k]: e.target.value } }));

  const updateProject = (index, field, value) => {
    setForm((f) => {
      const projects = [...(f.projects || [])];
      projects[index] = { ...projects[index], [field]: value };
      return { ...f, projects };
    });
  };

  const updateProjectTech = (index, value) => {
    const tech = value.split(",").map((t) => t.trim()).filter(Boolean);
    updateProject(index, "tech", tech);
  };

  const addProject = () => {
    setForm((f) => ({
      ...f,
      projects: [...(f.projects || []), { title: "", description: "", url: "", tech: [] }],
    }));
  };

  const removeProject = (index) => {
    setForm((f) => ({
      ...f,
      projects: (f.projects || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Appearance</h2>
        <ThemeSwitcher value={form.theme} onChange={(theme) => setForm((f) => ({ ...f, theme }))} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">URL username *</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">/u/</span>
          <input className={inp} value={form.username} onChange={set("username")} placeholder="your-handle" />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          3–30 characters: lowercase letters, numbers, hyphens only. Must start and end with a letter or number. Leave blank
          to keep your current handle.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Display name</label>
          <input className={inp} value={form.name} onChange={set("name")} placeholder="Alex Developer" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Headline</label>
          <input className={inp} value={form.headline} onChange={set("headline")} placeholder="Full-stack intern · React & Node" />
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase text-gray-500">Bio</label>
          <button
            type="button"
            onClick={onGenerateBio}
            disabled={bioLoading}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {bioLoading ? "…" : "✨ Generate Bio"}
          </button>
        </div>
        <textarea
          className={`${inp} min-h-[120px] resize-y`}
          value={bioDisplayValue !== undefined ? bioDisplayValue : form.bio}
          onChange={set("bio")}
          readOnly={bioDisplayValue !== undefined}
          placeholder="A short story about you..."
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase text-gray-500">Skills (comma-separated)</label>
          <button
            type="button"
            onClick={onSuggestSkills}
            disabled={skillsLoading}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {skillsLoading ? "…" : "💡 Suggest Skills"}
          </button>
        </div>
        <input
          className={inp}
          value={(form.skills || []).join(", ")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            }))
          }
          placeholder="React, Node.js, MongoDB"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Education</label>
        <textarea className={`${inp} min-h-[72px]`} value={form.education} onChange={set("education")} placeholder="Degree, university, year" />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Social links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {["github", "linkedin", "twitter", "website"].map((key) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">{key}</label>
              <input
                className={inp}
                value={form.socialLinks?.[key] || ""}
                onChange={setSocial(key)}
                placeholder="https://"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Projects</h3>
          <button type="button" onClick={addProject} className="text-xs font-semibold text-indigo-600 hover:underline">
            + Add project
          </button>
        </div>
        <div className="space-y-4">
          {(form.projects || []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              No projects yet. Click “Add project”.
            </p>
          )}
          {(form.projects || []).map((p, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between gap-2">
                <span className="text-xs font-semibold text-gray-400">Project {i + 1}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onImproveProject(i)}
                    disabled={projectLoadingIndex === i}
                    className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    {projectLoadingIndex === i ? "…" : "✨ Improve description"}
                  </button>
                  <button type="button" onClick={() => removeProject(i)} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
              <input
                className={`${inp} mb-2`}
                placeholder="Title"
                value={p.title || ""}
                onChange={(e) => updateProject(i, "title", e.target.value)}
              />
              <input
                className={`${inp} mb-2`}
                placeholder="https://demo.com"
                value={p.url || ""}
                onChange={(e) => updateProject(i, "url", e.target.value)}
              />
              <textarea
                className={`${inp} mb-2 min-h-[80px]`}
                placeholder="Description"
                value={p.description || ""}
                onChange={(e) => updateProject(i, "description", e.target.value)}
              />
              <input
                className={inp}
                placeholder="Tech: React, Express (comma-separated)"
                value={(p.tech || []).join(", ")}
                onChange={(e) => updateProjectTech(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
