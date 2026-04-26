/** Mock AI endpoints — return placeholder text for portfolio editor */

export const generateBio = async (req, res) => {
  try {
    const { headline, skills } = req.body || {};
    const skillList = Array.isArray(skills) ? skills.slice(0, 5).join(", ") : "software development";
    const text = `Passionate about ${headline || "building useful products"}. I enjoy ${skillList} and shipping clean, maintainable code. Currently seeking opportunities to grow with a collaborative team and contribute to meaningful projects.`;
    res.json({ text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const improveProject = async (req, res) => {
  try {
    const { title, description } = req.body || {};
    const text = `${title ? `Project: ${title}. ` : ""}${description || "This project"} demonstrates problem-solving, ownership, and attention to detail. It includes clear structure, thoughtful trade-offs, and outcomes you can discuss in interviews. Consider adding metrics (performance, users, or impact) if available.`;
    res.json({ text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const suggestSkills = async (req, res) => {
  try {
    const { headline, bio } = req.body || {};
    const pool = ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB", "Git", "REST APIs", "Tailwind CSS", "Testing", "CI/CD"];
    res.json({
      skills: pool.slice(0, 8),
      note: headline || bio ? "Suggested based on typical stacks for your profile." : "Common skills to consider adding.",
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
