import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one lowercase and one uppercase letter";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        navigate("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create account</h2>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="STUDENT">Student</option>
          <option value="ORGANIZATION">Organization</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Profile Image (Optional)</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Profile preview"
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
              />
            )}
          </div>
        </div>

        <input
          className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800"
          placeholder="Password (min 8 chars, 1 uppercase, 1 lowercase)"
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
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
