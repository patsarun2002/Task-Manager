import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import "dotenv/config";
import helmet from "helmet";

import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeBody } from "./middleware/sanitize.js";

const app = express();

// ── Health check ──────────────────────────────────────
// วางก่อน cors/helmet ทุกตัว — cron job ไม่โดน block
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Middleware ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()) ?? [];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) =>
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")(
    req,
    res,
    next,
  ),
);
app.use(sanitizeBody);
app.use("/api", apiLimiter);

// ── Routes ────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => res.json({ message: "Server running" }));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

export default app;
