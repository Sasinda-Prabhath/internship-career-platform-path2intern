const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

// POST /api/auth/register
router.post("/register", (req, res, next) => {
  req.upload.single("profileImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "File upload error: " + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, role are required" });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one lowercase and one uppercase letter" });
    }

    if (!["STUDENT", "ORGANIZATION"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be STUDENT or ORGANIZATION" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);

    const status = role === "ORGANIZATION" ? "PENDING" : "ACTIVE";

    const userData = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status,
    };

    // Add profile image if uploaded
    if (req.file) {
      userData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.create(userData);

    return res.status(201).json({
      message: "Registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status === "SUSPENDED") {
      return res.status(403).json({ message: "Account suspended" });
    }

    if (user.role === "ORGANIZATION" && user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Organization not verified yet" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, profileImage: user.profileImage },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");
  return res.json({ user });
});

// PUT /api/auth/update-profile
router.put("/update-profile", requireAuth, (req, res, next) => {
  req.upload.single("profileImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "File upload error: " + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;

    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const updateData = { name, email: email.toLowerCase() };

    // Add profile image if uploaded
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin routes
// GET /api/auth/pending-orgs
router.get("/pending-orgs", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const pendingOrgs = await User.find({ role: "ORGANIZATION", status: "PENDING" }).select("-passwordHash");
    return res.json({ organizations: pendingOrgs });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/auth/approve-org/:id
router.put("/approve-org/:id", requireAuth, requireRole("SYSTEM_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: "ACTIVE" }, { new: true }).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "Organization not found" });
    if (user.role !== "ORGANIZATION") return res.status(400).json({ message: "User is not an organization" });

    return res.json({ message: "Organization approved", user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
