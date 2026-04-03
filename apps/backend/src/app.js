import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import inviteRoutes from "./routes/invite.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import orgRoutes from "./routes/org.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Serve uploaded org documents and CVs as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Path2Intern API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/module", moduleRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/simulations", simulationRoutes);

export default app;