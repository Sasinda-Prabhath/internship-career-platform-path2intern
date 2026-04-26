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
import advisorRoutes from "./routes/advisor.routes.js";
import simulationRoutes from "./routes/simulation.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import resumeAiRoutes from "./routes/resumeAi.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
];

app.use(cors({
  origin: function(origin, callback) {
    callback(null, origin || "http://localhost:5173");
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Serve uploaded org documents and resumes as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/resumes", express.static(path.join(__dirname, "../uploads/resumes")));

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
app.use("/api/advisor", advisorRoutes);
app.use("/api/simulations", simulationRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/resume", resumeAiRoutes);

export default app;