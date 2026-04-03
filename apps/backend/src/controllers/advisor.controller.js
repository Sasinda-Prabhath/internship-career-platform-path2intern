import { GoogleGenAI } from "@google/genai";

// POST /api/advisor
export const getMissingSkillsAdvice = async (req, res) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const { missingSkills, jobTitle, history, message } = req.body;
        
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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });

        res.json({ advice: response.text });
    } catch (e) {
        console.error("AI Advisor Error:", e);
        res.status(500).json({ message: "Failed to generate AI advice. Please try again later." });
    }
};
