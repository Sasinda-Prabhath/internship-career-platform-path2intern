export default function ProjectCard({ project, theme = "light" }) {
  const isDark = theme === "dark";
  const card =
    isDark
      ? "border-slate-700 bg-slate-800/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
      : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10";

  return (
    <article
      className={`group rounded-2xl border p-5 transition-all duration-300 ${card}`}
    >
      <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
        {project.title || "Untitled project"}
      </h3>
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-indigo-500 hover:underline"
        >
          {project.url}
        </a>
      )}
      <p className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-gray-600"}`}>
        {project.description || "—"}
      </p>
      {project.tech?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isDark ? "bg-slate-700 text-indigo-200" : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
