import { GoogleGenAI } from "@google/genai";
import { extractGeminiText } from "../utils/geminiText.js";

const MODEL = "gemini-2.5-flash";

const buildPrompt = (action, context, template) => {
  const t = template || "template1";
  const name = context.name || "the student";
  const headline = context.headline || "";
  const skills = context.skills || "";
  const summaryHint = context.summaryHint || "";

  switch (action) {
    case "headline":
      return `You are a resume coach. Output EXACTLY ONE LINE and nothing else.
Rules: use ONLY English letters (A-Z, a-z) and spaces between words. No numbers, symbols, hyphens, slashes, or punctuation.
Maximum 70 characters. Describe a professional title for an internship seeker.
Student focus area hint: ${headline || "software development"}. Template style: ${t}.`;

    case "summary":
      return `Write a professional summary for a university student's resume (2–3 short paragraphs, plain sentences).
Student name: ${name}. Current headline: ${headline || "not set"}. Skills: ${skills || "not listed"}.
Extra context: ${summaryHint || "final-year undergraduate seeking internship."}
No bullet symbols at the start of paragraphs. No markdown. Tone: confident and concise.`;

    case "skills":
      return `Suggest a comma-separated list of 10–14 technical and professional skills for a student's resume.
Context — headline: ${headline}. Summary snippet: ${(context.summarySnippet || "").slice(0, 200)}.
Output ONLY the comma-separated list, no numbering or labels.`;

    case "experience_bullets":
      return `Improve or write 3–5 resume bullet points (one per line) for this experience.
Role: ${context.role || ""}. Company: ${context.company || ""}. Duration: ${context.duration || ""}.
Existing draft (may be empty):\n${context.existing || ""}
Rules: start each line with an action verb; include impact where possible; plain text lines only, no markdown.`;

    case "project_description":
      return `Write 2–4 bullet lines (one per line) describing this academic or personal project for a resume.
Title: ${context.title || ""}. Technologies: ${context.technologies || ""}.
Existing draft:\n${context.existing || ""}
Plain text only, no markdown.`;

    case "education_line":
      return `Write one short optional line (max 120 chars) to add under a degree on a resume (e.g. coursework or achievement), or leave as one line summary.
Degree: ${context.degree || ""}. Institution: ${context.institution || ""}. Year: ${context.year || ""}.
If nothing useful, output a single line highlighting relevant coursework or GPA only if plausible. Plain text.`;

    case "certifications":
      return `Suggest 3–5 certification or training lines for a student resume (one per line), realistic for a computing undergraduate.
Context skills: ${skills}. Plain text lines only, no numbering prefix.`;

    default:
      return null;
  }
};

const fallbackText = (action, context) => {
  const name = context.name || "Student";
  switch (action) {
    case "headline":
      return "Software Engineering Intern Seeking Team Collaboration Opportunities";
    case "summary":
      return `${name} is a motivated undergraduate with strong fundamentals in software development and teamwork. Eager to contribute to real world projects through a structured internship while continuing to grow technical and communication skills. Interested in roles that combine learning with measurable impact.`;
    case "skills":
      return "JavaScript, TypeScript, React, Node.js, HTML, CSS, Git, REST APIs, MongoDB, Agile, Problem Solving, Communication";
    case "experience_bullets":
      return `Collaborated with peers to deliver coursework projects on schedule\nParticipated in code reviews and documented technical decisions\nUsed version control and issue tracking in team settings`;
    case "project_description":
      return `Built a full stack application with clear user flows and data persistence\nImplemented core features using modern frameworks and best practices\nTested and refined functionality based on feedback`;
    case "education_line":
      return `Relevant coursework in data structures algorithms and software engineering`;
    case "certifications":
      return `Google Cloud Digital Leader Fundamentals\nMongoDB University M001 Introduction to MongoDB\nfreeCodeCamp Responsive Web Design`;
    default:
      return "Thanks for using Path2Intern. Add more context and try again.";
  }
};

/** POST /api/resume/ai */
export const suggestResumeField = async (req, res) => {
  try {
    const { action, context = {}, template } = req.body || {};
    const allowed = [
      "headline",
      "summary",
      "skills",
      "experience_bullets",
      "project_description",
      "education_line",
      "certifications",
    ];
    if (!allowed.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const prompt = buildPrompt(action, context, template);
    if (!prompt) return res.status(400).json({ message: "Could not build prompt" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ text: fallbackText(action, context), source: "fallback" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = extractGeminiText(response);
    if (action === "headline") {
      text = String(text || "")
        .replace(/[^A-Za-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
    }
    if (!text) text = fallbackText(action, context);

    res.json({ text, source: "gemini" });
  } catch (e) {
    console.error("Resume AI error:", e);
    const { action, context = {} } = req.body || {};
    res.json({
      text: fallbackText(action || "summary", context),
      source: "fallback",
    });
  }
};
