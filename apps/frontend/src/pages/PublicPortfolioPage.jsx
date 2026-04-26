import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import Portfolio from "../features/portfolio/Portfolio";

export default function PublicPortfolioPage() {
  const { username } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/portfolio/${encodeURIComponent(username)}`);
        setPortfolio(res.data.portfolio);
      } catch (e) {
        setError(e.response?.status === 404 ? "Portfolio not found or not published." : "Could not load portfolio.");
        setPortfolio(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading portfolio…</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Not available</h1>
        <p className="text-gray-500 text-center max-w-md mb-6">{error}</p>
        <Link to="/" className="text-indigo-600 font-semibold hover:underline">
          ← Back home
        </Link>
      </div>
    );
  }

  const data = {
    name: portfolio.name,
    headline: portfolio.headline,
    bio: portfolio.bio,
    skills: portfolio.skills,
    projects: portfolio.projects,
    education: portfolio.education,
    socialLinks: portfolio.socialLinks,
    username: portfolio.username,
  };

  return <Portfolio data={data} theme={portfolio.theme === "dark" ? "dark" : "light"} />;
}
