import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, setUser } = useAuth(); // Assuming setUser is available in context
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch("http://localhost:5000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user); // Update user in context
        setMessage("Profile updated successfully");
        setIsEditing(false);
        setProfileImage(null);
        setImagePreview(null);
      } else {
        const error = await response.json();
        setMessage(error.message);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      {message && (
        <div className="p-3 mb-4 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200">
          {message}
        </div>
      )}

      <div className="bg-slate-900 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image</label>
              <div className="flex items-center space-x-4">
                <img
                  src={imagePreview || (user?.profileImage ? `http://localhost:5000${user.profileImage}` : "https://via.placeholder.com/80x80?text=User")}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
                />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                  >
                    Choose Image
                  </button>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF up to 5MB</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="mb-4">
              <img
                src={user?.profileImage
                  ? (user.profileImage.startsWith("http")
                      ? user.profileImage
                      : `http://localhost:5000${user.profileImage}`)
                  : "https://via.placeholder.com/80x80?text=User"}
                alt="Profile Picture"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
              />
            </div>
            <div>
              <span className="text-slate-400">Name:</span> {user?.name}
            </div>
            <div>
              <span className="text-slate-400">Email:</span> {user?.email}
            </div>
            <div>
              <span className="text-slate-400">Role:</span> {user?.role}
            </div>
            <div>
              <span className="text-slate-400">Status:</span> {user?.status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}