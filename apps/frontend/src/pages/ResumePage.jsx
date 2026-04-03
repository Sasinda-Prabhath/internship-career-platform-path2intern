import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const splitLines = (value) =>
  (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const splitComma = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const isValidEmail = (value) => {
  const email = (value || "").trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const blockedHeadlineKeywords = ["docker", "git", "aws", "azure"];

const sanitizeHeadline = (value) => {
  const parts = (value || "")
    .split(/[|,/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .filter((part) => !blockedHeadlineKeywords.includes(part.toLowerCase()))
    .join(" | ");
};

const sectionTitleStyle = {
  fontSize: "17px",
  fontWeight: 800,
  textTransform: "uppercase",
  marginBottom: "5px",
  letterSpacing: "0.06em",
};

const RESUME_HISTORY_STORAGE_KEY = "resumeTemplateOneHistory";

const createEmptyFormData = () => ({
  personalInfo: {
    name: "",
    headline: "",
    location: "",
    email: "",
    phone: "",
    linkedin: "",
  },
  summary: "",
  experience: [],
  education: [{ degree: "", institution: "", year: "" }],
  projects: [{ title: "", description: "", technologies: "", link: "" }],
  skills: "",
  certifications: "",
});

const generateResumeId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const ResumeTemplateOne = ({ data }) => {
  const safeHeadline = sanitizeHeadline(data.personalInfo.headline);
  const contactLine = [data.personalInfo.location, data.personalInfo.email, data.personalInfo.phone, data.personalInfo.linkedin]
    .filter(Boolean)
    .join(" | ");

  return (
    <div style={{ background: "#fff", color: "#111", width: "100%", maxWidth: "790px", margin: "0 auto", padding: "44px 48px", lineHeight: 1.45, fontFamily: "Arial, sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: "50px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {data.personalInfo.name || "YOUR NAME"}
        </h1>
        {safeHeadline && (
          <p style={{ margin: "8px 0 8px", fontSize: "16px", fontWeight: 500, textTransform: "uppercase" }}>{safeHeadline}</p>
        )}
        <p style={{ margin: 0, fontSize: "14px" }}>{contactLine || "City, Country | email@example.com | +00 000 000 000 | linkedin.com/in/username"}</p>
      </header>

      {data.summary && (
        <section style={{ marginBottom: "22px" }}>
          <h2 style={sectionTitleStyle}>Professional Summary</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          <p style={{ margin: 0, fontSize: "15px" }}>{data.summary}</p>
        </section>
      )}

      {splitComma(data.skills).length > 0 && (
        <section style={{ marginBottom: "22px" }}>
          <h2 style={sectionTitleStyle}>Skills</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          <ul style={{ margin: 0, paddingLeft: "22px", fontSize: "15px" }}>
            <li>{splitComma(data.skills).join(", ")}</li>
          </ul>
        </section>
      )}

      {data.experience.some((item) => item.role || item.company || item.duration || item.description) && (
        <section style={{ marginBottom: "22px" }}>
          <h2 style={sectionTitleStyle}>Work Experience</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          {data.experience.map((item, index) => {
            if (!item.role && !item.company && !item.duration && !item.description) return null;
            const bullets = splitLines(item.description);
            return (
              <article key={`exp-${index}`} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{item.role || "Role"}</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{item.company || "Company"}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, textAlign: "right" }}>{item.duration}</p>
                </div>
                {bullets.length > 0 && (
                  <ul style={{ margin: "6px 0 0", paddingLeft: "22px", fontSize: "15px" }}>
                    {bullets.map((line, i) => (
                      <li key={`exp-line-${i}`} style={{ marginBottom: "3px" }}>{line}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      )}

      {data.education.some((item) => item.degree || item.institution || item.year) && (
        <section style={{ marginBottom: "22px" }}>
          <h2 style={sectionTitleStyle}>Education</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          {data.education.map((item, index) => {
            if (!item.degree && !item.institution && !item.year) return null;
            return (
              <article key={`edu-${index}`} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{item.degree || "Degree"}</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{item.institution || "Institution"}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, textAlign: "right" }}>
                    {item.year ? `Graduated: ${item.year}` : ""}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {data.projects.some((item) => item.title || item.description || item.technologies || item.link) && (
        <section style={{ marginBottom: "22px" }}>
          <h2 style={sectionTitleStyle}>Projects</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          {data.projects.map((item, index) => {
            if (!item.title && !item.description && !item.technologies && !item.link) return null;
            const bullets = splitLines(item.description);
            const tech = splitComma(item.technologies);
            return (
              <article key={`project-${index}`} style={{ marginBottom: "12px" }}>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{item.title || "Project"}</p>
                <ul style={{ margin: "6px 0 0", paddingLeft: "22px", fontSize: "15px" }}>
                  {bullets.map((line, i) => (
                    <li key={`project-line-${i}`}>{line}</li>
                  ))}
                  {tech.length > 0 && <li>Technologies: {tech.join(", ")}</li>}
                  {item.link && <li>Link: {item.link}</li>}
                </ul>
              </article>
            );
          })}
        </section>
      )}

      {splitLines(data.certifications).length > 0 && (
        <section>
          <h2 style={sectionTitleStyle}>Certifications</h2>
          <div style={{ borderTop: "1px solid #333", marginBottom: "8px" }} />
          <ul style={{ margin: 0, paddingLeft: "22px", fontSize: "15px" }}>
            {splitLines(data.certifications).map((line, index) => (
              <li key={`cert-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default function ResumePage() {
  const { user } = useAuth();
  const previewRef = useRef(null);
  const [formData, setFormData] = useState(createEmptyFormData);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [historyNotice, setHistoryNotice] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  const historyUserKey = useMemo(
    () => user?.id || user?.email || user?.name || "guest",
    [user]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${RESUME_HISTORY_STORAGE_KEY}:${historyUserKey}`);
      if (!raw) {
        setResumeHistory([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setResumeHistory(parsed);
      } else {
        setResumeHistory([]);
      }
    } catch {
      setResumeHistory([]);
    }
  }, [historyUserKey]);

  useEffect(() => {
    if (!historyNotice) return;
    const timeout = setTimeout(() => setHistoryNotice(""), 2200);
    return () => clearTimeout(timeout);
  }, [historyNotice]);

  const previewElement = useMemo(() => <ResumeTemplateOne data={formData} />, [formData]);
  const emailValue = formData.personalInfo.email || "";
  const emailHasInput = emailValue.trim().length > 0;
  const emailError = emailHasInput && !isValidEmail(emailValue)
    ? "Enter a valid email address (example: name@example.com)."
    : "";

  const updatePersonalInfo = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateArrayField = (section, index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev[section]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [section]: updated };
    });
  };

  const addRow = (section, template) => {
    setFormData((prev) => ({ ...prev, [section]: [...prev[section], template] }));
  };

  const persistHistory = (entries) => {
    localStorage.setItem(`${RESUME_HISTORY_STORAGE_KEY}:${historyUserKey}`, JSON.stringify(entries));
    setResumeHistory(entries);
  };

  const handleSaveResume = () => {
    if (!isValidEmail(formData.personalInfo.email)) {
      setHistoryNotice("Please enter a valid email before saving.");
      return;
    }

    const now = new Date().toISOString();
    const displayName = formData.personalInfo.name?.trim() || "Untitled Resume";

    let updatedEntries;
    if (activeResumeId) {
      updatedEntries = resumeHistory.map((entry) =>
        entry.id === activeResumeId
          ? { ...entry, title: displayName, data: formData, updatedAt: now }
          : entry
      );
      setHistoryNotice("Resume updated");
    } else {
      const newEntry = {
        id: generateResumeId(),
        title: displayName,
        data: formData,
        updatedAt: now,
      };
      updatedEntries = [newEntry, ...resumeHistory];
      setActiveResumeId(newEntry.id);
      setHistoryNotice("Resume saved");
    }

    updatedEntries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    persistHistory(updatedEntries);
  };

  const handleLoadResume = (entry) => {
    setFormData(entry.data);
    setActiveResumeId(entry.id);
    setHistoryNotice("Loaded from history");
  };

  const handleCreateNewResume = () => {
    setFormData(createEmptyFormData());
    setActiveResumeId(null);
    setHistoryNotice("New resume ready");
  };

  const handleDeleteResume = (id) => {
    const updated = resumeHistory.filter((entry) => entry.id !== id);
    persistHistory(updated);

    if (activeResumeId === id) {
      setFormData(createEmptyFormData());
      setActiveResumeId(null);
    }
    setHistoryNotice("Deleted from history");
  };

  const handleDownloadPdf = async () => {
    if (!isValidEmail(formData.personalInfo.email)) {
      setHistoryNotice("Please enter a valid email before downloading.");
      return;
    }

    try {
      setDownloadLoading(true);
      setHistoryNotice("Generating PDF...");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      const ensureSpace = (required = 8) => {
        if (y + required > pageHeight - margin) {
          pdf.addPage();
          y = 18;
        }
      };

      const writeCentered = (text, size, style = "normal") => {
        if (!text) return;
        ensureSpace(8);
        pdf.setFont("helvetica", style);
        pdf.setFontSize(size);
        pdf.text(text, pageWidth / 2, y, { align: "center" });
        y += size * 0.45 + 2;
      };

      const writeSectionTitle = (title) => {
        ensureSpace(12);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(title.toUpperCase(), margin, y);
        y += 2;
        pdf.setLineWidth(0.3);
        pdf.line(margin, y + 1, pageWidth - margin, y + 1);
        y += 6;
      };

      const writeParagraph = (text, size = 10.5) => {
        if (!text) return;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(text, contentWidth);
        ensureSpace(lines.length * 4.8 + 2);
        pdf.text(lines, margin, y);
        y += lines.length * 4.8 + 2;
      };

      const writeBullet = (text, size = 10.5) => {
        if (!text) return;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(text, contentWidth - 6);
        ensureSpace(lines.length * 4.8 + 1);
        pdf.text("•", margin + 1, y);
        pdf.text(lines, margin + 5, y);
        y += lines.length * 4.8 + 1;
      };

      const safeHeadline = sanitizeHeadline(formData.personalInfo.headline);
      const contactLine = [
        formData.personalInfo.location,
        formData.personalInfo.email,
        formData.personalInfo.phone,
        formData.personalInfo.linkedin,
      ]
        .filter(Boolean)
        .join(" | ");

      writeCentered((formData.personalInfo.name || "YOUR NAME").toUpperCase(), 19, "bold");
      writeCentered(safeHeadline, 11, "normal");
      writeCentered(contactLine, 10, "normal");
      y += 4;

      if (formData.summary) {
        writeSectionTitle("Professional Summary");
        writeParagraph(formData.summary);
      }

      const skills = splitComma(formData.skills);
      if (skills.length > 0) {
        writeSectionTitle("Skills");
        writeBullet(skills.join(", "));
      }

      const experiences = (formData.experience || []).filter(
        (item) => item.role || item.company || item.duration || item.description
      );
      if (experiences.length > 0) {
        writeSectionTitle("Work Experience");
        experiences.forEach((item) => {
          ensureSpace(10);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.text(item.role || "Role", margin, y);
          if (item.duration) {
            pdf.text(item.duration, pageWidth - margin, y, { align: "right" });
          }
          y += 5;
          pdf.setFontSize(10.5);
          pdf.text(item.company || "Company", margin, y);
          y += 4.5;
          splitLines(item.description).forEach((line) => writeBullet(line));
          y += 1;
        });
      }

      const educationRows = (formData.education || []).filter(
        (item) => item.degree || item.institution || item.year
      );
      if (educationRows.length > 0) {
        writeSectionTitle("Education");
        educationRows.forEach((item) => {
          ensureSpace(9);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.text(item.degree || "Degree", margin, y);
          if (item.year) {
            pdf.text(`Graduated: ${item.year}`, pageWidth - margin, y, { align: "right" });
          }
          y += 5;
          pdf.setFontSize(10.5);
          pdf.text(item.institution || "Institution", margin, y);
          y += 6;
        });
      }

      const projects = (formData.projects || []).filter(
        (item) => item.title || item.description || item.technologies || item.link
      );
      if (projects.length > 0) {
        writeSectionTitle("Projects");
        projects.forEach((item) => {
          ensureSpace(9);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.text(item.title || "Project", margin, y);
          y += 5;
          splitLines(item.description).forEach((line) => writeBullet(line));
          const techList = splitComma(item.technologies);
          if (techList.length > 0) {
            writeBullet(`Technologies: ${techList.join(", ")}`);
          }
          if (item.link) {
            writeBullet(`Link: ${item.link}`);
          }
          y += 1;
        });
      }

      const certs = splitLines(formData.certifications);
      if (certs.length > 0) {
        writeSectionTitle("Certifications");
        certs.forEach((line) => writeBullet(line));
      }

      const fileName = `${(formData.personalInfo.name || "resume")
        .replace(/\s+/g, "-")
        .toLowerCase()}-template-1.pdf`;
      pdf.save(fileName);

      setHistoryNotice("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      setHistoryNotice("Error generating PDF. Try again.");
    } finally {
      setDownloadLoading(false);
      setTimeout(() => setHistoryNotice(""), 2200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <span className="bg-blue-500/20 text-blue-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider">
            Resume Template 1
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Live Editable Resume</h1>
          <p className="text-gray-500 mt-1 text-sm">Edit the form and your resume updates instantly. Use Download PDF to save it.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Resume History</h2>
              <button
                onClick={handleCreateNewResume}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                + New Resume
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Save your current resume, then reopen it later to continue editing.
            </p>
            {historyNotice && <p className="text-xs font-semibold text-emerald-600 mb-3">{historyNotice}</p>}

            {resumeHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No saved resumes yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {resumeHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-3 ${activeResumeId === entry.id ? "border-blue-500 bg-blue-50/40" : "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(entry.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadResume(entry)}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteResume(entry.id)}
                          className="px-2 py-1 text-xs font-semibold text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <input placeholder="Full Name" value={formData.personalInfo.name} onChange={(e) => updatePersonalInfo("name", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Headline (example: Software Engineering | Data Science)" value={formData.personalInfo.headline} onChange={(e) => updatePersonalInfo("headline", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Location" value={formData.personalInfo.location} onChange={(e) => updatePersonalInfo("location", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="email" placeholder="Email" value={formData.personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${emailError ? "border-red-500" : "border-gray-300"}`} />
            {emailError && <p className="text-xs text-red-600 -mt-1">{emailError}</p>}
            <input placeholder="Phone" value={formData.personalInfo.phone} onChange={(e) => updatePersonalInfo("phone", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="LinkedIn URL" value={formData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo("linkedin", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h2>
            <textarea rows="4" placeholder="Write your summary" value={formData.summary} onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
            {formData.experience.length === 0 ? (
              <button onClick={() => addRow("experience", { role: "", company: "", duration: "", description: "" })} className="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">+ Add Experience</button>
            ) : (
              <>
                {formData.experience.map((item, index) => (
                  <div key={`exp-form-${index}`} className="space-y-2 pb-4 border-b border-gray-200 last:border-0">
                    <input placeholder="Role" value={item.role} onChange={(e) => updateArrayField("experience", index, "role", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input placeholder="Company" value={item.company} onChange={(e) => updateArrayField("experience", index, "company", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input placeholder="Duration (example: Jan 2024 - Present)" value={item.duration} onChange={(e) => updateArrayField("experience", index, "duration", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <textarea rows="3" placeholder="Bullet points (one line each)" value={item.description} onChange={(e) => updateArrayField("experience", index, "description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
                  </div>
                ))}
                <button onClick={() => addRow("experience", { role: "", company: "", duration: "", description: "" })} className="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">+ Add Experience</button>
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Education</h2>
            {formData.education.map((item, index) => (
              <div key={`edu-form-${index}`} className="space-y-2 pb-4 border-b border-gray-200 last:border-0">
                <input placeholder="Degree" value={item.degree} onChange={(e) => updateArrayField("education", index, "degree", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <input placeholder="Institution" value={item.institution} onChange={(e) => updateArrayField("education", index, "institution", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <input placeholder="Graduation Year" value={item.year} onChange={(e) => updateArrayField("education", index, "year", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            ))}
            <button onClick={() => addRow("education", { degree: "", institution: "", year: "" })} className="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">+ Add Education</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            {formData.projects.map((item, index) => (
              <div key={`project-form-${index}`} className="space-y-2 pb-4 border-b border-gray-200 last:border-0">
                <input placeholder="Project Title" value={item.title} onChange={(e) => updateArrayField("projects", index, "title", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <textarea rows="3" placeholder="Description (one bullet per line)" value={item.description} onChange={(e) => updateArrayField("projects", index, "description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
                <input placeholder="Technologies (comma-separated)" value={item.technologies} onChange={(e) => updateArrayField("projects", index, "technologies", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <input placeholder="Project Link" value={item.link} onChange={(e) => updateArrayField("projects", index, "link", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            ))}
            <button onClick={() => addRow("projects", { title: "", description: "", technologies: "", link: "" })} className="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">+ Add Project</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Skills and Certifications</h2>
            <input placeholder="Skills (comma-separated)" value={formData.skills} onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <textarea rows="3" placeholder="Certifications (one per line)" value={formData.certifications} onChange={(e) => setFormData((prev) => ({ ...prev, certifications: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
          </div>
        </div>

        <div>
          <div className="sticky top-8 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Template 1 Preview</h2>
            <p className="text-xs text-gray-500 mb-4">Your resume is displayed below. Click Download PDF to save it to your computer.</p>
            <div className="mb-4 h-[46rem] overflow-y-auto bg-gray-100 p-3 rounded-lg border border-gray-200" ref={previewRef}>
              {previewElement}
            </div>
            <button 
              onClick={handleDownloadPdf} 
              disabled={downloadLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadLoading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button onClick={handleSaveResume} className="mt-2 w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Save Resume To History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
