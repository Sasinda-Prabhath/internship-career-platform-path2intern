import { api } from "./api";

// Create a staff invite (returns plaintext invite code)
export const inviteStaff = (data) =>
    api.post("/api/invite/staff", data);

// List all STAFF users
export const listStaff = () =>
    api.get("/api/invite/staff");

// Regenerate invite code for an existing INVITED user
export const regenerateCode = (id) =>
    api.post(`/api/invite/staff/${id}/regenerate`);

// Update staffRole / moduleScopes
export const updateStaff = (id, data) =>
    api.patch(`/api/invite/staff/${id}`, data);

// Suspend or reactivate
export const updateStatus = (id, status) =>
    api.patch(`/api/invite/staff/${id}/status`, { status });

// Delete staff member
export const deleteStaff = (id) =>
    api.delete(`/api/invite/staff/${id}`);

// Accept invite (public — no auth cookie needed)
export const acceptInvite = (code, password) =>
    api.post("/api/invite/accept", { code, password });
