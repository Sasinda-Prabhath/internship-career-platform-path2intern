import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { sendInviteEmail } from "../services/email.service.js";

const INVITE_EXPIRY_DAYS = 7;
const VALID_MODULES = ["DS", "SE", "QA", "BA", "PM"];
const VALID_STAFF_ROLES = ["MODULE_MANAGER", "MODULE_OPERATOR"];

// Generates a readable 8-char uppercase alphanumeric code, e.g. "AB12CD34"
const generateInviteCode = () =>
    crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 8);

// ─── Create / Invite ──────────────────────────────────────────────────────────

/**
 * POST /api/invite/staff
 * Body: { name, email, staffRole, moduleScopes }
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const inviteStaff = async (req, res) => {
    try {
        const { name, email, staffRole, moduleScopes } = req.body;

        if (!name || !email || !staffRole || !moduleScopes?.length) {
            return res.status(400).json({
                message: "name, email, staffRole, and at least one moduleScope are required",
            });
        }
        if (!VALID_STAFF_ROLES.includes(staffRole)) {
            return res.status(400).json({ message: `staffRole must be one of: ${VALID_STAFF_ROLES.join(", ")}` });
        }
        const invalidModules = moduleScopes.filter((m) => !VALID_MODULES.includes(m));
        if (invalidModules.length) {
            return res.status(400).json({ message: `Invalid module(s): ${invalidModules.join(", ")}` });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        // Generate a plain invite code and store its hash
        const plainCode = generateInviteCode();
        const inviteToken = await bcrypt.hash(plainCode, 10);
        const inviteExpiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const user = await User.create({
            name,
            email: normalizedEmail,
            globalRole: "STAFF",
            staffRole,
            moduleScopes,
            status: "INVITED",
            inviteToken,
            inviteExpiresAt,
            invitedBy: req.user.userId,
            isEmailVerified: false, // will be marked true on accept
        });

        // Send invite email
        try {
            await sendInviteEmail(normalizedEmail, name, plainCode);
        } catch (emailError) {
            console.error("Failed to send invite email:", emailError);
            // Don't fail the invite if email fails
        }

        res.status(201).json({
            message: `Invite created for ${name}`,
            inviteCode: plainCode,         // Give this to the admin to share manually
            expiresAt: inviteExpiresAt,
            staff: {
                id: user._id,
                name: user.name,
                email: user.email,
                staffRole: user.staffRole,
                moduleScopes: user.moduleScopes,
                status: user.status,
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── List staff ───────────────────────────────────────────────────────────────

/**
 * GET /api/invite/staff
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const listStaff = async (req, res) => {
    try {
        const staff = await User.find({ globalRole: "STAFF" })
            .select("-passwordHash -emailVerificationCodeHash -inviteToken")
            .populate("invitedBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ total: staff.length, staff });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// ─── Accept invite ────────────────────────────────────────────────────────────

/**
 * POST /api/invite/accept
 * Body: { code, password }
 * Public — no auth required
 */
export const acceptInvite = async (req, res) => {
    try {
        const { code, password } = req.body;
        if (!code || !password) {
            return res.status(400).json({ message: "code and password are required" });
        }

        // Password strength
        if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
        if (!/[A-Z]/.test(password)) return res.status(400).json({ message: "Password must contain an uppercase letter" });
        if (!/[a-z]/.test(password)) return res.status(400).json({ message: "Password must contain a lowercase letter" });
        if (!/[0-9]/.test(password)) return res.status(400).json({ message: "Password must contain a number" });

        // Find all INVITED users and check the code against each (bcrypt compare)
        // Limit search to non-expired invites first
        const candidates = await User.find({
            status: "INVITED",
            inviteExpiresAt: { $gt: new Date() },
            inviteToken: { $ne: null },
        });

        let matchedUser = null;
        for (const candidate of candidates) {
            const match = await bcrypt.compare(code.toUpperCase().trim(), candidate.inviteToken);
            if (match) { matchedUser = candidate; break; }
        }

        if (!matchedUser) {
            return res.status(400).json({
                message: "Invalid or expired invite code. Please ask your University Admin for a new one.",
            });
        }

        matchedUser.passwordHash = await bcrypt.hash(password, 10);
        matchedUser.status = "ACTIVE";
        matchedUser.isEmailVerified = true; // staff are trusted — no OTP needed
        matchedUser.inviteToken = null;
        matchedUser.inviteExpiresAt = null;
        await matchedUser.save();

        res.json({
            message: "Account activated! You can now log in with your email and password.",
            user: {
                name: matchedUser.name,
                email: matchedUser.email,
                globalRole: matchedUser.globalRole,
                staffRole: matchedUser.staffRole,
            },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── Regenerate invite code ───────────────────────────────────────────────────

/**
 * POST /api/invite/staff/:id/regenerate
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const regenerateCode = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.globalRole !== "STAFF") return res.status(404).json({ message: "Staff member not found" });

        if (user.status === "ACTIVE") {
            return res.status(400).json({ message: "User has already accepted their invite. No need to regenerate." });
        }

        const plainCode = generateInviteCode();
        user.inviteToken = await bcrypt.hash(plainCode, 10);
        user.inviteExpiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        user.status = "INVITED";
        await user.save();

        res.json({
            message: "New invite code generated",
            inviteCode: plainCode,
            expiresAt: user.inviteExpiresAt,
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── Update staff role / scopes ───────────────────────────────────────────────

/**
 * PATCH /api/invite/staff/:id
 * Body: { staffRole?, moduleScopes? }
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const updateStaff = async (req, res) => {
    try {
        const { staffRole, moduleScopes } = req.body;
        const user = await User.findById(req.params.id);
        if (!user || user.globalRole !== "STAFF") return res.status(404).json({ message: "Staff member not found" });

        if (staffRole !== undefined) {
            if (!VALID_STAFF_ROLES.includes(staffRole)) {
                return res.status(400).json({ message: `staffRole must be one of: ${VALID_STAFF_ROLES.join(", ")}` });
            }
            user.staffRole = staffRole;
        }
        if (moduleScopes !== undefined) {
            const invalid = moduleScopes.filter((m) => !VALID_MODULES.includes(m));
            if (invalid.length) return res.status(400).json({ message: `Invalid modules: ${invalid.join(", ")}` });
            user.moduleScopes = moduleScopes;
        }

        await user.save();
        res.json({
            message: "Staff member updated",
            staff: { id: user._id, staffRole: user.staffRole, moduleScopes: user.moduleScopes },
        });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── Suspend / reactivate ────────────────────────────────────────────────────

/**
 * PATCH /api/invite/staff/:id/status
 * Body: { status: "ACTIVE" | "SUSPENDED" }
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["ACTIVE", "SUSPENDED"].includes(status)) {
            return res.status(400).json({ message: 'status must be "ACTIVE" or "SUSPENDED"' });
        }

        const user = await User.findById(req.params.id);
        if (!user || user.globalRole !== "STAFF") return res.status(404).json({ message: "Staff member not found" });

        user.status = status;
        await user.save();

        res.json({ message: `Account ${status === "SUSPENDED" ? "suspended" : "reactivated"}`, status: user.status });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/invite/staff/:id
 * Guard: UNIVERSITY_ADMIN or SYSTEM_ADMIN
 */
export const deleteStaff = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.globalRole !== "STAFF") return res.status(404).json({ message: "Staff member not found" });

        await User.deleteOne({ _id: user._id });
        res.json({ message: `${user.name} has been removed` });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};
