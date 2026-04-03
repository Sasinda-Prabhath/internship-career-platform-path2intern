import { Portfolio } from "../models/portfolio.model.js";
import { User } from "../models/user.model.js";

const USERNAME_RE = /^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$/;

const normalizeUsername = (raw) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

const validateUsername = (s) => {
  if (!s) return "Username is required";
  if (s.length < 3 || s.length > 30) return "Username must be 3–30 characters";
  if (!USERNAME_RE.test(s))
    return "Use 3–30 characters: lowercase letters, numbers, hyphens (cannot start or end with a hyphen)";
  return null;
};

const sanitizeProjects = (projects) => {
  if (!Array.isArray(projects)) return [];
  return projects.map((p) => ({
    title: p?.title != null ? String(p.title) : "",
    description: p?.description != null ? String(p.description) : "",
    url: p?.url != null ? String(p.url) : "",
    tech: Array.isArray(p?.tech) ? p.tech.map((t) => String(t)).filter(Boolean) : [],
  }));
};

/** GET /api/portfolio/me */
export const getMine = async (req, res) => {
  try {
    let doc = await Portfolio.findOne({ userId: req.user.userId }).lean();
    if (!doc) {
      const user = await User.findById(req.user.userId).select("name email").lean();
      let base = (user?.email || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "") || "student";
      if (base.length < 3) base = `${base}stu`.slice(0, 30);
      let candidate = base.slice(0, 24);
      let n = 0;
      while (
        candidate.length < 3 ||
        (await Portfolio.exists({ username: candidate })) ||
        !USERNAME_RE.test(candidate)
      ) {
        n += 1;
        candidate = `${base.slice(0, 20)}-${n}`;
        if (candidate.length < 3) candidate = `stu-${n}`;
      }
      doc = await Portfolio.create({
        userId: req.user.userId,
        username: candidate,
        name: user?.name || "",
        headline: "",
        bio: "",
        skills: [],
        projects: [],
        education: "",
        socialLinks: {},
        theme: "light",
        isPublished: false,
      });
      doc = doc.toObject();
    }
    res.json({ portfolio: doc });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** POST /api/portfolio — create or update */
export const upsert = async (req, res) => {
  try {
    let { username, name, headline, bio, skills, projects, education, socialLinks, theme, isPublished } =
      req.body;

    let normalized = normalizeUsername(username);
    if (!normalized) {
      const existing = await Portfolio.findOne({ userId: req.user.userId }).select("username").lean();
      normalized = existing?.username || "";
    }

    const err = validateUsername(normalized);
    if (err) return res.status(400).json({ message: err });

    const taken = await Portfolio.findOne({
      username: normalized,
      userId: { $ne: req.user.userId },
    }).lean();
    if (taken) return res.status(409).json({ message: "That username is already taken" });

    const update = {
      username: normalized,
      name: name ?? "",
      headline: headline ?? "",
      bio: bio ?? "",
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [],
      projects: sanitizeProjects(projects),
      education: education ?? "",
      socialLinks:
        socialLinks && typeof socialLinks === "object"
          ? {
              github: socialLinks.github || "",
              linkedin: socialLinks.linkedin || "",
              twitter: socialLinks.twitter || "",
              website: socialLinks.website || "",
            }
          : {},
      theme: theme === "dark" ? "dark" : "light",
      isPublished: Boolean(isPublished),
    };

    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: update, $setOnInsert: { userId: req.user.userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Saved", portfolio });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "Username already taken" });
    }
    res.status(500).json({ message: e.message });
  }
};

/** GET /api/portfolio/:username — public, published only */
export const getPublicByUsername = async (req, res) => {
  try {
    const username = String(req.params.username || "").trim().toLowerCase();
    if (!username) return res.status(400).json({ message: "Username required" });

    const portfolio = await Portfolio.findOne({ username, isPublished: true })
      .populate("userId", "name email")
      .lean();

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json({ portfolio });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
