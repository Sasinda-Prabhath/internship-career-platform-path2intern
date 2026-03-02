import { Router } from "express";
import { submitContact, listContacts, replyContact, deleteContact } from "../controllers/contact.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Public — anyone can submit a contact form
router.post("/", submitContact);

// SYSTEM_ADMIN only
router.get("/", requireAuth, requireRole("SYSTEM_ADMIN"), listContacts);
router.post("/:id/reply", requireAuth, requireRole("SYSTEM_ADMIN"), replyContact);
router.delete("/:id", requireAuth, requireRole("SYSTEM_ADMIN"), deleteContact);

export default router;
