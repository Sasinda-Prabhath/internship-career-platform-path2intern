import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { PublicNavbar, AppNavbar } from "../components/DarkNavbar";

const WORK_MODE_COLORS = {
  Remote: "bg-green-100 text-green-700 border-green-200",
  Hybrid: "bg-blue-100 text-blue-700 border-blue-200",
  "On-site": "bg-amber-100 text-amber-700 border-amber-200",
};

const TYPE_COLORS = {
  Internship: "bg-purple-100 text-purple-700 border-purple-200",
  "Part-time": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Full-time": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [applyState, setApplyState] = useState("idle"); // idle, applying, success, error
  const [applyMessage, setApplyMessage] = useState("");
  const [cvData, setCvData] = useState(null);
  const [suitability, setSuitability] = useState(null);
  
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorChat, setAdvisorChat] = useState([]); // Array of { role: "user" | "model", text: string }
  const [chatInput, setChatInput] = useState("");

  const handleGetAdvice = async (isFirst = true, customMessage = "") => {
    if (!suitability?.missingSkills?.length) return;
    setAdvisorLoading(true);
    
    const currentChat = [...advisorChat];
    if (!isFirst && customMessage) {
        currentChat.push({ role: "user", text: customMessage });
        setAdvisorChat(currentChat);
        setChatInput("");
    }

    try {
      const res = await api.post("/api/advisor", {
        missingSkills: suitability.missingSkills,
        jobTitle: job.title,
        history: isFirst ? [] : currentChat,
        message: customMessage
      });
      
      const responseText = res.data.advice;
      
      if (isFirst) {
          setAdvisorChat([{ role: "model", text: responseText }]);
      } else {
          setAdvisorChat((prev) => [...prev, { role: "model", text: responseText }]);
      }
    } catch (err) {
      if (isFirst) {
          setAdvisorChat([{ role: "model", text: "Failed to load advice. Please try again." }]);
      } else {
          setAdvisorChat((prev) => [...prev, { role: "model", text: "Failed to send message." }]);
      }
      console.error(err);
    } finally {
      setAdvisorLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.cvText) {
        setCvData({ filename: user.cvFilename, text: user.cvText });
    } else {
        setCvData(null);
    }

    const fetchJob = async () => {
      try {
        const res = await api.get(`/api/jobs/${id}`);
        setJob(res.data.job);
      } catch (err) {
        setError("Job not found or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
      const checkApplicationStatus = async () => {
          if (user && user.globalRole === "STUDENT" && job) {
              try {
                  const res = await api.get(`/api/applications/check/${job._id}`);
                  if (res.data.hasApplied) {
                      setApplyState("success");
                      setApplyMessage("You have already applied for this job.");
                  }
              } catch (err) {
                  console.error("Failed to check application status", err);
              }
          }
      };
      
      checkApplicationStatus();
  }, [user, job]);

  useEffect(() => {
      // Calculate match immediately if we have job and CV text
      if (job && cvData?.text) {
          const text = cvData.text.toLowerCase();
          let missing = [];
          
          if (job.skills && job.skills.length > 0) {
              missing = job.skills.filter(s => {
                  const skill = s.trim();
                  const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(^|\\W)${escapedSkill}(\\W|$)`, 'i');
                  return !regex.test(text);
              });
              const matchedCount = job.skills.length - missing.length;
              setSuitability({
                  matchPercentage: Math.round((matchedCount / job.skills.length) * 100),
                  missingSkills: missing
              });
          } else {
              setSuitability({ matchPercentage: 100, missingSkills: [] });
          }
      }
  }, [job, cvData]);

  const handleApplyClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!cvData) {
        navigate("/dashboard/student/cv-upload");
        return;
    }
    
    setApplyState("applying");
    setApplyMessage("");

    try {
      await api.post("/api/applications", {
          jobId: job._id,
          resumeFilename: cvData.filename,
          cvText: cvData.text
      });
      setApplyState("success");
      setApplyMessage("Application submitted successfully!");
    } catch (err) {
      setApplyState("error");
      setApplyMessage(err.response?.data?.message || "Failed to apply.");
      if (err.response?.data?.message === "You have already applied for this job") {
          setApplyState("success");
          setApplyMessage("You have already applied for this job.");
      }
      setTimeout(() => setApplyState("idle"), 3000);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen bg-gray-50 animate-pulse flex items-center justify-center">Loading...</div>;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
          {user ? <AppNavbar user={user} logout={logout} /> : <PublicNavbar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-500">{error || "Job not found"}</p>
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  const isStudent = user?.globalRole === "STUDENT";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <AppNavbar user={user} logout={logout} /> : <PublicNavbar />}
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 mb-6 inline-flex items-center gap-1">
          ← Back to listings
        </Link>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{job.company}</p>
              
              <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
                <span className="text-gray-600 font-medium">📍 {job.location}</span>
                {job.duration && <span className="text-gray-500">· {job.duration}</span>}
                {job.workMode && (
                  <span className={`px-2.5 py-1 rounded-full font-medium border ${WORK_MODE_COLORS[job.workMode] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.workMode}</span>
                )}
                {job.type && (
                  <span className={`px-2.5 py-1 rounded-full font-medium border ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.type}</span>
                )}
              </div>
              
              {suitability && (
                  <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 inline-block">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Intelligent Match Analysis</p>
                      <div className="flex items-end gap-3">
                          <span className={`text-2xl font-black ${suitability.matchPercentage >= 80 ? 'text-green-600' : suitability.matchPercentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                              {suitability.matchPercentage}% Match
                          </span>
                      </div>
                      {suitability.missingSkills.length > 0 ? (
                          <div className="mt-3">
                              <p className="text-xs text-red-500 font-medium">
                                  Skills to improve: {suitability.missingSkills.join(", ")}
                              </p>
                              {advisorChat.length === 0 ? (
                                  <button 
                                      onClick={() => handleGetAdvice(true)} 
                                      disabled={advisorLoading}
                                      className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition-all disabled:opacity-50"
                                  >
                                      {advisorLoading ? "⏳ Analyzing skills..." : "✨ Ask AI for a Learning Plan"}
                                  </button>
                              ) : (
                                  <div className="mt-4 bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col">
                                      <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 flex items-center justify-between">
                                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">✨ AI Advisor Chat</p>
                                      </div>
                                      <div className="p-4 max-h-64 overflow-y-auto flex flex-col gap-3">
                                          {advisorChat.map((msg, idx) => (
                                              <div key={idx} className={`p-3 rounded-xl text-sm ${msg.role === "user" ? "bg-indigo-600 text-white self-end ml-8 rounded-tr-none" : "bg-gray-50 text-gray-700 border border-gray-100 self-start mr-8 rounded-tl-none"}`}>
                                                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                              </div>
                                          ))}
                                          {advisorLoading && (
                                              <div className="p-3 rounded-xl text-sm bg-gray-50 text-gray-700 border border-gray-100 self-start mr-8 rounded-tl-none animate-pulse">
                                                  Thinking...
                                              </div>
                                          )}
                                      </div>
                                      <div className="p-3 border-t border-indigo-100 bg-gray-50 flex gap-2">
                                          <input 
                                              type="text" 
                                              value={chatInput}
                                              onChange={(e) => setChatInput(e.target.value)}
                                              onKeyDown={(e) => { if (e.key === 'Enter' && chatInput.trim()) handleGetAdvice(false, chatInput); }}
                                              placeholder="Ask a follow-up question..." 
                                              className="flex-1 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 bg-white"
                                              disabled={advisorLoading}
                                          />
                                          <button 
                                              onClick={() => chatInput.trim() && handleGetAdvice(false, chatInput)}
                                              disabled={advisorLoading || !chatInput.trim()}
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                          >
                                              Send
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ) : (
                          <p className="mt-2 text-xs text-green-600 font-medium">
                              You have all the required skills mentioned in your CV!
                          </p>
                      )}
                  </div>
              )}
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center sm:items-end w-full sm:w-80">
              {(!user || isStudent) && (
                  <button 
                  onClick={handleApplyClick}
                  disabled={applyState === "applying" || applyState === "success"}
                  className={`w-full px-8 py-3 rounded-xl font-bold text-base transition-all shadow-md ${
                      applyState === "success" 
                      ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:-translate-y-0.5"
                  }`}
                  >
                  {applyState === "applying" ? "Applying..." : 
                   applyState === "success" ? "✓ Applied" : 
                   (!user ? "Login to Apply" : !cvData ? "Upload CV to Apply" : "⚡ Apply Easy")}
                  </button>
              )}
                
              {applyMessage && (
                <p className={`mt-3 text-sm font-medium text-center w-full ${applyState === "success" ? "text-green-600" : "text-red-500"}`}>
                  {applyMessage}
                </p>
              )}
            </div>
          </div>

          {(job.salaryDisplay || job.deadline) && (
              <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {job.salaryDisplay && (
                      <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Salary / Compensation</p>
                          <p className="text-emerald-700 font-semibold">{job.salaryDisplay}</p>
                      </div>
                  )}
                  {job.deadline && (
                      <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Application Deadline</p>
                          <p className="text-gray-900 font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
                      </div>
                  )}
              </div>
          )}

          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About the Role</h2>
              <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
            
            {job.requirements && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Requirements</h2>
                <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.skills?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Skills Needed</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(s => (
                    <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-100 pt-6 mt-8">
                <p className="text-sm text-gray-400">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
