import { Contact } from "../models/contact.model.js";
import { sendEmail } from "../services/email.service.js";

// POST /api/contact — public, submit a contact form message
export const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const contact = await Contact.create({ name, email, subject, message });
        res.status(201).json({ message: "Message sent successfully! We'll get back to you soon.", id: contact._id });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/contact — SYSTEM_ADMIN only: list all messages
export const listContacts = async (req, res) => {
    try {
        const contacts = await Contact.find()
            .populate("repliedBy", "name email")
            .sort({ createdAt: -1 })
            .lean();
        res.json({ total: contacts.length, contacts });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// POST /api/contact/:id/reply — SYSTEM_ADMIN: reply via email
export const replyContact = async (req, res) => {
    try {
        const { replyText } = req.body;
        if (!replyText) return res.status(400).json({ message: "Reply text is required" });

        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Message not found" });

        // Send email reply
        await sendEmail({
            to: contact.email,
            subject: `Re: ${contact.subject} — Path2Intern`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                    <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0;">
                        <h2 style="color: #60a5fa; margin: 0; font-size: 20px;">Path2Intern</h2>
                    </div>
                    <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                        <p style="color: #334155; margin-top: 0;">Hi <strong>${contact.name}</strong>,</p>
                        <p style="color: #334155;">Thank you for reaching out. Here's our response to your message:</p>
                        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; color: #475569; margin: 16px 0;">
                            ${replyText.replace(/\n/g, "<br>")}
                        </blockquote>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="color: #94a3b8; font-size: 12px;">
                            Your original message: "${contact.message}"<br/><br/>
                            Path2Intern Team
                        </p>
                    </div>
                </div>
            `,
        });

        contact.replied = true;
        contact.replyText = replyText;
        contact.repliedAt = new Date();
        contact.repliedBy = req.user.userId;
        await contact.save();

        res.json({ message: "Reply sent successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// DELETE /api/contact/:id — SYSTEM_ADMIN only
export const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Message not found" });
        await Contact.deleteOne({ _id: contact._id });
        res.json({ message: "Message deleted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
