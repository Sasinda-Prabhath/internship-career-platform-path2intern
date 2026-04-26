import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

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

const isLettersOnly = (value) => /^[A-Za-z\s]+$/.test((value || "").trim());

const isValidSriLankaPhone = (value) => /^\+94\s\d{9}$/.test((value || "").trim());

const blockedHeadlineKeywords = ["docker", "git", "aws", "azure"];

const sanitizeHeadlineForForm = (value) =>
  String(value || "")
    .replace(/[^A-Za-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const ResumeTemplateTwo = ({ data }) => {
  const safeHeadline = sanitizeHeadline(data.personalInfo.headline);
  const skills = splitComma(data.skills);
  const interests = splitLines(data.certifications);
  const experienceRows = (data.experience || []).filter(
    (item) => item.role || item.company || item.duration || item.description
  );
  const educationRows = (data.education || []).filter(
    (item) => item.degree || item.institution || item.year
  );
  const projectRows = (data.projects || []).filter(
    (item) => item.title || item.description || item.technologies || item.link
  );

  return (
    <div style={{ background: "#fff", color: "#111", width: "100%", maxWidth: "790px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "34% 66%", minHeight: "1110px" }}>
        <aside style={{ background: "#1d2435", color: "#fff", padding: "36px 26px" }}>
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <div style={{ width: "165px", height: "165px", borderRadius: "50%", margin: "0 auto 16px", border: "4px solid #f4bd00", background: "#6f8599" }} />
            <h1 style={{ margin: "0 0 4px", fontSize: "44px", color: "#f4bd00", lineHeight: 1 }}>{data.personalInfo.name || "YOUR NAME"}</h1>
            <p style={{ margin: 0, fontSize: "24px", color: "#d9dde8" }}>{safeHeadline || "Professional Headline"}</p>
          </div>

          <section style={{ marginTop: "26px" }}>
            <p style={{ margin: 0, color: "#f4bd00", fontSize: "28px", fontWeight: 700 }}>Contact</p>
            <div style={{ borderTop: "2px solid #3b4563", marginTop: "10px", marginBottom: "10px" }} />
            <p style={{ margin: "8px 0", fontSize: "18px" }}>{data.personalInfo.email || "email@example.com"}</p>
            <p style={{ margin: "8px 0", fontSize: "18px" }}>{data.personalInfo.phone || "+00 000 000 000"}</p>
            <p style={{ margin: "8px 0", fontSize: "18px" }}>{data.personalInfo.linkedin || data.personalInfo.location || "linkedin.com/in/username"}</p>
          </section>

          <section style={{ marginTop: "34px" }}>
            <p style={{ margin: 0, color: "#f4bd00", fontSize: "28px", fontWeight: 700 }}>Skills</p>
            <div style={{ borderTop: "2px solid #3b4563", marginTop: "10px", marginBottom: "14px" }} />
            {skills.length > 0 ? (
              skills.slice(0, 6).map((skill, idx) => (
                <div key={`skill-2-${idx}`} style={{ marginBottom: "10px" }}>
                  <p style={{ margin: 0, fontSize: "18px" }}>{skill}</p>
                  <div style={{ marginTop: "4px", height: "6px", background: "#3b4563", borderRadius: "4px" }}>
                    <div style={{ width: `${70 + ((idx * 7) % 20)}%`, height: "6px", background: "#f4bd00", borderRadius: "4px" }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: "18px", color: "#d9dde8" }}>Add skills in the form to populate this section.</p>
            )}
          </section>

          <section style={{ marginTop: "34px" }}>
            <p style={{ margin: 0, color: "#f4bd00", fontSize: "28px", fontWeight: 700 }}>Interests</p>
            <div style={{ borderTop: "2px solid #3b4563", marginTop: "10px", marginBottom: "10px" }} />
            {(interests.length > 0 ? interests : ["Creative Design", "Photography", "Technology"]).slice(0, 4).map((line, idx) => (
              <p key={`interest-2-${idx}`} style={{ margin: "8px 0", fontSize: "18px" }}>{line}</p>
            ))}
          </section>
        </aside>

        <main style={{ padding: "34px 30px" }}>
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, fontSize: "34px", textTransform: "none", letterSpacing: 0, marginBottom: "8px" }}>Profile</h2>
            <div style={{ borderTop: "2px solid #c8ced8", marginBottom: "10px" }} />
            <p style={{ margin: 0, fontSize: "16px" }}>{data.summary || "Write a short profile summary in the form to show here."}</p>
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, fontSize: "34px", textTransform: "none", letterSpacing: 0, marginBottom: "8px" }}>Experience</h2>
            <div style={{ borderTop: "2px solid #c8ced8", marginBottom: "10px" }} />
            {(experienceRows.length > 0 ? experienceRows : [{ role: "Role", company: "Company", duration: "Duration", description: "Add experience details in the form" }]).slice(0, 3).map((item, idx) => (
              <article key={`exp-2-${idx}`} style={{ marginBottom: "10px" }}>
                <p style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{item.role || "Role"}</p>
                <p style={{ margin: "2px 0", fontSize: "16px", color: "#333" }}>{item.company || "Company"}</p>
                <p style={{ margin: "2px 0", fontSize: "15px", color: "#555" }}>{item.duration || "Duration"}</p>
                {splitLines(item.description).slice(0, 2).map((line, lineIdx) => (
                  <p key={`exp-2-line-${lineIdx}`} style={{ margin: "4px 0", fontSize: "15px" }}>{line}</p>
                ))}
              </article>
            ))}
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, fontSize: "34px", textTransform: "none", letterSpacing: 0, marginBottom: "8px" }}>Education</h2>
            <div style={{ borderTop: "2px solid #c8ced8", marginBottom: "10px" }} />
            {(educationRows.length > 0 ? educationRows : [{ degree: "Degree", institution: "Institution", year: "Year" }]).slice(0, 2).map((item, idx) => (
              <article key={`edu-2-${idx}`} style={{ marginBottom: "8px" }}>
                <p style={{ margin: 0, fontSize: "21px", fontWeight: 700 }}>{item.degree || "Degree"}</p>
                <p style={{ margin: "2px 0", fontSize: "16px" }}>{item.institution || "Institution"}</p>
                {item.year && <p style={{ margin: 0, fontSize: "15px", color: "#444" }}>Graduated: {item.year}</p>}
              </article>
            ))}
          </section>

          {projectRows.length > 0 && (
            <section>
              <h2 style={{ ...sectionTitleStyle, fontSize: "34px", textTransform: "none", letterSpacing: 0, marginBottom: "8px" }}>Portfolio</h2>
              <div style={{ borderTop: "2px solid #c8ced8", marginBottom: "10px" }} />
              {projectRows.slice(0, 2).map((item, idx) => (
                <article key={`proj-2-${idx}`} style={{ marginBottom: "8px" }}>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{item.title || "Project"}</p>
                  {splitLines(item.description).slice(0, 2).map((line, lineIdx) => (
                    <p key={`proj-2-line-${lineIdx}`} style={{ margin: "2px 0", fontSize: "15px" }}>{line}</p>
                  ))}
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

const ResumeTemplateThree = ({ data }) => {
  const safeHeadline = sanitizeHeadline(data.personalInfo.headline);
  const experienceRows = (data.experience || []).filter(
    (item) => item.role || item.company || item.duration || item.description
  );
  const educationRows = (data.education || []).filter(
    (item) => item.degree || item.institution || item.year
  );
  const certRows = splitLines(data.certifications);
  const skills = splitComma(data.skills);

  return (
    <div style={{ background: "#f4f4f6", color: "#1a1a1f", width: "100%", maxWidth: "790px", margin: "0 auto", padding: "42px 42px", lineHeight: 1.45, fontFamily: "Arial, sans-serif" }}>
      <header style={{ marginBottom: "18px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", letterSpacing: "0.14em", fontWeight: 900, color: "#d31f83", textTransform: "uppercase" }}>
          {data.personalInfo.name || "YOUR NAME"}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "14px", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {safeHeadline || "Professional Headline"}
        </p>
      </header>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <div style={{ minWidth: "280px" }}>
          {[data.personalInfo.email, data.personalInfo.location, data.personalInfo.phone].filter(Boolean).map((line, idx) => (
            <p key={`contact-3-${idx}`} style={{ margin: "0 0 8px", fontSize: "14px", borderTop: "1px solid #cfb8ca", paddingTop: "8px", textAlign: "right" }}>{line}</p>
          ))}
        </div>
      </div>

      {data.summary && (
        <section style={{ marginBottom: "14px" }}>
          <h2 style={{ ...sectionTitleStyle, color: "#b51973", marginBottom: "4px" }}>Summary</h2>
          <div style={{ borderTop: "1px solid #cfb8ca", marginBottom: "8px" }} />
          <p style={{ margin: 0, fontSize: "15px" }}>{data.summary}</p>
        </section>
      )}

      <section style={{ marginBottom: "14px" }}>
        <h2 style={{ ...sectionTitleStyle, color: "#b51973", marginBottom: "4px" }}>Experience</h2>
        <div style={{ borderTop: "1px solid #cfb8ca", marginBottom: "8px" }} />
        {(experienceRows.length > 0 ? experienceRows : [{ role: "Role", company: "Company", duration: "Duration", description: "Add achievements in one line per bullet." }]).slice(0, 3).map((item, idx) => (
          <article key={`exp-3-${idx}`} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{item.company || "Company"}</p>
              <p style={{ margin: 0, fontSize: "15px", fontStyle: "italic" }}>{item.duration || "Duration"}</p>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "14px" }}>{item.role || "Role"}</p>
            <ul style={{ margin: 0, paddingLeft: "22px", fontSize: "14px" }}>
              {(splitLines(item.description).length > 0 ? splitLines(item.description) : ["Describe your impact and responsibilities."]).slice(0, 3).map((line, lineIdx) => (
                <li key={`exp-3-line-${lineIdx}`} style={{ marginBottom: "2px" }}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ marginBottom: "14px" }}>
        <h2 style={{ ...sectionTitleStyle, color: "#b51973", marginBottom: "4px" }}>Education</h2>
        <div style={{ borderTop: "1px solid #cfb8ca", marginBottom: "8px" }} />
        {(educationRows.length > 0 ? educationRows : [{ degree: "Degree", institution: "Institution", year: "Year" }]).slice(0, 2).map((item, idx) => (
          <article key={`edu-3-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", gap: "10px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{item.institution || "Institution"}</p>
              <p style={{ margin: 0, fontSize: "14px" }}>{item.degree || "Degree"}</p>
            </div>
            <p style={{ margin: 0, fontSize: "14px", fontStyle: "italic" }}>{item.year || "Year"}</p>
          </article>
        ))}
      </section>

      {certRows.length > 0 && (
        <section style={{ marginBottom: "14px" }}>
          <h2 style={{ ...sectionTitleStyle, color: "#b51973", marginBottom: "4px" }}>Certification</h2>
          <div style={{ borderTop: "1px solid #cfb8ca", marginBottom: "8px" }} />
          <ul style={{ margin: 0, paddingLeft: "22px", fontSize: "14px" }}>
            {certRows.map((line, idx) => (
              <li key={`cert-3-${idx}`} style={{ marginBottom: "2px" }}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2 style={{ ...sectionTitleStyle, color: "#b51973", marginBottom: "4px" }}>Skills</h2>
          <div style={{ borderTop: "1px solid #cfb8ca", marginBottom: "8px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: "14px" }}>
            {skills.map((skill, idx) => (
              <p key={`skill-3-${idx}`} style={{ margin: 0 }}>• {skill}</p>
            ))}
          </div>
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
  const [selectedTemplate, setSelectedTemplate] = useState("template1");
  const [aiBusy, setAiBusy] = useState(null);

  const runResumeAi = async (busyKey, action, extraContext, applyText) => {
    setAiBusy(busyKey);
    try {
      const res = await api.post("/api/resume/ai", {
        action,
        context: {
          ...extraContext,
          name: formData.personalInfo.name,
          headline: formData.personalInfo.headline,
          skills: formData.skills,
          summarySnippet: formData.summary,
        },
        template: selectedTemplate,
      });
      const text = res.data?.text ?? "";
      applyText(text);
      toast.success("AI suggestion applied — review and edit as needed.");
    } catch (e) {
      toast.error(e.response?.data?.message || "AI request failed. Try again.");
    } finally {
      setAiBusy(null);
    }
  };

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

  const previewElement = useMemo(() => {
    if (selectedTemplate === "template2") return <ResumeTemplateTwo data={formData} />;
    if (selectedTemplate === "template3") return <ResumeTemplateThree data={formData} />;
    return <ResumeTemplateOne data={formData} />;
  }, [formData, selectedTemplate]);
  const emailValue = formData.personalInfo.email || "";
  const emailHasInput = emailValue.trim().length > 0;
  const emailError = emailHasInput && !isValidEmail(emailValue)
    ? "Enter a valid email address (example: name@example.com)."
    : "";
  const nameValue = formData.personalInfo.name || "";
  const nameHasInput = nameValue.trim().length > 0;
  const nameError = nameHasInput && !isLettersOnly(nameValue)
    ? "Full name must contain letters only."
    : "";
  const headlineValue = formData.personalInfo.headline || "";
  const headlineHasInput = headlineValue.trim().length > 0;
  const headlineError = headlineHasInput && !isLettersOnly(headlineValue)
    ? "Headline must contain letters only."
    : "";
  const phoneValue = formData.personalInfo.phone || "";
  const phoneHasInput = phoneValue.trim().length > 0;
  const phoneError = phoneHasInput && !isValidSriLankaPhone(phoneValue)
    ? "Phone number must follow +94 xxxxxxxxx format."
    : "";
  const personalInfoError = nameError || headlineError || emailError || phoneError;

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
    if (nameError || !nameHasInput) {
      setHistoryNotice("Please enter a valid full name (letters only) before saving.");
      return;
    }
    if (headlineError || !headlineHasInput) {
      setHistoryNotice("Please enter a valid headline (letters only) before saving.");
      return;
    }
    if (phoneError) {
      setHistoryNotice("Phone number must follow +94 xxxxxxxxx format before saving.");
      return;
    }
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
    if (nameError || !nameHasInput) {
      setHistoryNotice("Please enter a valid full name (letters only) before downloading.");
      return;
    }
    if (headlineError || !headlineHasInput) {
      setHistoryNotice("Please enter a valid headline (letters only) before downloading.");
      return;
    }
    if (phoneError) {
      setHistoryNotice("Phone number must follow +94 xxxxxxxxx format before downloading.");
      return;
    }
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
        .toLowerCase()}-${selectedTemplate}.pdf`;
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
            {`Resume ${selectedTemplate === "template1" ? "Template 1" : selectedTemplate === "template2" ? "Template 2" : "Template 3"}`}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Live Editable Resume</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Edit the form and your resume updates instantly. Use ✨ AI buttons to draft text with Gemini (same form for all templates). Download PDF when ready.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Choose Template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {["template1", "template2", "template3"].map((tpl, idx) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                    selectedTemplate === tpl
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {`Template ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>

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
            <input
              placeholder="Full Name"
              value={formData.personalInfo.name}
              onChange={(e) => updatePersonalInfo("name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${nameError ? "border-red-500" : "border-gray-300"}`}
            />
            {nameError && <p className="text-xs text-red-600 -mt-1">{nameError}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <input
                placeholder="Headline (example: Software Engineering)"
                value={formData.personalInfo.headline}
                onChange={(e) => updatePersonalInfo("headline", e.target.value)}
                className={`w-full flex-1 px-4 py-2 border rounded-lg ${headlineError ? "border-red-500" : "border-gray-300"}`}
              />
              <button
                type="button"
                disabled={aiBusy === "headline"}
                onClick={() =>
                  runResumeAi("headline", "headline", { focus: formData.personalInfo.headline }, (text) =>
                    updatePersonalInfo("headline", sanitizeHeadlineForForm(text))
                  )
                }
                className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
              >
                {aiBusy === "headline" ? "…" : "✨ AI headline"}
              </button>
            </div>
            {headlineError && <p className="text-xs text-red-600 -mt-1">{headlineError}</p>}
            <input placeholder="Location" value={formData.personalInfo.location} onChange={(e) => updatePersonalInfo("location", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="email" placeholder="Email" value={formData.personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} className={`w-full px-4 py-2 border rounded-lg ${emailError ? "border-red-500" : "border-gray-300"}`} />
            {emailError && <p className="text-xs text-red-600 -mt-1">{emailError}</p>}
            <input
              placeholder="Phone (+94 xxxxxxxxx)"
              value={formData.personalInfo.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${phoneError ? "border-red-500" : "border-gray-300"}`}
            />
            {phoneError && <p className="text-xs text-red-600 -mt-1">{phoneError}</p>}
            <input placeholder="LinkedIn URL" value={formData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo("linkedin", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            {personalInfoError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                Please fix personal information errors. These validations apply to all templates.
              </p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
              <button
                type="button"
                disabled={aiBusy === "summary"}
                onClick={() =>
                  runResumeAi("summary", "summary", { summaryHint: formData.summary }, (text) =>
                    setFormData((prev) => ({ ...prev, summary: text }))
                  )
                }
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {aiBusy === "summary" ? "…" : "✨ AI draft summary"}
              </button>
            </div>
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
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-500">Bullet points (one line each)</span>
                        <button
                          type="button"
                          disabled={aiBusy === `exp-${index}`}
                          onClick={() =>
                            runResumeAi(
                              `exp-${index}`,
                              "experience_bullets",
                              {
                                role: item.role,
                                company: item.company,
                                duration: item.duration,
                                existing: item.description,
                              },
                              (text) =>
                                setFormData((prev) => {
                                  const exp = [...prev.experience];
                                  exp[index] = { ...exp[index], description: text };
                                  return { ...prev, experience: exp };
                                })
                            )
                          }
                          className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                        >
                          {aiBusy === `exp-${index}` ? "…" : "✨ AI bullets"}
                        </button>
                      </div>
                      <textarea rows="3" placeholder="Bullet points (one line each)" value={item.description} onChange={(e) => updateArrayField("experience", index, "description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
                    </div>
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
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <input placeholder="Degree" value={item.degree} onChange={(e) => updateArrayField("education", index, "degree", e.target.value)} className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                  <button
                    type="button"
                    disabled={aiBusy === `edu-${index}`}
                    onClick={() =>
                      runResumeAi(
                        `edu-${index}`,
                        "education_line",
                        {
                          degree: item.degree,
                          institution: item.institution,
                          year: item.year,
                        },
                        (text) => updateArrayField("education", index, "degree", text.trim())
                      )
                    }
                    className="shrink-0 rounded-md border border-teal-200 bg-teal-50 px-2 py-1.5 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                  >
                    {aiBusy === `edu-${index}` ? "…" : "✨ AI degree line"}
                  </button>
                </div>
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
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">Description (one bullet per line)</span>
                    <button
                      type="button"
                      disabled={aiBusy === `proj-${index}`}
                      onClick={() =>
                        runResumeAi(
                          `proj-${index}`,
                          "project_description",
                          {
                            title: item.title,
                            technologies: item.technologies,
                            existing: item.description,
                          },
                          (text) =>
                            setFormData((prev) => {
                              const pj = [...prev.projects];
                              pj[index] = { ...pj[index], description: text };
                              return { ...prev, projects: pj };
                            })
                        )
                      }
                      className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                    >
                      {aiBusy === `proj-${index}` ? "…" : "✨ AI description"}
                    </button>
                  </div>
                  <textarea rows="3" placeholder="Description (one bullet per line)" value={item.description} onChange={(e) => updateArrayField("projects", index, "description", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
                </div>
                <input placeholder="Technologies (comma-separated)" value={item.technologies} onChange={(e) => updateArrayField("projects", index, "technologies", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                <input placeholder="Project Link" value={item.link} onChange={(e) => updateArrayField("projects", index, "link", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            ))}
            <button onClick={() => addRow("projects", { title: "", description: "", technologies: "", link: "" })} className="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">+ Add Project</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Skills and Certifications</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input placeholder="Skills (comma-separated)" value={formData.skills} onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))} className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
              <button
                type="button"
                disabled={aiBusy === "skills"}
                onClick={() =>
                  runResumeAi("skills", "skills", {}, (text) => setFormData((prev) => ({ ...prev, skills: text })))
                }
                className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 whitespace-nowrap"
              >
                {aiBusy === "skills" ? "…" : "✨ AI skills"}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">Certifications (one per line)</span>
                <button
                  type="button"
                  disabled={aiBusy === "certs"}
                  onClick={() =>
                    runResumeAi("certs", "certifications", {}, (text) =>
                      setFormData((prev) => ({ ...prev, certifications: text }))
                    )
                  }
                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {aiBusy === "certs" ? "…" : "✨ AI certifications"}
                </button>
              </div>
              <textarea rows="3" placeholder="Certifications (one per line)" value={formData.certifications} onChange={(e) => setFormData((prev) => ({ ...prev, certifications: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" />
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-8 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {`Template ${selectedTemplate === "template1" ? "1" : selectedTemplate === "template2" ? "2" : "3"} Preview`}
            </h2>
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
