import jwt from "jsonwebtoken";
import {
  registerStudent,
  registerOrganization,
  verifyEmail,
  resendVerificationCode,
  loginUser,
} from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { uploadOrgDoc } from "../middleware/upload.middleware.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Derive moduleScopedRoles array from a user document.
 *  - STAFF users: built from user.staffRole + user.moduleScopes (stored on User)
 *  - Others: empty array (no scoped roles in this system)
 */
const deriveModuleScopedRoles = (user) => {
  if (user.globalRole === "STAFF" && user.staffRole && user.moduleScopes?.length > 0) {
    return user.moduleScopes.map((module) => ({ module, role: user.staffRole }));
  }
  return [];
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { user } = await registerStudent({ name, email, password });
    res.status(201).json({
      message: "Registered successfully. Please check your email for your verification code.",
      user: { id: user._id, name: user.name, email: user.email, globalRole: user.globalRole },
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const registerOrg = (req, res) => {
  uploadOrgDoc(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || "File upload failed" });
    }
    try {
      const { name, email, password, organizationName } = req.body;
      const documentUrl = req.file
        ? `/uploads/org-docs/${req.file.filename}`
        : null;

      const { user } = await registerOrganization({
        name,
        email,
        password,
        organizationName,
        documentUrl,
      });
      res.status(201).json({
        message: "Registered successfully. Please check your email for your OTP verification code.",
        user: { id: user._id, name: user.name, email: user.email, globalRole: user.globalRole, organizationName: user.organizationName },
      });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });
};

export const verify = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await verifyEmail({ email, code });
    res.json({
      message: "Email verified successfully",
      user: { id: user._id, name: user.name, email: user.email, globalRole: user.globalRole },
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const resend = async (req, res) => {
  try {
    const { email } = req.body;
    await resendVerificationCode({ email });
    res.json({ message: "Verification code resent. Please check your email." });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    res.cookie("authToken", token, COOKIE_OPTIONS);

    const moduleScopedRoles = deriveModuleScopedRoles(user);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        staffRole: user.staffRole || null,
        moduleScopes: user.moduleScopes || [],
        status: user.status,
        organizationName: user.organizationName || null,
        moduleScopedRoles,
      },
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ message: "Logged out successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Session restoration
export const me = async (req, res) => {
  try {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select(
      "-passwordHash -emailVerificationCodeHash -emailVerificationExpiresAt -inviteToken"
    );
    if (!user) return res.status(401).json({ message: "User not found" });

    if (user.status === "INVITED" || user.status === "PENDING") {
      return res.status(401).json({ message: "Please accept your invite or await approval." });
    }

    const moduleScopedRoles = deriveModuleScopedRoles(user);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        staffRole: user.staffRole || null,
        moduleScopes: user.moduleScopes || [],
        status: user.status,
        organizationName: user.organizationName || null,
        moduleScopedRoles,
      },
    });
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
};