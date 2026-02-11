import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  // ✅ FIX: Make backend relative path work + keep placeholder
  const profileImageSrc = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `http://localhost:5000${user.profileImage}`
    : "https://via.placeholder.com/80x80?text=User";

  return (
    <div className="space-y-16 relative">
      {/* Profile Menu */}
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 hover:border-slate-400 transition-colors !p-0 bg-transparent"
            >
              <img
                src={profileImageSrc}
                alt="Profile Picture"
                className="block w-full h-full object-cover"
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Path2Intern 
        </h1>
        <p className="text-slate-300 max-w-3xl mx-auto text-lg leading-relaxed">
          The ultimate university career platform connecting students with meaningful internships.
          Companies post opportunities, and students apply only when they perfectly match the requirements.
        </p>

        {!user && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border-2 border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-lg transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Services Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comprehensive solutions for students, organizations, and educational institutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-800/50 rounded-2xl p-8 hover:border-blue-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">For Students</h3>
            <p className="text-slate-300 leading-relaxed">
              Create your professional profile, showcase your skills, and get matched with internships
              that perfectly align with your qualifications and career goals.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>• Smart matching algorithm</li>
              <li>• Resume building tools</li>
              <li>• Application tracking</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-800/50 rounded-2xl p-8 hover:border-purple-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">For Organizations</h3>
            <p className="text-slate-300 leading-relaxed">
              Post internships and receive applications from qualified candidates who meet your
              specific requirements, saving time and ensuring quality hires.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>• Targeted candidate matching</li>
              <li>• Easy posting interface</li>
              <li>• Applicant management</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-800/50 rounded-2xl p-8 hover:border-green-600/50 transition-all duration-300">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">For Universities</h3>
            <p className="text-slate-300 leading-relaxed">
              Partner with us to provide your students with premium internship opportunities
              and career development resources through our integrated platform.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>• Campus integration</li>
              <li>• Career counseling</li>
              <li>• Analytics & reporting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">About Path2Intern</h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              Path2Intern was founded with a simple mission: to bridge the gap between talented students
              and innovative companies seeking fresh perspectives. We believe that the right internship
              can shape a student's career trajectory and help organizations discover their next star performers.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Our intelligent matching system ensures that only qualified candidates see relevant opportunities,
              creating a more efficient and effective internship marketplace for everyone involved.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">10K+</div>
                <div className="text-sm text-slate-400">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">500+</div>
                <div className="text-sm text-slate-400">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">50+</div>
                <div className="text-sm text-slate-400">Universities</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Why Choose Us?</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI-powered candidate matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Verified company profiles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Secure application process</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Real-time notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Comprehensive analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="text-center space-y-6 py-12">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Join thousands of students and organizations already using Path2Intern to find their perfect match.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            >
              Join Path2Intern Today
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
