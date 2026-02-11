import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect based on role
      if (result.user.role === "SYSTEM_ADMIN") {
        navigate("/dashboard/admin");
      } else if (result.user.role === "STUDENT") {
        navigate("/dashboard/student");
      } else if (result.user.role === "ORGANIZATION") {
        navigate("/dashboard/org");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Login</h2>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
