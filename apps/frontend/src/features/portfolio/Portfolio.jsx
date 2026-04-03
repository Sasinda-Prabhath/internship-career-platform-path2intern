import SkillBadge from "./SkillBadge";
import ProjectCard from "./ProjectCard";

const defaultData = {
  name: "",
  headline: "",
  bio: "",
  skills: [],
  projects: [],
  education: "",
  socialLinks: {},
  username: "",
};

/**
 * Public portfolio layout — all content from `data` props.
 * @param {{ data?: object, theme?: 'light'|'dark', className?: string }} props
 */
export default function Portfolio({ data = {}, theme = "light", className = "" }) {
  const d = { ...defaultData, ...data };
  const social = d.socialLinks || {};
  const isDark = theme === "dark";

  const shell = isDark
    ? "bg-slate-950 text-slate-100"
    : "bg-gradient-to-b from-gray-50 to-white text-gray-900";

  return (
    <div className={`min-h-full ${shell} ${className}`}>
      <header
        className={`border-b ${isDark ? "border-slate-800 bg-slate-900/80" : "border-gray-200 bg-white/80"} backdrop-blur-sm`}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-12">
          <p className={`text-sm font-medium uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
            Portfolio
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{d.name || "Your name"}</h1>
          <p className={`text-xl ${isDark ? "text-slate-300" : "text-gray-600"}`}>{d.headline || "Your headline"}</p>
          {d.username && (
            <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}>@{d.username}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-16 px-6 py-12">
        <section>
          <h2 className={`mb-4 text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            About
          </h2>
          <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? "text-slate-300" : "text-gray-700"}`}>
            {d.bio || "Tell visitors about yourself."}
          </p>
        </section>

        <section>
          <h2 className={`mb-4 text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Skills
          </h2>
          {d.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {d.skills.map((s) => (
                <SkillBadge
                  key={s}
                  label={s}
                  className={
                    isDark
                      ? "border-slate-600 bg-slate-800 text-indigo-200"
                      : "border-indigo-100 bg-indigo-50 text-indigo-800"
                  }
                />
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}>No skills listed yet.</p>
          )}
        </section>

        <section>
          <h2 className={`mb-4 text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Projects
          </h2>
          {d.projects?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {d.projects.map((p, i) => (
                <ProjectCard key={p._id || i} project={p} theme={theme} />
              ))}
            </div>
          ) : (
            <div
              className={`rounded-2xl border border-dashed px-6 py-12 text-center ${isDark ? "border-slate-700 text-slate-500" : "border-gray-200 text-gray-400"}`}
            >
              <p className="text-4xl mb-2">📂</p>
              <p className="text-sm">No projects yet. Add projects in the editor.</p>
            </div>
          )}
        </section>

        {d.education && (
          <section>
            <h2 className={`mb-4 text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Education
            </h2>
            <p className={`whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-gray-700"}`}>{d.education}</p>
          </section>
        )}

        <section>
          <h2 className={`mb-4 text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Contact
          </h2>
          <div className={`flex flex-wrap gap-4 text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>
            {social.github && (
              <a href={social.github} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                GitHub
              </a>
            )}
            {social.linkedin && (
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                LinkedIn
              </a>
            )}
            {social.twitter && (
              <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                Twitter / X
              </a>
            )}
            {social.website && (
              <a href={social.website} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                Website
              </a>
            )}
            {!social.github && !social.linkedin && !social.twitter && !social.website && (
              <span className={isDark ? "text-slate-500" : "text-gray-400"}>Add social links in the editor.</span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
