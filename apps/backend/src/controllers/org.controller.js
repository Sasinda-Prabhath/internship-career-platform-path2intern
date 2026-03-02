import { User } from "../models/user.model.js";

// GET /api/org/pending  — UniAdmin: list orgs awaiting approval
export const listPendingOrgs = async (req, res) => {
    try {
        const orgs = await User.find({ globalRole: "ORGANIZATION", status: "PENDING" })
            .select("name email organizationName documentUrl createdAt status")
            .sort({ createdAt: 1 })
            .lean();
        res.json({ total: orgs.length, organizations: orgs });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/org/all — UniAdmin: list ALL orgs (pending + active + suspended)
export const listAllOrgs = async (req, res) => {
    try {
        const orgs = await User.find({ globalRole: "ORGANIZATION" })
            .select("name email organizationName documentUrl status approvalNote createdAt")
            .sort({ createdAt: -1 })
            .lean();
        res.json({ total: orgs.length, organizations: orgs });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// PATCH /api/org/:id/approve  — set status ACTIVE
export const approveOrg = async (req, res) => {
    try {
        const org = await User.findById(req.params.id);
        if (!org || org.globalRole !== "ORGANIZATION") {
            return res.status(404).json({ message: "Organization not found" });
        }
        org.status = "ACTIVE";
        org.approvalNote = null;
        await org.save();
        res.json({ message: `${org.organizationName || org.name} approved successfully` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// PATCH /api/org/:id/decline  — set status SUSPENDED, save note
export const declineOrg = async (req, res) => {
    try {
        const { note } = req.body;
        const org = await User.findById(req.params.id);
        if (!org || org.globalRole !== "ORGANIZATION") {
            return res.status(404).json({ message: "Organization not found" });
        }
        org.status = "SUSPENDED";
        org.approvalNote = note || "Application declined";
        await org.save();
        res.json({ message: `${org.organizationName || org.name} declined` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
