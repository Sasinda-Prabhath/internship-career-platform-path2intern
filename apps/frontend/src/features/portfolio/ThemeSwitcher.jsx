export default function ThemeSwitcher({ value, onChange, className = "" }) {
  return (
    <div className={`inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("light")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === "light" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => onChange("dark")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === "dark" ? "bg-slate-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
