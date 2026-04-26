import { GoogleGenAI } from "@google/genai";
import { extractGeminiText } from "../utils/geminiText.js";

const buildFallbackAdvice = ({ missingSkills = [], jobTitle = "internship", message = "" }) => {
    const skills = missingSkills.slice(0, 3);
    if (message && message.trim()) {
        return [
            `Great question. Keep your answer focused on the ${jobTitle} role expectations.`,
            "Pick one missing skill and practice it for 30 minutes today with a small hands-on task.",
            "Update your CV with one measurable improvement after each practice session.",
        ].join("\n");
    }
    if (skills.length === 0) {
        return [
            "- Start with one mock interview question and answer it out loud.",
            "- Revise your project examples so you can explain impact clearly.",
            "- Spend 30 minutes daily on role-specific fundamentals this week.",
        ].join("\n");
    }
    return [
        `- Pick "${skills[0]}" and complete one beginner tutorial today, then build a tiny demo.`,
        `- Practice "${skills[1] || skills[0]}" for 30 minutes daily and track progress in notes.`,
        `- Add one project bullet showing "${skills[2] || skills[0]}" usage to strengthen your CV.`,
    ].join("\n");
};

// POST /api/advisor
export const getMissingSkillsAdvice = async (req, res) => {
    try {
        const { missingSkills, jobTitle, history, message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        let contents = [];
        
        if (!history || history.length === 0) {
            if (!missingSkills || missingSkills.length === 0) {
                return res.status(400).json({ message: "No missing skills provided." });
            }
            const prompt = `You are an encouraging, expert career advisor.
A student is applying for a "${jobTitle || "internship"}" role but is missing the following skills: ${missingSkills.join(", ")}.
Provide exactly 3 short, highly actionable bullet points on how to start learning these skills today.
Do not use Markdown like asterisks or bolding. Use plain text formatting with hyphens for bullet points and clear newlines. Keep it extremely concise and encouraging.`;
            contents.push({ role: "user", parts: [{ text: prompt }] });
        } else {
            history.forEach(h => {
                contents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
            });
            contents.push({ role: "user", parts: [{ text: message }] });
        }

        if (!apiKey) {
            return res.json({ advice: buildFallbackAdvice({ missingSkills, jobTitle, message }) });
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });

        const advice = extractGeminiText(response) || buildFallbackAdvice({ missingSkills, jobTitle, message });
        res.json({ advice });
    } catch (e) {
        console.error("AI Advisor Error:", e);
        const { missingSkills, jobTitle, message } = req.body || {};
        res.json({ advice: buildFallbackAdvice({ missingSkills, jobTitle, message }) });
    }
};
