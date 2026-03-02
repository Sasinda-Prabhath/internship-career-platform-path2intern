import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const requireAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;

    if (!token) token = req.cookies.authToken;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, globalRole, staffRole?, moduleScopes? }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.globalRole) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.globalRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

/**
 * Check if a user has a given role for a given module.
 *
 * Checks TWO sources (in order):
 *  1. User.staffRole + User.moduleScopes   → invite-based staff (new system)
 *  2. ModuleScopedRole collection           → legacy manual assignments
 *
 * Returns the effective role string ("MODULE_MANAGER" | "MODULE_OPERATOR") or null.
 */
export const resolveModuleRole = async (userId, module, allowedRoles = ["MODULE_MANAGER", "MODULE_OPERATOR"]) => {
  // ── Source 1: User model (invite-based staff) ──────────────────────────────
  const user = await User.findById(userId).select("staffRole moduleScopes globalRole").lean();
  if (user && user.staffRole && user.moduleScopes?.includes(module)) {
    if (allowedRoles.includes(user.staffRole)) {
      return user.staffRole;
    }
  }

  // ── Source 2: ModuleScopedRole collection (legacy) ─────────────────────────
  try {
    const { ModuleScopedRole } = await import("../models/moduleScopedRole.model.js");
    const scoped = await ModuleScopedRole.findOne({
      userId,
      module,
      role: { $in: allowedRoles },
    }).lean();
    if (scoped) return scoped.role;
  } catch {
    // ModuleScopedRole collection may not always be present — not a hard failure
  }

  return null;
};

/**
 * Route middleware — verifies the caller holds one of allowedRoles for a module.
 *
 * Module code is resolved from (in order):
 *   hard-coded moduleCode arg → req.params.module → req.body.module → req.query.module
 *
 * On success sets req.resolvedModuleRole to the effective role string.
 */
export const requireModuleRole = (moduleCode, allowedRoles = ["MODULE_MANAGER"]) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

      const module =
        moduleCode ||
        req.params.module ||
        req.body.module ||
        req.query.module;

      if (!module) {
        return res.status(400).json({ message: "Module code is required" });
      }

      const role = await resolveModuleRole(req.user.userId, module, allowedRoles);
      if (!role) {
        return res.status(403).json({
          message: `You do not have a ${allowedRoles.join(" or ")} role for module ${module}`,
        });
      }

      req.resolvedModuleRole = role; // downstream controllers can read this
      next();
    } catch {
      res.status(500).json({ message: "Server error checking module role" });
    }
  };
};