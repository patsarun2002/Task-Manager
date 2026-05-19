import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import "dotenv/config";
import helmet from "helmet";

// ── [P1-Security] Validate required env vars before anything else ─────────────
const REQUIRED_ENV = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import prisma from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins =
  process.env.ALLOWED_ORIGIN?.split(",").map((o) => o.trim()) ?? [];

// ── Middleware ────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true, // จำเป็นสำหรับ HttpOnly cookie
  }),
);
app.use(express.json());
app.use(cookieParser()); // อ่าน cookie จาก request
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
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

// ── Cron: ล้าง expired refresh tokens ทุกวัน 02:00 น. ──
cron.schedule("0 2 * * *", async () => {
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`[cron] cleaned up ${count} expired refresh tokens`);
  } catch (err) {
    console.error("[cron] cleanup failed:", err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
