import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function CVGateway() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSkip = () => {
      sessionStorage.setItem("skipped_cv", "true");
      navigate("/");
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file) {
          setError("Please select a PDF file.");
          return;
      }
      
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("resume", file);

      try {
          const res = await api.post("/api/applications/parse-cv", formData, {
              headers: { "Content-Type": "multipart/form-data" }
          });
          
          updateUser({
              cvFilename: res.data.filename,
              cvText: res.data.cvText
          });
          
          navigate("/"); // Continue to browse internships
      } catch (err) {
          setError(err.response?.data?.message || "Failed to process CV. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/30 blur-[60px] rounded-full point-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[60px] rounded-full point-events-none" />
        
        <div className="relative z-10">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg shadow-blue-500/20">
                    📄
                </div>
                <h1 className="text-2xl font-bold mb-2">Upload or Update Your CV</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Provide a new CV to let our intelligent skill extraction engine recalculate how perfectly you match with every internship opportunity!
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-500/20 rounded-xl p-3 text-center">{error}</div>}
                


                <div className="relative group cursor-pointer">
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />




                    
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? "border-green-500 bg-green-500/5" : "border-slate-700 bg-slate-800/50 group-hover:bg-slate-800 group-hover:border-blue-500"}`}>
                        {file ? (
                            <div>
                                <p className="text-2xl mb-2">✅</p>
                                <p className="text-green-400 font-semibold">{file.name}</p>
                                <p className="text-slate-400 text-xs mt-1">Ready to analyze</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-3xl mb-3 text-blue-400">📤</p>
                                <p className="text-blue-400 font-medium mb-1">Click or drag PDF here</p>
                                <p className="text-slate-500 text-xs">Maximum size: 10MB</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button 
                        type="submit" 
                        disabled={loading || !file}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Analyzing CV...
                            </>
                        ) : "Analyze & Continue →"}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={handleSkip}
                        className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors font-medium border border-transparent hover:border-slate-800 rounded-xl"
                    >
                        Cancel & Browse Internships
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
