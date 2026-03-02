import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { sendVerificationEmail } from "./email.service.js";

// ─── Domain validation ────────────────────────────────────────────────────────
// Only students must use @my.sliit.lk.
// Staff are INVITED by University Admin — any email is accepted.
const validateEmailByRole = (email, role) => {
  const e = email.toLowerCase();
  if (role === "STUDENT" && !e.endsWith("@my.sliit.lk")) {
    throw new Error("Student email must end with @my.sliit.lk");
  }
  // STAFF can use any email (gmail, outlook, etc.)
};

const generate6DigitCode = () => String(Math.floor(100000 + Math.random() * 900000));

const validatePassword = (password) => {
  if (password.length < 8) throw new Error("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) throw new Error("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) throw new Error("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) throw new Error("Password must contain at least one number");
};

// ─── Student registration ─────────────────────────────────────────────────────

export const registerStudent = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("Email already registered");

  validateEmailByRole(email, "STUDENT");
  validatePassword(password);

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generate6DigitCode();
  const emailVerificationCodeHash = await bcrypt.hash(code, 10);
  const emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = await User.create({
    name,
    email,
    passwordHash,
    globalRole: "STUDENT",
    status: "ACTIVE",
    isEmailVerified: false,
    emailVerificationCodeHash,
    emailVerificationExpiresAt,
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError.message);
    await User.findByIdAndDelete(user._id);
    throw new Error("Failed to send verification email. Please try again.");
  }

  return { user };
};

// ─── Email OTP verification ───────────────────────────────────────────────────

export const verifyEmail = async ({ email, code }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");
  if (user.isEmailVerified) return user;

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
    throw new Error("No verification code found. Please request a new one.");
  }
  if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
    throw new Error("Verification code expired. Please request a new one.");
  }

  const ok = await bcrypt.compare(code, user.emailVerificationCodeHash);
  if (!ok) throw new Error("Invalid verification code");

  user.isEmailVerified = true;
  user.emailVerificationCodeHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  return user;
};

export const resendVerificationCode = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");
  if (user.isEmailVerified) throw new Error("Email is already verified");

  // Only students have domain-validated re-send
  validateEmailByRole(user.email, user.globalRole === "STUDENT" ? "STUDENT" : null);

  const code = generate6DigitCode();
  user.emailVerificationCodeHash = await bcrypt.hash(code, 10);
  user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(user.email, code);
  } catch {
    throw new Error("Failed to send verification email");
  }

  return { user };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email. Please register first.");

  // Staff who haven't accepted their invite yet cannot log in
  if (user.status === "INVITED") {
    throw new Error("Please accept your invite first. Use the invite code provided by your University Admin.");
  }
  if (user.status === "PENDING") {
    throw new Error("Your account is pending approval by the University Admin. You will be notified once approved.");
  }
  if (user.status === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact your University Admin.");
  }

  if (!user.passwordHash) {
    throw new Error("No password set. Please accept your invitation first.");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  // Students must verify email; STAFF are activated via invite (no OTP needed)
  if (user.globalRole === "STUDENT" && !user.isEmailVerified) {
    throw new Error("Email not verified. Please check your email for the verification code.");
  }

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      globalRole: user.globalRole,
      staffRole: user.staffRole || null,
      moduleScopes: user.moduleScopes || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
};

// ─── Organisation registration ────────────────────────────────────────────────

export const registerOrganization = async ({ name, email, password, organizationName, documentUrl }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("Email already registered");

  // Orgs can use any email (gmail, outlook, etc.) — no domain restriction
  validatePassword(password);

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generate6DigitCode();
  const emailVerificationCodeHash = await bcrypt.hash(code, 10);
  const emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    globalRole: "ORGANIZATION",
    organizationName: organizationName || name,
    documentUrl: documentUrl || null,
    // OTP verified but still PENDING until UniAdmin approves
    status: "PENDING",
    isEmailVerified: false,
    emailVerificationCodeHash,
    emailVerificationExpiresAt,
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError.message);
    await User.findByIdAndDelete(user._id);
    throw new Error("Failed to send verification email. Please try again.");
  }

  return { user };
};
