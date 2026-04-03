import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generic mailer used by contact reply, etc.
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: '"Path2Intern" <noreply@path2intern.com>',
    to, subject, html,
  });
  console.log("Email sent:", info.messageId);
  return true;
};

export const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: '"Path2Intern" <noreply@path2intern.com>',
    to: email,
    subject: "Verify Your Email - Path2Intern",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Path2Intern!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Your Verification Code:</h3>
          <p style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px; margin: 0;">${verificationCode}</p>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Path2Intern - Connecting Students with Opportunities</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Verification email sent:", info.messageId);
  return true;
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Path2Intern" <noreply@path2intern.com>',
    to: email,
    subject: "Reset Your Password - Path2Intern",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Path2Intern account.</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Path2Intern - Connecting Students with Opportunities</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Password reset email sent:", info.messageId);
  return true;
};

export const sendInviteEmail = async (email, name, inviteCode) => {
  const transporter = createTransporter();
  const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite`;

  const mailOptions = {
    from: '"Path2Intern" <noreply@path2intern.com>',
    to: email,
    subject: "Your Staff Invite - Path2Intern",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Path2Intern, ${name}!</h2>
        <p>You have been invited to join Path2Intern as staff. Please activate your account using the invite code below.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Your Invite Code:</h3>
          <p style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px; margin: 0; font-family: monospace;">${inviteCode}</p>
        </div>
        <a href="${acceptLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Activate Account</a>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${acceptLink}</p>
        <p>This invite will expire in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Path2Intern - Connecting Students with Opportunities</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Invite email sent:", info.messageId);
  return true;
};
